/**
 * Driver earnings = delivery fees only on completed (delivered + paid) orders they fulfilled.
 * Admin dashboard revenue = full order total (products + delivery fee − discount).
 */
const { PAID_ORDER_MATCH, parseMoney } = require('./revenueUtils');

function buildDriverEarningsMatch(driverId) {
  return {
    assignedDriverId: String(driverId || '').trim(),
    currentStep: { $gte: 5 },
    status: { $ne: 'cancelled' },
    ...PAID_ORDER_MATCH,
  };
}

function driverDeliveryFeeAmount(order) {
  const fee = parseMoney(order?.deliveryFee);
  if (fee > 0) return fee;
  const total = parseMoney(order?.amount);
  const subtotal = parseMoney(order?.subtotal);
  const discount = parseMoney(order?.discount);
  if (total > 0 && subtotal > 0 && total > subtotal) {
    return Math.max(0, total - subtotal + discount);
  }
  return 0;
}

function sumDriverDeliveryFees(orders = []) {
  return orders.reduce((sum, order) => sum + driverDeliveryFeeAmount(order), 0);
}

module.exports = {
  buildDriverEarningsMatch,
  driverDeliveryFeeAmount,
  sumDriverDeliveryFees,
};
