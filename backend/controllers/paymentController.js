const Order = require('../models/Order');
const PaymentTransaction = require('../models/PaymentTransaction');
const { processWaafiPurchase, WAAFI_MIN_USD } = require('../services/waafiService');
const {
  logPaymentTransaction,
  isWaafiConfigured,
  syncMissingSuccessTransactions,
  mapTransactionRow,
} = require('../services/paymentService');
const { invalidateDashboardCache } = require('../utils/revenueUtils');
const { onOrderUpdated } = require('../services/notificationService');
const { normalizePhone, isValidSomaliMobile } = require('../utils/phoneUtils');
const { decrementStockForItems, restoreStockForItems } = require('../utils/stockUtils');

function parseOrderAmount(amount) {
  if (typeof amount === 'number') return amount;
  return Number(String(amount || '').replace(/[^0-9.]/g, '')) || 0;
}

function resolveOrderStatus(order) {
  if (order.status) return order.status;
  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

exports.getPaymentConfig = async (_req, res) => {
  return res.status(200).json({
    success: true,
    waafiConfigured: isWaafiConfigured(),
    methods: [
      {
        id: 'EVC Plus',
        label: 'EVC Plus Mobile Money (Waafi)',
        enabled: isWaafiConfigured(),
      },
    ],
  });
};

exports.getTransactions = async (_req, res) => {
  try {
    await syncMissingSuccessTransactions();

    const transactions = await PaymentTransaction.find().sort({ createdAt: -1 }).limit(250).lean();

    const orderIds = [...new Set(transactions.map((txn) => txn.orderId).filter(Boolean))];
    const orders = orderIds.length
      ? await Order.find({ id: { $in: orderIds } }).select('id customer').lean()
      : [];
    const customerByOrderId = new Map(orders.map((order) => [order.id, order.customer || '']));

    const stats = { totalRevenue: 0, evcRevenue: 0, failedCount: 0, pendingCount: 0 };
    transactions.forEach((txn) => {
      const amount = Number(txn.amount) || 0;
      if (txn.status === 'success') {
        stats.totalRevenue += amount;
        stats.evcRevenue += amount;
      } else if (txn.status === 'failed') {
        stats.failedCount += 1;
      } else if (txn.status === 'pending') {
        stats.pendingCount += 1;
      }
    });
    stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
    stats.evcRevenue = Math.round(stats.evcRevenue * 100) / 100;

    return res.status(200).json({
      success: true,
      count: transactions.length,
      stats,
      transactions: transactions.map((txn) => mapTransactionRow(txn, customerByOrderId)),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load payment transactions.' });
  }
};

exports.getOrderPaymentStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const transactions = await PaymentTransaction.find({ orderId: order.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return res.status(200).json({
      success: true,
      orderId: order.id,
      payment: order.payment,
      paymentType: order.paymentType,
      paymentMethod: order.paymentMethod,
      paymentReference: order.paymentReference,
      transactionId: order.transactionId,
      paidAt: order.paidAt,
      amount: order.amount,
      transactions,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment status.' });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentType === 'paid' || order.payment === 'Paid') {
      return res.status(400).json({ success: false, message: 'Order is already marked as paid.' });
    }

    const amount = parseOrderAmount(order.amount);
    const previousPayment = order.paymentType;

    order.paymentType = 'paid';
    order.payment = 'Paid';
    order.paidAt = new Date();
    if (!order.transactionId) {
      order.transactionId = `ADMIN-${Date.now()}`;
    }
    if ((typeof order.currentStep === 'number' ? order.currentStep : 1) < 2) {
      order.currentStep = 2;
    }

    if (previousPayment === 'failed' || order.stockHeld === false) {
      if (order.items?.length) {
        await decrementStockForItems(order.items, {
          orderId: order.id,
          customer: order.customer,
          phone: order.phone,
          userId: order.userId,
        });
      }
      order.stockHeld = true;
    }

    await order.save();

    await logPaymentTransaction({
      orderId: order.id,
      method: order.paymentMethod || 'EVC Plus',
      amount,
      status: 'success',
      phone: order.phone,
      transactionId: order.transactionId,
      message: 'Payment verified manually by admin.',
      source: 'admin',
    });
    invalidateDashboardCache();

    if (previousPayment !== 'paid') {
      await onOrderUpdated(order, { paymentType: 'paid', payment: 'Paid' });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      order: {
        ...order.toObject(),
        status: resolveOrderStatus(order),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to verify payment.' });
  }
};

exports.waafiPurchase = async (req, res) => {
  try {
    const { orderId, accountNo, amount, description, paymentReference } = req.body;

    if (!orderId || !accountNo || !amount) {
      return res.status(400).json({
        success: false,
        message: 'orderId, accountNo, and amount are required for Waafi payment.',
      });
    }

    if (!isWaafiConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Waafi payment is not configured on the server. Add WAAFI_* credentials to backend/.env',
      });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.paymentType === 'paid' || order.payment === 'Paid') {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid. No duplicate charge was made.',
      });
    }

    if (!isValidSomaliMobile(accountNo)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid Somali mobile number (e.g. 61XXXXXXX or +25261XXXXXXX).',
      });
    }

    const expectedAmount = parseOrderAmount(order.amount);
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount must be greater than zero.',
      });
    }
    if (payAmount < WAAFI_MIN_USD) {
      return res.status(400).json({
        success: false,
        message: `EVC Plus minimum charge is $${WAAFI_MIN_USD.toFixed(2)} USD. Demo cart total is too small — add another item or contact support.`,
      });
    }
    if (Math.abs(expectedAmount - payAmount) > 0.0001) {
      return res.status(400).json({
        success: false,
        message: `Payment amount must match order total (${order.amount}).`,
      });
    }

    const invoiceId = orderId.replace('#', '');
    const referenceId = paymentReference || `${invoiceId}-${Date.now()}`;

    const paymentResult = await processWaafiPurchase({
      accountNo,
      amount,
      referenceId,
      invoiceId,
      description: description || `Payment for ${orderId}`,
    });

    if (paymentResult.success) {
      const previousPayment = order.paymentType;
      const prevStep = typeof order.currentStep === 'number' ? order.currentStep : 1;
      order.paymentType = 'paid';
      order.payment = 'Paid';
      order.paymentMethod = order.paymentMethod || 'EVC Plus';
      order.paymentReference = paymentReference || order.paymentReference || referenceId;
      order.transactionId = paymentResult.transactionId || referenceId;
      order.paidAt = new Date();
      if (prevStep < 2) order.currentStep = 2;

      if (previousPayment === 'failed' || order.stockHeld === false) {
        if (order.items?.length) {
          await decrementStockForItems(order.items, {
          orderId: order.id,
          customer: order.customer,
          phone: order.phone,
          userId: order.userId,
        });
        }
        order.stockHeld = true;
      }

      await order.save();

      await logPaymentTransaction({
        orderId: order.id,
        method: 'EVC Plus (Waafi)',
        amount: payAmount,
        status: 'success',
        phone: accountNo,
        referenceId,
        transactionId: order.transactionId,
        message: paymentResult.message,
        source: 'waafi',
      });
      invalidateDashboardCache();

      if (previousPayment !== 'paid') {
        await onOrderUpdated(order, { paymentType: 'paid', payment: 'Paid' });
      }

      return res.status(200).json({
        success: true,
        message: paymentResult.message,
        transactionId: paymentResult.transactionId,
        paymentReference: order.paymentReference,
        chargedPhone: paymentResult.chargedPhone,
        order: {
          ...order.toObject(),
          status: resolveOrderStatus(order),
        },
      });
    }

    const previousPayment = order.paymentType;
    const isRepeatFail = previousPayment === 'failed';

    order.paymentFailCount = (order.paymentFailCount || 0) + 1;
    order.paymentType = 'failed';
    order.payment = 'Failed';

    if (!isRepeatFail) {
      if (order.stockHeld !== false && order.items?.length) {
        await restoreStockForItems(order.items, { orderId: order.id });
        order.stockHeld = false;
      }
    }

    await order.save();

    await logPaymentTransaction({
      orderId: order.id,
      method: 'EVC Plus (Waafi)',
      amount: payAmount,
      status: 'failed',
      phone: accountNo,
      referenceId,
      message: paymentResult.message,
      source: 'waafi',
    });

    if (isRepeatFail) {
      await onOrderUpdated(order, { paymentType: 'failed', payment: 'Failed' });
    }

    return res.status(402).json({
      success: false,
      message: paymentResult.message,
      chargedPhone: paymentResult.chargedPhone,
      order: {
        ...order.toObject(),
        status: resolveOrderStatus(order),
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Payment processing failed.' });
  }
};
