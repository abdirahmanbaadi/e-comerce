const CmsContent = require('../models/CmsContent');
const {
  buildDefaultDeliveryFees,
  mergeBanadirDeliveryFees,
  feeForDistrictName,
} = require('./banadirDelivery');

const FALLBACK_FEES = buildDefaultDeliveryFees().map(({ district, fee }) => ({ district, fee }));

function parseDistrictFromAddress(address) {
  if (!address) return '';
  const match = String(address).match(/,\s*([^,]+?)\s+District/i);
  if (match) return match[1].trim();
  // "Hodan, Mogadishu" or "Shibis"
  const first = String(address).split(',')[0]?.trim();
  return first || '';
}

async function getDeliveryFees() {
  const cms = await CmsContent.findOne({ id: 'main' });
  if (cms?.deliveryFees?.length) {
    return mergeBanadirDeliveryFees(cms.deliveryFees).map(({ district, fee }) => ({
      district,
      fee,
    }));
  }
  return FALLBACK_FEES;
}

async function resolveDistrictDeliveryFee({ district, address }) {
  const districtName = (district || parseDistrictFromAddress(address) || '').trim();
  if (!districtName) {
    return { ok: true, fee: 0, district: '' };
  }

  const fees = await getDeliveryFees();
  const entry = fees.find(
    (row) =>
      row.district.toLowerCase() === districtName.toLowerCase() ||
      districtName.toLowerCase().includes(row.district.toLowerCase())
  );

  if (entry) {
    return {
      ok: true,
      fee: Number(entry.fee) || 0,
      district: entry.district,
    };
  }

  // Fallback: compute from Hodan distance if district is known Banadir
  const computed = feeForDistrictName(districtName);
  if (computed != null) {
    return { ok: true, fee: computed, district: districtName };
  }

  return {
    ok: false,
    message: `Delivery to "${districtName}" is not available. Please select a supported Banadir district.`,
    district: districtName,
  };
}

module.exports = { resolveDistrictDeliveryFee, parseDistrictFromAddress, getDeliveryFees };
