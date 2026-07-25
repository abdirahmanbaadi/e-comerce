/** Store-wide price tables — same values stored in MongoDB and shown everywhere */
const PRODUCT_PRICES = [0.01, 0.03, 0.01, 0.02, 0.03, 0.01, 0.02, 0.01, 0.03, 0.02];
const PRODUCT_OLD_PRICES = [0.02, 0.04, 0.02, 0.03, 0.04, 0.02, 0.03, 0.02, 0.04, 0.03];
const DELIVERY_FEES = [0.01, 0.01, 0.02, 0.01, 0.02, 0.01];
const FIXED_COUPON_DISCOUNT = 0.01;
const WAAFI_MIN_USD = 0.01;

function slotIndex(productId, index = 0) {
  return typeof productId === 'number' ? productId - 1 : index;
}

function priceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx = ((slot % PRODUCT_PRICES.length) + PRODUCT_PRICES.length) % PRODUCT_PRICES.length;
  return PRODUCT_PRICES[idx];
}

function oldPriceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx =
    ((slot % PRODUCT_OLD_PRICES.length) + PRODUCT_OLD_PRICES.length) % PRODUCT_OLD_PRICES.length;
  return PRODUCT_OLD_PRICES[idx];
}

function deliveryFeeForIndex(index = 0) {
  const idx = ((index % DELIVERY_FEES.length) + DELIVERY_FEES.length) % DELIVERY_FEES.length;
  return DELIVERY_FEES[idx];
}

function discountLabel(amount) {
  return `$${Number(amount).toFixed(2)} off your order`;
}

module.exports = {
  WAAFI_MIN_USD,
  PRODUCT_PRICES,
  PRODUCT_OLD_PRICES,
  DELIVERY_FEES,
  FIXED_COUPON_DISCOUNT,
  priceForProductId,
  oldPriceForProductId,
  deliveryFeeForIndex,
  discountLabel,
};
