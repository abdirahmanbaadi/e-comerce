/** Store price tables — must match backend/utils/pricing.js */
export const PRODUCT_PRICES = [0.01, 0.03, 0.01, 0.02, 0.03, 0.01, 0.02, 0.01, 0.03, 0.02];
export const PRODUCT_OLD_PRICES = [0.02, 0.04, 0.02, 0.03, 0.04, 0.02, 0.03, 0.02, 0.04, 0.03];
export const DELIVERY_FEES = [0.01, 0.01, 0.02, 0.01, 0.02, 0.01];

export const DELIVERY_FEE = DELIVERY_FEES[0];
export const DELIVERY_FEE_ALT = DELIVERY_FEES[2];

function slotIndex(productId, index = 0) {
  return typeof productId === 'number' ? productId - 1 : index;
}

export function priceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx = ((slot % PRODUCT_PRICES.length) + PRODUCT_PRICES.length) % PRODUCT_PRICES.length;
  return PRODUCT_PRICES[idx];
}

export function oldPriceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx =
    ((slot % PRODUCT_OLD_PRICES.length) + PRODUCT_OLD_PRICES.length) % PRODUCT_OLD_PRICES.length;
  return PRODUCT_OLD_PRICES[idx];
}

export function getDistrictFee(districtValue, districts = []) {
  const index = districts.findIndex((d) => d.value === districtValue);
  if (index >= 0) return Number(districts[index].fee) || DELIVERY_FEE;
  return DELIVERY_FEE;
}
