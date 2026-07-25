const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const SupportTicket = require('../models/SupportTicket');
const Notification = require('../models/Notification');
const PaymentTransaction = require('../models/PaymentTransaction');
const simpleCache = require('../utils/simpleCache');
const {
  DASHBOARD_CACHE_KEY,
  PAID_ORDER_MATCH,
  parseMoney,
  invalidateDashboardCache,
} = require('../utils/revenueUtils');

exports.invalidateDashboardCache = invalidateDashboardCache;

function calcTrendPercent(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildTopProductsAggregation(sinceDate) {
  return [
    {
      $match: {
        ...PAID_ORDER_MATCH,
        createdAt: { $gte: sinceDate },
        status: { $ne: 'cancelled' },
        currentStep: { $ne: 0 },
        'items.0': { $exists: true },
      },
    },
    { $unwind: '$items' },
    {
      $group: {
        _id: { id: '$items.id', title: '$items.title' },
        sold: { $sum: { $ifNull: ['$items.quantity', 1] } },
        revenue: {
          $sum: {
            $multiply: [
              { $ifNull: ['$items.quantity', 1] },
              { $ifNull: ['$items.price', 0] },
            ],
          },
        },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 10 },
    {
      $project: {
        _id: 0,
        id: '$_id.id',
        title: '$_id.title',
        sold: 1,
        revenue: { $round: ['$revenue', 2] },
      },
    },
  ];
}

function isPaidOrder(order) {
  return order.paymentType === 'paid' || String(order.payment || '').toLowerCase() === 'paid';
}

const SUCCESS_TXN_MATCH = { status: 'success' };

exports.getDashboardStats = async (_req, res) => {
  try {
    const cached = simpleCache.get(DASHBOARD_CACHE_KEY);
    if (cached) {
      return res.status(200).json({ success: true, stats: cached, cached: true });
    }

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(prevWeekStart.getDate() - 14);

    const paidMatch = PAID_ORDER_MATCH;

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
      topProductsWeekAgg,
      topProductsMonthAgg,
      topProductsYearAgg,
      lowStockProducts,
      lowStockCount,
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
                  {
                    case: {
                      $and: [{ $gte: ['$currentStep', 2] }, { $lte: ['$currentStep', 3] }],
                    },
                    then: 'processing',
                  },
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
      PaymentTransaction.aggregate([
        { $match: SUCCESS_TXN_MATCH },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { ...SUCCESS_TXN_MATCH, createdAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      PaymentTransaction.aggregate([
        { $match: { ...SUCCESS_TXN_MATCH, createdAt: { $gte: prevWeekStart, $lt: weekStart } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: weekStart } }),
      Order.countDocuments({ createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: weekStart } }),
      User.countDocuments({ role: { $ne: 'admin' }, createdAt: { $gte: prevWeekStart, $lt: weekStart } }),
      PaymentTransaction.aggregate([
        { $match: SUCCESS_TXN_MATCH },
        {
          $project: {
            label: {
              $dateToString: {
                format: '%b %d, %Y',
                date: '$createdAt',
              },
            },
            amountNum: { $toDouble: { $ifNull: ['$amount', 0] } },
            createdAt: 1,
          },
        },
        { $group: { _id: '$label', total: { $sum: '$amountNum' }, sortAt: { $min: '$createdAt' } } },
        { $sort: { sortAt: 1 } },
        { $project: { _id: 1, total: 1 } },
      ]),
      Order.aggregate(buildTopProductsAggregation(weekStart)),
      Order.aggregate(buildTopProductsAggregation(monthStart)),
      Order.aggregate(buildTopProductsAggregation(yearStart)),
      Product.find({
        status: { $ne: 'Inactive' },
        stockVal: { $gt: 0, $lte: 5 },
      })
        .select('id title stockVal category')
        .sort({ stockVal: 1, title: 1 })
        .limit(12)
        .lean(),
      Product.countDocuments({
        status: { $ne: 'Inactive' },
        stockVal: { $gt: 0, $lte: 5 },
      }),
    ]);

    const statusMap = Object.fromEntries(statusBuckets.map((row) => [row._id, row.count]));
    const pendingOrders = (statusMap.pending || 0) + (statusMap.shipped || 0);
    const deliveredOrders = statusMap.delivered || 0;
    const cancelledOrders = statusMap.cancelled || 0;

    let revenue = Math.round((revenueAgg[0]?.total || 0) * 100) / 100;
    if (!revenue) {
      const paidSample = await Order.find(paidMatch).select('amount subtotal deliveryFee discount').limit(500).lean();
      revenue = Math.round(
        paidSample.reduce((sum, order) => {
          const fromAmount = parseMoney(order.amount);
          if (fromAmount > 0) return sum + fromAmount;
          return (
            sum +
            parseMoney(order.subtotal) +
            parseMoney(order.deliveryFee) -
            parseMoney(order.discount)
          );
        }, 0) * 100
      ) / 100;
    }

    const revenueThisWeek = Math.round((revenueThisWeekAgg[0]?.total || 0) * 100) / 100;
    const revenuePrevWeek = Math.round((revenuePrevWeekAgg[0]?.total || 0) * 100) / 100;

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
      orderStatusCounts: {
        pending: statusMap.pending || 0,
        processing: statusMap.processing || 0,
        shipped: statusMap.shipped || 0,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      trends: {
        orders: calcTrendPercent(ordersThisWeek, ordersPrevWeek),
        users: calcTrendPercent(usersThisWeek, usersPrevWeek),
        revenue: calcTrendPercent(revenueThisWeek, revenuePrevWeek),
        products: 0,
      },
      salesByDate,
      topProducts: topProductsWeekAgg,
      topProductsByPeriod: {
        week: topProductsWeekAgg,
        month: topProductsMonthAgg,
        year: topProductsYearAgg,
      },
      lowStockProducts: lowStockProducts.map((p) => ({
        id: p.id,
        title: p.title,
        stockVal: p.stockVal ?? 0,
        category: p.category || '',
      })),
      lowStockCount,
    };

    simpleCache.set(DASHBOARD_CACHE_KEY, stats, 60000);

    return res.status(200).json({ success: true, stats });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load dashboard statistics.' });
  }
};
