const CmsContent = require('../models/CmsContent');

const FALLBACK_FEES = [
  { district: 'Hodan', fee: 0.001 },
  { district: 'Wadajir', fee: 0.001 },
  { district: 'Karaan', fee: 0.002 },
  { district: 'Hamarweyne', fee: 0.001 },
  { district: 'Dayniile', fee: 0.002 },
  { district: 'Yaqshid', fee: 0.001 },
];

function parseDistrictFromAddress(address) {
  if (!address) return '';
  const match = String(address).match(/,\s*([^,]+?)\s+District/i);
  return match ? match[1].trim() : '';
}

async function getDeliveryFees() {
  const cms = await CmsContent.findOne({ id: 'main' });
  if (cms?.deliveryFees?.length) return cms.deliveryFees;
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

  if (!entry) {
    return {
      ok: false,
      message: `Delivery to "${districtName}" is not available. Please select a supported district.`,
      district: districtName,
    };
  }

  return {
    ok: true,
    fee: Number(entry.fee) || 0,
    district: entry.district,
  };
}

module.exports = { resolveDistrictDeliveryFee, parseDistrictFromAddress, getDeliveryFees };
