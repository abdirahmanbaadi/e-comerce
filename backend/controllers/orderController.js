const Order = require('../models/Order');
const OrderActivity = require('../models/OrderActivity');
const PaymentTransaction = require('../models/PaymentTransaction');
const User = require('../models/User');
const Product = require('../models/Product');
const { onOrderCreated, onOrderUpdated, onDriverAssignmentPending, onDriverUnassigned, userAllowsEmailAlerts } = require('../services/notificationService');
const { sendOrderConfirmationEmail } = require('../services/emailService');
const { logUserActivity } = require('../services/activityService');
const { resolveCoupon } = require('./couponController');
const { logPaymentTransaction } = require('../services/paymentService');
const { logOrderActivity } = require('../services/orderActivityService');
const { resolveDistrictDeliveryFee } = require('../utils/deliveryFeeUtils');
const { normalizePhone, findUserByPhone } = require('../utils/phoneUtils');
const {
  maskPhone,
  maskCustomerName,
  maskAddress,
} = require('../utils/securityUtils');
const {
  MAX_ACTIVE_DELIVERIES,
  syncDriverStatus,
  driverLabelFromUser,
} = require('../services/driverService');

function resolveOrderStatus(order) {
  if (order.status) return order.status;

  const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
  if (step === 0) return 'cancelled';
  if (step >= 5) return 'delivered';
  if (step >= 4) return 'shipped';
  return 'processing';
}

function withResolvedStatus(order) {
  const plain = order.toObject ? order.toObject() : { ...order };
  plain.status = resolveOrderStatus(plain);
  return plain;
}

function isAssignmentAccepted(order) {
  const status = order.assignmentStatus || 'none';
  if (status === 'accepted') return true;
  if (status === 'pending' || status === 'rejected') return false;
  if (order.assignedDriverId && (order.currentStep || 0) >= 3) return true;
  return false;
}

async function deliveryCanAccessOrder(user, order) {
  if (order.assignedDriverId && order.assignedDriverId === user.id) return true;
  const driverIdentifier = `${user.firstName} ${user.lastName || ''}`.trim();
  const driverField = order.driver || '';
  return driverField.includes(driverIdentifier) || (user.phone && driverField.includes(user.phone));
}

async function decrementStockForItems(items = []) {
  for (const item of items) {
    if (!item) continue;
    const product =
      (item.id && (await Product.findOne({ id: item.id }))) ||
      (item.title && (await Product.findOne({ title: item.title })));
    if (!product || typeof product.stockVal !== 'number') continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    product.stockVal = Math.max(0, product.stockVal - qty);
    if (product.stockVal === 0) {
      product.stock = 'out-of-stock';
      product.availability = 'Out of Stock';
    }
    await product.save();
  }
}

async function restoreStockForItems(items = []) {
  for (const item of items) {
    if (!item) continue;
    const product =
      (item.id && (await Product.findOne({ id: item.id }))) ||
      (item.title && (await Product.findOne({ title: item.title })));
    if (!product || typeof product.stockVal !== 'number') continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    product.stockVal += qty;
    if (product.stockVal > 0) {
      product.stock = 'in-stock';
      product.availability = 'In Stock';
    }
    await product.save();
  }
}

async function validateStockForItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return { ok: true };

  for (const item of items) {
    if (!item) continue;
    const product =
      (item.id && (await Product.findOne({ id: item.id }))) ||
      (item.title && (await Product.findOne({ title: item.title })));
    if (!product) continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    if (product.stock === 'out-of-stock' || (typeof product.stockVal === 'number' && product.stockVal < qty)) {
      return {
        ok: false,
        message: `Insufficient stock for "${product.title}". Available: ${product.stockVal ?? 0}`,
      };
    }
  }

  return { ok: true };
}

function parseMoneyValue(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '').replace(/[^0-9.-]/g, '')) || 0;
}

async function userCanAccessOrder(user, order) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'delivery') return deliveryCanAccessOrder(user, order);
  if (order.userId && order.userId === user.id) return true;
  if (user.phone && normalizePhone(user.phone) === normalizePhone(order.phone)) return true;
  return false;
}

function userCanCancelOrder(order, req) {
  const user = req.user;
  const verifyPhone = req.body?.phone;

  if (user?.role === 'admin') return true;
  if (user && (order.userId === user.id || normalizePhone(user.phone) === normalizePhone(order.phone))) {
    return true;
  }
  if (verifyPhone && normalizePhone(verifyPhone) === normalizePhone(order.phone)) return true;
  return false;
}

