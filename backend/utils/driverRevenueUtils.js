/**
 * Driver earnings = delivery fees on completed deliveries they fulfilled.
 * Counts delivered work even if customer payment later failed (driver still did the trip).
 * Admin dashboard revenue stays separate (paid orders only).
 */
const { parseMoney } = require('./revenueUtils');

function buildDriverEarningsMatch(driverId) {
  return {
    assignedDriverId: String(driverId || '').trim(),
    status: { $ne: 'cancelled' },
    $or: [{ currentStep: { $gte: 5 } }, { status: 'delivered' }],
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
