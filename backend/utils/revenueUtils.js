/**
 * Shared revenue helpers — dashboard & payments use the same rules.
 */
const simpleCache = require('./simpleCache');

const DASHBOARD_CACHE_KEY = 'admin-dashboard-stats-v4';

function parseMoney(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

const PAID_ORDER_MATCH = {
  $or: [{ paymentType: 'paid' }, { payment: { $regex: /^paid$/i } }],
};

/** Paid + out for delivery (step 4) or delivered (step 5), not cancelled */
const TOP_PRODUCTS_ORDER_MATCH = {
  ...PAID_ORDER_MATCH,
  status: { $ne: 'cancelled' },
  currentStep: { $gte: 4 },
};

function isPaidOrderDoc(order) {
  return order?.paymentType === 'paid' || String(order?.payment || '').toLowerCase() === 'paid';
}

function isCancelledOrderDoc(order) {
  const step = typeof order?.currentStep === 'number' ? order.currentStep : 1;
  return step === 0 || String(order?.status || '').toLowerCase() === 'cancelled';
}

function orderQualifiesForTopProducts(order) {
  if (!order || !isPaidOrderDoc(order) || isCancelledOrderDoc(order)) return false;
  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
  return step >= 4;
}

function topProductsEligibilityChanged(before, after) {
  return orderQualifiesForTopProducts(before) !== orderQualifiesForTopProducts(after);
}

function paidOrderAmount(order) {
  const fromAmount = parseMoney(order?.amount);
  if (fromAmount > 0) return fromAmount;
  return (
    parseMoney(order?.subtotal) +
    parseMoney(order?.deliveryFee) -
    parseMoney(order?.discount)
  );
}

/** Mongo expression: paid order total from amount string or subtotal+fees */
const ORDER_REVENUE_AMOUNT_EXPR = {
  $let: {
    vars: {
      fromAmount: {
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
    in: {
      $cond: {
        if: { $gt: ['$$fromAmount', 0] },
        then: '$$fromAmount',
        else: {
          $add: [
            { $toDouble: { $ifNull: ['$subtotal', 0] } },
            { $toDouble: { $ifNull: ['$deliveryFee', 0] } },
            { $multiply: [{ $toDouble: { $ifNull: ['$discount', 0] } }, -1] },
          ],
        },
      },
    },
  },
};

function invalidateDashboardCache() {
  simpleCache.del(DASHBOARD_CACHE_KEY);
}

module.exports = {
  DASHBOARD_CACHE_KEY,
  PAID_ORDER_MATCH,
  TOP_PRODUCTS_ORDER_MATCH,
  ORDER_REVENUE_AMOUNT_EXPR,
  parseMoney,
  paidOrderAmount,
  isPaidOrderDoc,
  isCancelledOrderDoc,
  orderQualifiesForTopProducts,
  topProductsEligibilityChanged,
  invalidateDashboardCache,
};
