const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const simpleCache = require('../utils/simpleCache');

function parseMoney(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

function calcTrendPercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function isPaidOrder(order) {
  return order.paymentType === 'paid' || String(order.payment || '').toLowerCase() === 'paid';
}

exports.getDashboardStats = async (_req, res) => {
  try {
    const cached = simpleCache.get('admin-dashboard-stats');
    if (cached) {
      return res.status(200).json({ success: true, stats: cached, cached: true });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    const paidMatch = {
      $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
    };

    const [
      totalOrders,
      totalUsers,
      totalProducts,
      openSupportTickets,
      unreadAdminNotifications,
      statusBuckets,
      revenueAgg,
      revenueThisWeekAgg,
      revenuePrevWeekAgg,
      ordersThisWeek,
      ordersPrevWeek,
      usersThisWeek,
      usersPrevWeek,
      salesByDateAgg,
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Product.countDocuments({ status: { $ne: 'Inactive' } }),
      SupportTicket.countDocuments({ status: { $nin: ['Resolved', 'Closed'] } }),
      Notification.countDocuments({ audience: 'admin', read: false }),
      Order.aggregate([
        {
          $project: {
            bucket: {
              $switch: {
                branches: [
                  { case: { $eq: ['$status', 'cancelled'] }, then: 'cancelled' },
                  { case: { $eq: ['$status', 'delivered'] }, then: 'delivered' },
                  { case: { $gte: ['$currentStep', 5] }, then: 'delivered' },
                  { case: { $eq: ['$status', 'shipped'] }, then: 'shipped' },
                  { case: { $gte: ['$currentStep', 4] }, then: 'shipped' },
                ],
                default: 'pending',
              },
            },
          },
        },
        { $group: { _id: '$bucket', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, total: { $sum: { $toDouble: { $ifNull: ['$subtotal', 0] } } } } },
      ]),
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: weekStart } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ['$subtotal', 0] } },
                  { $toDouble: { $ifNull: ['$deliveryFee', 0] } },
                  { $multiply: [{ $toDouble: { $ifNull: ['$discount', 0] } }, -1] },
                ],
              },
            },
          },
        },
      ]),
      Order.aggregate([
        { $match: { ...paidMatch, createdAt: { $gte: prevWeekStart, $lt: weekStart } } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $add: [
                  { $toDouble: { $ifNull: ['$subtotal', 0] } },
                  { $toDouble: { $ifNull: ['$deliveryFee', 0] } },
                  { $multiply: [{ $toDouble: { $ifNull: ['$discount', 0] } }, -1] },
                ],
              },
            },
          },
        },
      ]),
      Order.countDocuments({ createdAt: { $gte: weekStart } }),
      Order.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: weekStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
      Order.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: 200 },
        {
          $project: {
            label: {
              $ifNull: [
                '$date',
                {
                  $dateToString: {
                    format: '%b %d, %Y',
                    date: '$createdAt',
                  },
                },
              ],
            },
            amountNum: {
              $convert: {
                input: {
                  $replaceAll: {
                    input: { $toString: { $ifNull: ['$amount', '0'] } },
                    find: ',',
                    replacement: '',
                  },
                },
                to: 'double',
                onError: 0,
                onNull: 0,
              },
            },
          },
        },
        { $group: { _id: '$label', total: { $sum: '$amountNum' } } },
        { $sort: { _id: 1 } },
        { $limit: 14 },
      ]),
    ]);

    const statusMap = Object.fromEntries(statusBuckets.map((row) => [row._id, row.count]));
    const pendingOrders = (statusMap.pending || 0) + (statusMap.shipped || 0);
    const deliveredOrders = statusMap.delivered || 0;
    const cancelledOrders = statusMap.cancelled || 0;

    let revenue = revenueAgg[0]?.total || 0;
    if (!revenue) {
      const paidSample = await Order.find(paidMatch).select('amount subtotal').limit(500).lean();
      revenue = paidSample.reduce((sum, order) => sum + parseMoney(order.amount || order.subtotal), 0);
    }

    const revenueThisWeek = revenueThisWeekAgg[0]?.total || 0;
    const revenuePrevWeek = revenuePrevWeekAgg[0]?.total || 0;

    const salesByDate = Object.fromEntries(
      salesByDateAgg.map((row) => [row._id, Math.round(row.total * 1000) / 1000])
    );

    const stats = {
      totalOrders,
      totalUsers,
      totalProducts,
      revenue,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      openSupportTickets,
      unreadAdminNotifications,
      trends: {
        orders: calcTrendPercent(ordersThisWeek, ordersPrevWeek),
        users: calcTrendPercent(usersThisWeek, usersPrevWeek),
        revenue: calcTrendPercent(revenueThisWeek, revenuePrevWeek),
        products: 0,
      },
      salesByDate,
    };

    simpleCache.set('admin-dashboard-stats', stats, 45000);

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
};