exports.placeOrder = async (req, res) => {
  try {
    const {
      phone,
      customer,
      amount,
      address,
      product,
      paymentType,
      email,
      items,
      deliveryDate,
      deliveryTime,
      paymentMethod,
      subtotal,
      deliveryFee,
      discount,
      couponCode,
      paymentReference,
      district,
    } = req.body;

    if (!phone || !customer || !amount || !address || !product) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields to complete the order!' });
    }

    const orderItems = Array.isArray(items) ? items : [];
    if (orderItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty. Add items before checkout.' });
    }

    const stockCheck = await validateStockForItems(orderItems);
    if (!stockCheck.ok) {
      return res.status(400).json({ success: false, message: stockCheck.message });
    }

    const computedSubtotal = orderItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Math.max(1, Number(item.quantity) || 1),
      0
    );

    const feeCheck = await resolveDistrictDeliveryFee({ district, address });
    if (!feeCheck.ok) {
      return res.status(400).json({ success: false, message: feeCheck.message });
    }
    const fee = feeCheck.fee;
    const submittedFee = Number(deliveryFee) || 0;
    if (Math.abs(submittedFee - fee) > 0.0005) {
      return res.status(400).json({
        success: false,
        message: 'Delivery fee mismatch. Please refresh your cart and try again.',
      });
    }

    let orderDiscount = Math.max(0, Number(discount) || 0);

    if (couponCode) {
      const couponResult = await resolveCoupon(couponCode, computedSubtotal);
      if (!couponResult.ok) {
        return res.status(400).json({ success: false, message: couponResult.message });
      }
      orderDiscount = couponResult.discount;
    }

    const expectedTotal = Math.max(computedSubtotal + fee - orderDiscount, 0);
    const submittedTotal = parseMoneyValue(amount);
    if (Math.abs(submittedTotal - expectedTotal) > 0.0005) {
      return res.status(400).json({
        success: false,
        message: 'Order total mismatch. Please refresh your cart and try again.',
      });
    }

    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(Math.random() * 900) + 100;
    const orderId = `#MF-${yy}${mm}${dd}-${rand}`;

    const dateString = today.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const orderEmail = email || req.user?.email || '';

    let linkedUserId = req.user?.id || '';
    if (!linkedUserId && phone) {
      const matchedUser = await findUserByPhone(User, phone);
      linkedUserId = matchedUser?.id || '';
    }

    const newOrder = await Order.create({
      id: orderId,
      phone,
      customer,
      amount,
      payment: paymentType === 'paid' ? 'Paid' : 'Pending',
      paymentType: paymentType || 'pending',
      paymentMethod: paymentMethod || '',
      address,
      driver: 'Not assigned yet',
      assignedDriverId: '',
      estimate: 'Processing your order',
      status: 'processing',
      currentStep: 1,
      product,
      items: Array.isArray(items) ? items : [],
      email: orderEmail,
      userId: linkedUserId,
      deliveryDate: deliveryDate || '',
      deliveryTime: deliveryTime || '',
      date: dateString,
      subtotal: computedSubtotal,
      deliveryFee: fee,
      discount: orderDiscount,
      couponCode: couponCode ? String(couponCode).trim().toUpperCase() : '',
      paymentReference: paymentReference ? String(paymentReference).trim() : '',
      payment: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Pending',
      paymentType: 'pending',
    });

    const orderAmount = parseMoneyValue(amount);
    await logPaymentTransaction({
      orderId,
      method: paymentMethod || 'Cash on Delivery',
      amount: orderAmount,
      status: 'pending',
      phone,
      referenceId: paymentReference || orderId,
      message:
        paymentMethod === 'Cash on Delivery'
          ? 'Cash on Delivery — awaiting payment on delivery.'
          : 'EVC Plus payment pending Waafi confirmation.',
      source: 'checkout',
    });

    await decrementStockForItems(newOrder.items);

    await onOrderCreated(newOrder, { userId: linkedUserId });

    if (linkedUserId) {
      await logUserActivity({
        userId: linkedUserId,
        action: 'order_placed',
        description: `Order ${orderId} placed.`,
        metadata: { orderId, amount, product },
      });
    }

    await logOrderActivity({
      orderId,
      action: 'order_placed',
      description: `Order placed by ${customer}.`,
      actorId: req.user?.id || '',
      actorRole: req.user?.role || 'guest',
      metadata: {
        amount: orderAmount,
        paymentMethod: paymentMethod || 'Cash on Delivery',
        itemCount: orderItems.length,
      },
    });

    if (orderEmail) {
      const allowEmail = await userAllowsEmailAlerts(req.user?.id, newOrder.phone);
      if (allowEmail) {
        const mailUser = req.user || { email: orderEmail, firstName: customer.split(' ')[0] || customer };
        sendOrderConfirmationEmail(mailUser, newOrder).catch((err) =>
          console.error('Order email failed:', err.message)
        );
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully!',
      order: withResolvedStatus(newOrder),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to place order.' });
  }
};

