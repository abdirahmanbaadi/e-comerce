const Order = require('../models/Order');
const User = require('../models/User');

async function recalculateDriverRating(driverId) {
  const id = String(driverId || '').trim();
  if (!id) return { avg: 0, count: 0 };

  const ratedOrders = await Order.find({
    assignedDriverId: id,
    deliveryRating: { $gte: 1, $lte: 5 },
  })
    .select('deliveryRating')
    .lean();

  const count = ratedOrders.length;
  const avg = count
    ? Math.round((ratedOrders.reduce((sum, order) => sum + order.deliveryRating, 0) / count) * 10) / 10
    : 0;

  await User.findOneAndUpdate(
    { id, role: 'delivery' },
    { driverRatingAvg: avg, driverRatingCount: count }
  );

  return { avg, count };
}

async function getDriverRatingSummary(driverId) {
  const id = String(driverId || '').trim();
  if (!id) {
    return { avg: 0, count: 0, recentRatings: [] };
  }

  const driver = await User.findOne({ id, role: 'delivery' })
    .select('driverRatingAvg driverRatingCount')
    .lean();

  const recentRatings = await Order.find({
    assignedDriverId: id,
    deliveryRating: { $gte: 1, $lte: 5 },
  })
    .sort({ deliveryRatedAt: -1, updatedAt: -1 })
    .limit(10)
    .select('id deliveryRating deliveryRatingComment deliveryRatedAt customer')
    .lean();

  return {
    avg: driver?.driverRatingAvg || 0,
    count: driver?.driverRatingCount || 0,
    recentRatings: recentRatings.map((order) => ({
      orderId: order.id,
      rating: order.deliveryRating,
      comment: order.deliveryRatingComment || '',
      ratedAt: order.deliveryRatedAt || order.updatedAt || null,
      customer: order.customer || '',
    })),
  };
}

module.exports = {
  recalculateDriverRating,
  getDriverRatingSummary,
};
