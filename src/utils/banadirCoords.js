/** Approximate Banadir district centers for free in-app maps (OSM). */
export const MOGADISHU_CENTER = { lat: 2.0469, lng: 45.3182 };

export const DISTRICT_COORDS = {
  Hodan: { lat: 2.0372, lng: 45.3185 },
  Howlwadaag: { lat: 2.0415, lng: 45.332 },
  Bondhere: { lat: 2.034, lng: 45.341 },
  Waberi: { lat: 2.028, lng: 45.325 },
  Wadajir: { lat: 2.018, lng: 45.308 },
  Hamarweyne: { lat: 2.0335, lng: 45.3435 },
  Hamarjajab: { lat: 2.029, lng: 45.348 },
  Shangani: { lat: 2.0378, lng: 45.351 },
  Shibis: { lat: 2.052, lng: 45.348 },
  Abdiaziz: { lat: 2.046, lng: 45.355 },
  'Warta Nabada': { lat: 2.055, lng: 45.328 },
  Karaan: { lat: 2.062, lng: 45.355 },
  Yaqshid: { lat: 2.078, lng: 45.348 },
  Dharkenley: { lat: 2.015, lng: 45.285 },
  Huriwa: { lat: 2.095, lng: 45.36 },
  Gubta: { lat: 2.01, lng: 45.27 },
  Dayniile: { lat: 2.1, lng: 45.3 },
  'Daru Salaam': { lat: 2.11, lng: 45.28 },
  Kahda: { lat: 2.0, lng: 45.25 },
  Garasbaley: { lat: 1.98, lng: 45.22 },
};

export function resolveOrderCoords(order) {
  const lat = Number(order?.deliveryLat ?? order?.lat);
  const lng = Number(order?.deliveryLng ?? order?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng, approx: false };
  }

  const address = String(order?.address || '');
  const district = address.split(',')[0]?.trim() || '';
  const key = Object.keys(DISTRICT_COORDS).find(
    (name) =>
      name.toLowerCase() === district.toLowerCase() ||
      address.toLowerCase().includes(name.toLowerCase())
  );
  if (key) return { ...DISTRICT_COORDS[key], approx: true, district: key };
  return { ...MOGADISHU_CENTER, approx: true, district: district || 'Mogadishu' };
}
