const mongoose = require('mongoose');
const Order = require('../models/Order');
const { restoreStockForItems } = require('../utils/stockUtils');
const { canCustomerCancelOrder } = require('../utils/orderCancelUtils');
const { onOrderUpdated } = require('./notificationService');
const { logOrderActivity } = require('./orderActivityService');
const { syncDriverStatus } = require('./driverService');

const UNPAID_ORDER_TTL_MS = 24 * 60 * 60 * 1000;
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 60 * 1000;
const MAX_TRANSIENT_RETRIES = 3;

function isTransientDbError(error) {
  const code = String(error?.code || '');
  const message = String(error?.message || '');
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|ENOTFOUND|EPIPE|MongoNetworkError|MongoServerSelectionError|interrupted|topology was destroyed/i.test(
    `${code} ${message}`
  );
}

function isDbReady() {
  return mongoose.connection.readyState === 1;
}

async function expireUnpaidOrders() {
  if (!isDbReady()) {
    return 0;
  }

  const cutoff = new Date(Date.now() - UNPAID_ORDER_TTL_MS);

  const orders = await Order.find({
    paymentType: { $nin: ['paid'] },
    status: { $ne: 'cancelled' },
    currentStep: { $lt: 4 },
    createdAt: { $lt: cutoff },
  });

  let expired = 0;

  for (const order of orders) {
    if (!canCustomerCancelOrder(order)) continue;

    const previousDriverId = order.assignedDriverId;
    order.status = 'cancelled';
    order.currentStep = 0;
    order.estimate = 'Auto-cancelled — payment not completed within 24 hours';
    order.driver = 'Not assigned yet';
    order.assignedDriverId = '';

    if (order.stockHeld !== false && order.items?.length) {
      await restoreStockForItems(order.items, { orderId: order.id });
      order.stockHeld = false;
    }

    await order.save();
    expired += 1;

    if (previousDriverId) {
      await syncDriverStatus(previousDriverId).catch(() => {});
    }

    await onOrderUpdated(order, { status: 'cancelled', statusChanged: true });
    await logOrderActivity({
      orderId: order.id,
      action: 'order_cancelled',
      description: 'Order auto-cancelled after 24 hours without payment.',
      actorId: 'system',
      actorRole: 'system',
      metadata: { reason: 'unpaid_timeout' },
    }).catch(() => {});
  }

  if (expired > 0) {
    console.log(`Auto-cancelled ${expired} unpaid order(s) older than 24h.`);
  }

  return expired;
}

async function runExpiryCheck(attempt = 1) {
  try {
    if (!isDbReady()) return;
    await expireUnpaidOrders();
  } catch (err) {
    // Temporary Atlas/WiFi drops — silent retry, do not spam the terminal
    if (isTransientDbError(err)) {
      if (attempt < MAX_TRANSIENT_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
        return runExpiryCheck(attempt + 1);
      }
      return;
    }

    console.error('Order expiry check failed:', err.message);
  }
}

function startOrderExpiryJob() {
  // First scan after connection has settled (avoids ECONNRESET on startup)
  const firstRunTimer = setTimeout(() => {
    runExpiryCheck();
  }, FIRST_RUN_DELAY_MS);

  const intervalId = setInterval(() => {
    runExpiryCheck();
  }, CHECK_INTERVAL_MS);

  if (typeof firstRunTimer.unref === 'function') firstRunTimer.unref();
  if (typeof intervalId.unref === 'function') intervalId.unref();

  return intervalId;
}

module.exports = { expireUnpaidOrders, startOrderExpiryJob, UNPAID_ORDER_TTL_MS };
