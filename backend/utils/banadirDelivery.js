/**
 * Banadir (Mogadishu) districts — warehouse hub is Hodan.
 * Delivery fee scales with approximate road distance from Hodan.
 * Fees stay Waafi-test friendly ($0.01 steps).
 */

const WAREHOUSE_DISTRICT = 'Hodan';

/** Approximate km from Hodan center (furniture warehouse). */
const BANADIR_DISTRICTS = [
  { name: 'Hodan', kmFromHodan: 0 },
  { name: 'Howlwadaag', kmFromHodan: 2.5 },
  { name: 'Bondhere', kmFromHodan: 3.5 },
  { name: 'Waberi', kmFromHodan: 3.5 },
  { name: 'Wadajir', kmFromHodan: 4 },
  { name: 'Hamarweyne', kmFromHodan: 4.5 },
  { name: 'Hamarjajab', kmFromHodan: 5 },
  { name: 'Shangani', kmFromHodan: 5.5 },
  { name: 'Shibis', kmFromHodan: 5.5 },
  { name: 'Abdiaziz', kmFromHodan: 6 },
  { name: 'Warta Nabada', kmFromHodan: 6.5 },
  { name: 'Karaan', kmFromHodan: 6 },
  { name: 'Yaqshid', kmFromHodan: 9 },
  { name: 'Dharkenley', kmFromHodan: 9.5 },
  { name: 'Huriwa', kmFromHodan: 11 },
  { name: 'Gubta', kmFromHodan: 12 },
  { name: 'Dayniile', kmFromHodan: 13 },
  { name: 'Daru Salaam', kmFromHodan: 14 },
  { name: 'Kahda', kmFromHodan: 15 },
  { name: 'Garasbaley', kmFromHodan: 17 },
];

/**
 * Distance → fee ($). Closer to Hodan = cheaper.
 * Shibis (~5.5km) and Karaan (~7.5km) stay near each other in price.
 */
function deliveryFeeFromKm(km) {
  const d = Math.max(0, Number(km) || 0);
  if (d <= 0) return 0.01; // same district as warehouse
  if (d <= 3) return 0.01;
  if (d <= 6) return 0.02;
  if (d <= 10) return 0.03;
  if (d <= 14) return 0.04;
  return 0.05;
}

function buildDefaultDeliveryFees() {
  return BANADIR_DISTRICTS.map(({ name, kmFromHodan }) => ({
    district: name,
    fee: deliveryFeeFromKm(kmFromHodan),
    kmFromHodan,
  }));
}

function getDistrictKm(districtName) {
  const key = String(districtName || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  const row = BANADIR_DISTRICTS.find(
    (d) =>
      d.name.toLowerCase() === key ||
      key.includes(d.name.toLowerCase()) ||
      d.name.toLowerCase().includes(key)
  );
  return row ? row.kmFromHodan : null;
}

function feeForDistrictName(districtName) {
  const km = getDistrictKm(districtName);
  if (km == null) return null;
  return deliveryFeeFromKm(km);
}

/** Merge CMS fees with full Banadir list (keeps admin overrides; fills missing). */
function mergeBanadirDeliveryFees(existing = []) {
  const defaults = buildDefaultDeliveryFees();
  const byName = new Map();
  (existing || []).forEach((row) => {
    const name = String(row?.district || '').trim();
    if (!name) return;
    byName.set(name.toLowerCase(), {
      district: name,
      fee: Number(row.fee),
    });
  });

  return defaults.map((def) => {
    const prev = byName.get(def.district.toLowerCase());
    if (prev && Number.isFinite(prev.fee) && prev.fee >= 0) {
      return { district: def.district, fee: prev.fee, kmFromHodan: def.kmFromHodan };
    }
    return { district: def.district, fee: def.fee, kmFromHodan: def.kmFromHodan };
  });
}

module.exports = {
  WAREHOUSE_DISTRICT,
  BANADIR_DISTRICTS,
  deliveryFeeFromKm,
  buildDefaultDeliveryFees,
  getDistrictKm,
  feeForDistrictName,
  mergeBanadirDeliveryFees,
};