function sanitizeOrderForPublicTrack(order, verifyPhone) {
  const plain = withResolvedStatus(order);
  const phoneVerified =
    verifyPhone && normalizePhone(verifyPhone) === normalizePhone(order.phone);

  if (phoneVerified) {
    return { ...plain, phoneVerified: true };
  }

  return {
    ...plain,
    customer: maskCustomerName(order.customer),
    phone: maskPhone(order.phone),
    address: maskAddress(order.address),
    email: '',
    phoneVerified: false,
    verificationHint: 'Enter the phone number used at checkout to view full delivery details.',
  };
}

exports.trackOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please enter Order ID!' });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found! Please check the ID.' });
    }

    const activities = await OrderActivity.find({ orderId: order.id }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      order: withResolvedStatus(order),
      activities,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to track order.' });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Please enter Order ID!' });
    }

    const order = await Order.findOne({ id: orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found! Please check the ID.' });
    }

    if (!userCanCancelOrder(order, req)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order. Verify with the phone number used at checkout.',
      });
    }

    const status = resolveOrderStatus(order);
    if (status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This order is already cancelled.' });
    }
    if (status !== 'processing') {
      return res.status(400).json({
        success: false,
        message: 'Order cannot be cancelled after shipment. Contact support for help.',
      });
    }

    order.status = 'cancelled';
    order.currentStep = 0;
    order.estimate = 'Order cancelled';
    order.driver = 'Not assigned yet';
    const previousDriverId = order.assignedDriverId;
    order.assignedDriverId = '';
    await order.save();

    if (previousDriverId) {
      await syncDriverStatus(previousDriverId);
    }

    if (order.items?.length) {
      await restoreStockForItems(order.items);
    }

    await onOrderUpdated(order, { status: 'cancelled', statusChanged: true });

    await logOrderActivity({
      orderId: order.id,
      action: 'order_cancelled',
      description: 'Order cancelled before shipment.',
      actorId: req.user?.id || '',
      actorRole: req.user?.role || 'customer',
      metadata: { previousStatus: status },
    });

    return res.status(200).json({
      success: true,
      message: 'Your order has been cancelled successfully.',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to cancel order.' });
  }
};

const ORDER_LIST_FIELDS =
  'id customer amount address phone product date payment paymentType status currentStep estimate driver assignedDriverId assignmentStatus assignmentRejectReason userId items subtotal deliveryFee discount paymentMethod createdAt updatedAt';

function parseLimit(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), 1000);
}

exports.getOrders = async (req, res) => {
  try {
    const { role, id, phone } = req.user;
    const limit = parseLimit(req.query.limit, 0);
    let orders;

    if (role === 'admin') {
      let query = Order.find()
        .select(ORDER_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .lean();
      if (limit > 0) query = query.limit(limit);
      else query = query.limit(500);
      orders = await query;
    } else if (role === 'delivery') {
      orders = await Order.find({ assignedDriverId: id })
        .select(ORDER_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .limit(limit || 200)
        .lean();

      if (orders.length === 0) {
        const driverIdentifier = `${req.user.firstName} ${req.user.lastName || ''}`.trim();
        orders = await Order.find({
          assignedDriverId: { $in: [null, ''] },
          $or: [
            { driver: { $regex: driverIdentifier, $options: 'i' } },
            ...(req.user.phone ? [{ driver: { $regex: req.user.phone, $options: 'i' } }] : []),
          ],
        })
          .select(ORDER_LIST_FIELDS)
          .sort({ createdAt: -1 })
          .limit(limit || 100)
          .lean();
      }
    } else {
      const normalizedUserPhone = normalizePhone(phone);
      const phoneVariants = [normalizedUserPhone, `0${normalizedUserPhone}`, `252${normalizedUserPhone}`].filter(
        Boolean
      );

      orders = await Order.find({
        $or: [{ userId: id }, ...(phoneVariants.length ? [{ phone: { $in: phoneVariants } }] : [])],
      })
        .select(ORDER_LIST_FIELDS)
        .sort({ createdAt: -1 })
        .limit(limit || 100)
        .lean();
    }

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders: orders.map(withResolvedStatus),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch orders.' });
  }
};

exports.assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedDriverId } = req.body;

    if (!assignedDriverId) {
      return res.status(400).json({ success: false, message: 'Please select a driver.' });
    }

    const order = await Order.findOne({ id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    const driver = await User.findOne({ id: assignedDriverId, role: 'delivery' });
    if (!driver) {
      return res.status(400).json({ success: false, message: 'Selected driver is not approved.' });
    }

    if (driver.driverStatus === 'offline') {
      return res.status(400).json({
        success: false,
        code: 'DRIVER_OFFLINE',
        message: `${driver.firstName} is offline and cannot receive new assignments.`,
      });
    }

    const previousDriverId = order.assignedDriverId;
    const isReassigning = Boolean(previousDriverId && previousDriverId !== driver.id);

    if (previousDriverId && previousDriverId !== driver.id) {
      const previousDriver = await User.findOne({ id: previousDriverId });
      await onDriverUnassigned(order, {
        driverId: previousDriverId,
        driverName: previousDriver ? driverLabelFromUser(previousDriver) : 'Driver',
        reason: 'Admin assigned another driver to this order.',
      });
    }

    if (previousDriverId !== driver.id) {
      const activeOnOtherOrders = await Order.countDocuments({
        assignedDriverId: driver.id,
        id: { $ne: order.id },
        assignmentStatus: { $in: ['pending', 'accepted'] },
        currentStep: { $lt: 5 },
        status: { $nin: ['cancelled'] },
      });
      if (activeOnOtherOrders >= MAX_ACTIVE_DELIVERIES) {
        return res.status(400).json({
          success: false,
          code: 'DRIVER_AT_CAPACITY',
          message: `${driver.firstName} already has ${activeOnOtherOrders} active deliveries (max ${MAX_ACTIVE_DELIVERIES}). Mark one delivered or choose another driver.`,
        });
      }
    }

    order.assignedDriverId = driver.id;
    order.driver = driverLabelFromUser(driver);
    order.assignmentStatus = 'pending';
    order.assignmentRejectReason = '';
    order.estimate = 'Awaiting driver acceptance';

    await order.save();

    if (previousDriverId && previousDriverId !== driver.id) {
      await syncDriverStatus(previousDriverId);
    }
    await syncDriverStatus(driver.id);

    await onDriverAssignmentPending(order, driver);

    await logOrderActivity({
      orderId: order.id,
      action: isReassigning ? 'driver_reassigned' : 'driver_assigned',
      description: isReassigning
        ? `Delivery request sent to ${driver.firstName} (awaiting acceptance).`
        : `Delivery request sent to ${driver.firstName} (awaiting acceptance).`,
      actorId: req.user?.id || '',
      actorRole: req.user?.role || 'admin',
      metadata: { driverId: driver.id, driverName: order.driver, assignmentStatus: 'pending' },
    });

    return res.status(200).json({
      success: true,
      message: isReassigning
        ? `Order reassigned to ${driver.firstName}. Waiting for driver acceptance.`
        : `Order sent to ${driver.firstName}. Waiting for driver acceptance.`,
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to assign driver.' });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentStep, estimate, driver, payment, paymentType, status } = req.body;
    const order = await Order.findOne({ id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    const prevStatus = resolveOrderStatus(order);
    const prevPaymentType = order.paymentType;
    const prevPayment = order.payment;
    const prevEstimate = order.estimate;

    if (req.user.role === 'delivery') {
      const allowed = await deliveryCanAccessOrder(req.user, order);
      if (!allowed) {
        return res.status(403).json({ success: false, message: 'This order is not assigned to you.' });
      }

      if (!isAssignmentAccepted(order)) {
        return res.status(400).json({
          success: false,
          message: 'Please accept this delivery assignment before updating the order.',
        });
      }

      if (currentStep !== undefined) order.currentStep = parseInt(currentStep, 10);
      if (estimate !== undefined) order.estimate = estimate;

      if (!order.assignedDriverId) {
        order.assignedDriverId = req.user.id;
        order.driver = driverLabelFromUser(req.user);
      }

      const step = order.currentStep;
      if (step >= 5) order.status = 'delivered';
      else if (step >= 4) order.status = 'shipped';
      else order.status = 'processing';
    } else if (req.user.role === 'admin') {
      if (currentStep !== undefined) order.currentStep = parseInt(currentStep, 10);
      if (estimate !== undefined) order.estimate = estimate;
      if (driver !== undefined) order.driver = driver;
      if (payment !== undefined) order.payment = payment;
      if (status !== undefined) order.status = status;
      if (paymentType !== undefined) {
        order.paymentType = paymentType;
        if (paymentType === 'paid') order.payment = 'Paid';
        else if (paymentType === 'failed') order.payment = 'Failed';
      }

      if (status === undefined && currentStep !== undefined) {
        const step = parseInt(currentStep, 10);
        if (step === 0) order.status = 'cancelled';
        else if (step >= 5) order.status = 'delivered';
        else if (step >= 4) order.status = 'shipped';
        else order.status = 'processing';
      }
    }

    await order.save();

    const assignedDriverId = order.assignedDriverId;
    const nextStatus = resolveOrderStatus(order);
    const step = typeof order.currentStep === 'number' ? order.currentStep : 1;
    if (assignedDriverId && (nextStatus === 'delivered' || nextStatus === 'cancelled' || step >= 5)) {
      await syncDriverStatus(assignedDriverId);
    }

    await onOrderUpdated(order, {
      status: nextStatus,
      statusChanged: prevStatus !== nextStatus,
      paymentType: order.paymentType !== prevPaymentType ? order.paymentType : undefined,
      payment: order.payment !== prevPayment ? order.payment : undefined,
    });

    if (prevStatus !== nextStatus) {
      await logOrderActivity({
        orderId: order.id,
        action: 'status_changed',
        description: `Status changed from ${prevStatus} to ${nextStatus}.`,
        actorId: req.user?.id || '',
        actorRole: req.user?.role || 'system',
        metadata: { from: prevStatus, to: nextStatus, currentStep: order.currentStep },
      });
    }

    if (order.paymentType !== prevPaymentType || order.payment !== prevPayment) {
      await logOrderActivity({
        orderId: order.id,
        action: 'payment_updated',
        description: `Payment updated to ${order.payment || order.paymentType}.`,
        actorId: req.user?.id || '',
        actorRole: req.user?.role || 'admin',
        metadata: { payment: order.payment, paymentType: order.paymentType },
      });
    }

    if (estimate !== undefined && estimate !== prevEstimate) {
      await logOrderActivity({
        orderId: order.id,
        action: 'estimate_updated',
        description: `Delivery estimate updated to "${order.estimate}".`,
        actorId: req.user?.id || '',
        actorRole: req.user?.role || 'system',
        metadata: { estimate: order.estimate },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order updated successfully!',
      order: withResolvedStatus(order),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update order.' });
  }
};

exports.getOrderStats = async (req, res) => {
  try {
    const allOrders = await Order.find({}, 'status currentStep payment paymentType amount subtotal deliveryFee discount').lean();

    let pending = 0;
    let delivered = 0;
    let cancelled = 0;
    let shipped = 0;
    let revenue = 0;

    for (const order of allOrders) {
      const status = resolveOrderStatus(order);
      if (status === 'cancelled') {
        cancelled += 1;
      } else if (status === 'delivered') {
        delivered += 1;
        if (order.paymentType === 'paid' || String(order.payment).toLowerCase() === 'paid') {
          revenue += parseMoneyValue(order.amount);
        }
      } else if (status === 'shipped') {
        shipped += 1;
      } else {
        pending += 1;
      }
    }

    return res.status(200).json({
      success: true,
      stats: {
        total: allOrders.length,
        pending,
        shipped,
        delivered,
        cancelled,
        revenue,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order statistics.' });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ id: orderId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found!' });
    }

    const allowed = await userCanAccessOrder(req.user, order);
    if (!allowed) {
      return res.status(403).json({ success: false, message: 'You do not have access to this order.' });
    }

    const activities = await OrderActivity.find({ orderId: order.id }).sort({ createdAt: 1 }).lean();
    const transactions = await PaymentTransaction.find({ orderId: order.id }).sort({ createdAt: -1 }).lean();

    const itemCount = (order.items || []).reduce(
      (sum, item) => sum + Math.max(1, Number(item.quantity) || 1),
      0
    );
    const subtotal = order.subtotal ?? parseMoneyValue(order.amount);
    const deliveryFee = order.deliveryFee ?? 0;
    const discount = order.discount ?? 0;
    const grandTotal = parseMoneyValue(order.amount);

    return res.status(200).json({
      success: true,
      order: withResolvedStatus(order),
      activities,
      transactions,
      breakdown: {
        itemCount,
        subtotal,
        deliveryFee,
        discount,
        couponCode: order.couponCode || '',
        grandTotal,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to fetch order details.' });
  }
};
