const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSms } = require('./smsService');
const { findUserByPhone } = require('../utils/phoneUtils');
const { formatRefundProcessingDelay } = require('../config/timingConfig');

function generateNotificationId() {
  return `NTF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function findUserIdByPhone(phone) {
  if (!phone) return null;
  const user = await findUserByPhone(User, phone);
  return user?.id || null;
}

async function findUserByIdOrPhone(userId, phone) {
  if (userId) {
    const byId = await User.findOne({ id: userId });
    if (byId) return byId;
  }
  if (phone) {
    return findUserByPhone(User, phone);
  }
  return null;
}

async function userAllowsEmailAlerts(userId, phone) {
  const user = await findUserByIdOrPhone(userId, phone);
  if (!user) return true;
  return user.notificationPreferences?.emailAlerts !== false;
}

async function userAllowsSmsAlerts(userId, phone) {
  const user = await findUserByIdOrPhone(userId, phone);
  if (!user) return false;
  return user.notificationPreferences?.smsAlerts === true;
}

async function maybeSendSmsAlert({ userId, phone, message }) {
  const allows = await userAllowsSmsAlerts(userId, phone);
  if (!allows || !phone) return;
  try {
    await sendSms(phone, message);
  } catch (error) {
    console.error('SMS alert failed:', error.message);
  }
}

async function notifyAdmins({ type, title, message, relatedId = '', metadata = {} }) {
  return Notification.create({
    id: generateNotificationId(),
    audience: 'admin',
    userId: '',
    type,
    title,
    message,
    relatedId,
    read: false,
    metadata,
  });
}

async function notifyUser({ userId, type, title, message, relatedId = '', metadata = {} }) {
  if (!userId) return null;
  return Notification.create({
    id: generateNotificationId(),
    audience: 'user',
    userId,
    type,
    title,
    message,
    relatedId,
    read: false,
    metadata,
  });
}

async function notifyUserByPhone(phone, payload) {
  const userId = await findUserIdByPhone(phone);
  if (!userId) return null;
  return notifyUser({ userId, ...payload });
}

async function notifyOrderCustomer(order, payload) {
  const relatedId = payload.relatedId || order.id;
  const fullPayload = { relatedId, ...payload };
  if (order.userId) {
    await notifyUser({ userId: order.userId, ...fullPayload });
    return;
  }
  await notifyUserByPhone(order.phone, fullPayload);
}

async function onOrderCreated(order, { userId } = {}) {
  const orderId = order.id;
  const customerPayload = {
    type: 'order_placed',
    title: 'Order Placed',
    message: `Your order ${orderId} was placed. Approve EVC Plus payment on your phone to complete checkout.`,
    relatedId: orderId,
    metadata: { orderId, amount: order.amount, paymentStatus: 'pending' },
  };

  if (userId || order.userId) {
    await notifyUser({ userId: userId || order.userId, ...customerPayload });
  } else {
    await notifyUserByPhone(order.phone, customerPayload);
  }

  await notifyAdmins({
    type: 'new_order',
    title: 'New Order Received',
    message: `${order.customer} placed order ${orderId} (${order.amount}) — payment pending.`,
    relatedId: orderId,
    metadata: { orderId, customer: order.customer, amount: order.amount },
  });

  await maybeSendSmsAlert({
    userId: userId || order.userId,
    phone: order.phone,
    message: `MMF: Order ${orderId} placed (${order.amount}). Approve EVC Plus on your phone to pay. Track on our website.`,
  });
}

async function onOrderUpdated(order, changes = {}) {
  const orderId = order.id;
  const userPayload = (payload) => notifyOrderCustomer(order, payload);

  const DELIVERY_STEP_NOTIFY = {
    3: {
      type: 'order_preparing',
      title: 'Preparing Your Order',
      message: `Your order ${orderId} is being prepared for delivery.`,
    },
    4: {
      type: 'order_shipped',
      title: 'Out for Delivery',
      message: `Your order ${orderId} is on the way!`,
    },
    5: {
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order ${orderId} has been delivered. Thank you!`,
    },
  };

  if (changes.deliveryQrIssued) {
    await userPayload({
      type: 'delivery_qr_ready',
      title: 'Show your delivery QR',
      message: `Order ${orderId} is out for delivery. Open Track Order and show the QR code (or 6-digit code) to your driver.`,
      metadata: { orderId, openTrack: true },
      relatedId: orderId,
    });
    await maybeSendSmsAlert({
      userId: order.userId,
      phone: order.phone,
      message: `MMF: Order ${orderId} is out for delivery. Open Track Order and show your QR or 6-digit code to the driver.`,
    });
    await notifyAdmins({
      type: 'delivery_qr_ready',
      title: 'Delivery QR issued',
      message: `Order ${orderId} — out for delivery; customer QR/code ready.`,
      relatedId: orderId,
      metadata: { orderId, customer: order.customer },
    });
  }

  if (changes.currentStepChanged && changes.currentStep >= 3) {
    const stepPayload = DELIVERY_STEP_NOTIFY[changes.currentStep];
    if (stepPayload) {
      // Avoid double SMS/notif noise when QR-ready already covers step 4
      if (!(changes.currentStep === 4 && changes.deliveryQrIssued)) {
        await userPayload({
          ...stepPayload,
          metadata: { orderId, currentStep: changes.currentStep, amount: order.amount },
        });

        if (changes.currentStep === 4) {
          await maybeSendSmsAlert({
            userId: order.userId,
            phone: order.phone,
            message: `MMF: Order ${orderId} is out for delivery.`,
          });
        }
      }
      if (changes.currentStep === 5) {
        await maybeSendSmsAlert({
          userId: order.userId,
          phone: order.phone,
          message: `MMF: Order ${orderId} has been delivered. Thank you for shopping with us!`,
        });
      }

      const adminStepMessages = {
        3: `Order ${orderId} — preparing for delivery.`,
        4: `Order ${orderId} — out for delivery.`,
        5: `Order ${orderId} — delivered.`,
      };
      const adminMsg = adminStepMessages[changes.currentStep];
      if (adminMsg && !(changes.currentStep === 4 && changes.deliveryQrIssued)) {
        await notifyAdmins({
          type: 'order_status_changed',
          title: 'Delivery Step Updated',
          message: adminMsg,
          relatedId: orderId,
          metadata: { orderId, currentStep: changes.currentStep, customer: order.customer },
        });
      }
    }
  }

  if (changes.paymentType === 'paid' || changes.payment === 'Paid') {
    await userPayload({
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Your payment for order ${orderId} was successful.`,
      metadata: { orderId, amount: order.amount },
    });
    await maybeSendSmsAlert({
      userId: order.userId,
      phone: order.phone,
      message: `MMF: Payment received for order ${orderId}. Thank you!`,
    });
  }

  if (changes.paymentType === 'failed' || changes.payment === 'Failed') {
    await userPayload({
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Your payment for order ${orderId} has failed. Please try again.`,
      metadata: { orderId, amount: order.amount },
    });
  }

  if (changes.status === 'processing' && changes.statusChanged && !changes.currentStepChanged) {
    await userPayload({
      type: 'order_processing',
      title: 'Order Processing',
      message: `Your order ${orderId} is now being processed.`,
      metadata: { orderId },
    });
  }

  if (changes.status === 'shipped' && changes.statusChanged && !changes.currentStepChanged) {
    await userPayload({
      type: 'order_shipped',
      title: 'Order Shipped',
      message: `Your order ${orderId} is on the way!`,
      metadata: { orderId },
    });
    await maybeSendSmsAlert({
      userId: order.userId,
      phone: order.phone,
      message: `MMF: Order ${orderId} is out for delivery.`,
    });
  }

  if (changes.status === 'delivered' && changes.statusChanged && !changes.currentStepChanged) {
    await userPayload({
      type: 'order_delivered',
      title: 'Order Delivered',
      message: `Your order ${orderId} has been delivered. Thank you!`,
      metadata: { orderId },
    });
    await maybeSendSmsAlert({
      userId: order.userId,
      phone: order.phone,
      message: `MMF: Order ${orderId} has been delivered. Thank you for shopping with us!`,
    });
  }

  if (changes.status === 'cancelled' && changes.statusChanged) {
    let message = `Your order ${orderId} has been cancelled.`;
    if (changes.refundCompleted) {
      message = `Your order ${orderId} was cancelled and your payment was refunded to your EVC Plus wallet.`;
    } else if (changes.refundScheduled) {
      message = `Your order ${orderId} was cancelled. ${changes.refundMessage || `Refund will be sent to your EVC Plus wallet within ${formatRefundProcessingDelay()}.`}`;
    } else if (changes.refundAttempted && !changes.refundCompleted) {
      message = `Your order ${orderId} was cancelled. ${changes.refundMessage || 'Contact support to receive your refund.'}`;
    }

    await userPayload({
      type: 'order_cancelled',
      title: changes.refundCompleted ? 'Order Cancelled — Refunded' : 'Order Cancelled',
      message,
      metadata: {
        orderId,
        refundAttempted: Boolean(changes.refundAttempted),
        refundCompleted: Boolean(changes.refundCompleted),
        refundScheduled: Boolean(changes.refundScheduled),
      },
    });
  }

  if (changes.refundCompleted && !changes.statusChanged) {
    await userPayload({
      type: 'payment_refunded',
      title: 'Refund Sent',
      message: `Your refund for order ${orderId} was sent to your EVC Plus wallet.`,
      metadata: { orderId },
    });
  }

  if (changes.statusChanged && changes.status && !changes.currentStepChanged) {
    const adminStatusMessages = {
      processing: `Order ${orderId} moved to processing.`,
      shipped: `Order ${orderId} has been shipped.`,
      delivered: `Order ${orderId} was delivered.`,
      cancelled: `Order ${orderId} was cancelled.`,
    };
    const adminMessage = adminStatusMessages[changes.status];
    if (adminMessage) {
      await notifyAdmins({
        type: 'order_status_changed',
        title: 'Order Status Updated',
        message: adminMessage,
        relatedId: orderId,
        metadata: { orderId, status: changes.status, customer: order.customer },
      });
    }
  }

  if (changes.driverAssigned && changes.assignmentAccepted) {
    await userPayload({
      type: 'driver_assigned',
      title: 'Driver Assigned',
      message: `A driver has been assigned to order ${orderId}.`,
      metadata: { orderId, driver: order.driver },
    });
  }
}

async function onDriverAssignmentPending(order, driver) {
  await notifyUser({
    userId: driver.id,
    type: 'delivery_assigned',
    title: 'New Delivery Request',
    message: `Please accept or decline order ${order.id} for ${order.customer}.`,
    relatedId: order.id,
    metadata: {
      orderId: order.id,
      address: order.address,
      customer: order.customer,
      pendingAcceptance: true,
    },
  });

  if (driver.phone) {
    await maybeSendSmsAlert({
      userId: driver.id,
      phone: driver.phone,
      message: `MMF Delivery: New request ${order.id} — open your delivery app to accept or decline.`,
    });
  }
}

async function onDriverAssignmentAccepted(order) {
  await notifyOrderCustomer(order, {
    type: 'driver_assigned',
    title: 'Driver Assigned',
    message: `A driver has been assigned to order ${order.id}.`,
    metadata: { orderId: order.id, driver: order.driver },
  });

  await notifyAdmins({
    type: 'delivery_accepted',
    title: 'Driver Accepted Delivery',
    message: `${order.driver} accepted order ${order.id}.`,
    relatedId: order.id,
    metadata: { orderId: order.id, driverId: order.assignedDriverId },
  });
}

async function onDriverAssignmentRejected(order, { driverId, driverName, reason }) {
  await notifyAdmins({
    type: 'driver_rejected',
    title: 'Driver Declined Delivery',
    message: `${driverName || 'Driver'} declined order ${order.id}: ${reason}`,
    relatedId: order.id,
    metadata: { orderId: order.id, driverId, reason },
  });
}

async function onDriverUnassigned(order, { driverId, driverName, reason }) {
  if (!driverId) return;
  await notifyUser({
    userId: driverId,
    type: 'delivery_unassigned',
    title: 'Delivery Assignment Removed',
    message: reason || `You are no longer assigned to order ${order.id}.`,
    relatedId: order.id,
    metadata: { orderId: order.id, driverName },
  });
}

async function onSupportAdminReply(ticket, messageText = '') {
  const replyText = String(messageText || ticket.lastMessageText || '').trim();
  await notifyUser({
    userId: ticket.userId,
    type: 'support_replied',
    title: 'Support Replied',
    message: `We replied to your message: "${ticket.subject}".`,
    relatedId: ticket.id,
    metadata: { ticketId: ticket.id, subject: ticket.subject, replyText },
  });
}

async function onSupportTicketCreated(ticket) {
  await notifyAdmins({
    type: 'new_support_ticket',
    title: 'New Support Ticket',
    message: `${ticket.name} opened ticket ${ticket.id}: ${ticket.subject}`,
    relatedId: ticket.id,
    metadata: { ticketId: ticket.id, subject: ticket.subject },
  });
}

async function onSupportCustomerMessage(ticket, messageText) {
  const preview = String(messageText || '').trim().slice(0, 100);
  await notifyAdmins({
    type: 'support_message',
    title: 'Customer Support Reply',
    message: `${ticket.name} replied on ${ticket.id}: ${preview}`,
    relatedId: ticket.id,
    metadata: { ticketId: ticket.id, subject: ticket.subject },
  });
}

async function onDriverApplication(user) {
  await notifyAdmins({
    type: 'driver_application',
    title: 'New Driver Application',
    message: `${user.firstName} ${user.lastName || ''} applied as delivery driver.`,
    relatedId: user.id,
    metadata: { userId: user.id, name: `${user.firstName} ${user.lastName || ''}`.trim() },
  });
}

async function onProductBackInStock(product) {
  const Wishlist = require('../models/Wishlist');
  const title = product.title;
  if (!title) return;

  const wishlists = await Wishlist.find({ productTitles: title }).select('userId');
  const userIds = [...new Set(wishlists.map((w) => w.userId).filter(Boolean))];
  if (userIds.length === 0) return;

  const image = Array.isArray(product.images) && product.images[0] ? product.images[0] : '';

  await Notification.insertMany(
    userIds.map((userId, index) => ({
      id: `NTF-${Date.now()}-${index}-${Math.floor(Math.random() * 9000 + 1000)}`,
      audience: 'user',
      userId,
      type: 'wishlist_stock',
      title: 'Wishlist Item Back in Stock',
      message: `Good news! "${title}" from your wishlist is available again.`,
      relatedId: String(product.id),
      read: false,
      metadata: {
        productId: product.id,
        productTitle: title,
        image,
        price: product.price,
      },
    }))
  );
}

async function onPromotionActivated(promo) {
  const code = promo.code || '';
  const description = promo.description || 'Qiimo dhimis cusub';
  const title = 'Qiimo Dhimis Cusub!';
  const message = `Koodhka qiimo dhimista: ${code}. Fadlan macamiil ka faaideyso fursadan gaarka ah ee qiimo dhimista!`;

  const customers = await User.find({
    status: { $ne: 'Inactive' },
  }).select('id');

  const userIds = customers.map((u) => u.id).filter(Boolean);
  if (userIds.length === 0) return;

  await Notification.insertMany(
    userIds.map((userId, index) => ({
      id: `NTF-${Date.now()}-${index}-${Math.floor(Math.random() * 9000 + 1000)}`,
      audience: 'user',
      userId,
      type: 'coupon_offer',
      title,
      message,
      relatedId: promo.id || code,
      read: false,
      metadata: {
        promoCode: code,
        description: `${description}. Isticmaal koodhka qiimo dhimista marka aad checkout-ka joogto si aad u hesho dhimis.`,
        discountAmount: promo.discountAmount || 0,
        discountPercent: promo.discountPercent || 0,
        applicableCategory: promo.applicableCategory || '',
        applicableProduct: promo.applicableProduct || '',
        durationDays: promo.durationDays || 0,
        expiresAt: promo.expiresAt || null,
      },
    }))
  );
}

async function onBannerActivated(banner) {
  const title = banner.title || 'Dallacsiin Cusub!';
  const message = banner.subtitle || 'Ka faa\'iideyso qiimo dhimis gaar ah oo hadda firfircoon!';
  const image = banner.image || '';

  const customers = await User.find({
    status: { $ne: 'Inactive' },
  }).select('id');

  const userIds = customers.map((u) => u.id).filter(Boolean);
  if (userIds.length === 0) return;

  await Notification.insertMany(
    userIds.map((userId, index) => ({
      id: `NTF-${Date.now()}-${index}-${Math.floor(Math.random() * 9000 + 1000)}`,
      audience: 'user',
      userId,
      type: 'weekend_offer',
      title,
      message,
      relatedId: banner.id || '',
      read: false,
      metadata: {
        promoCode: 'OFFER',
        description: banner.subtitle || 'Dallacsiin gaar ah oo ku saabsan alaabteena.',
        image,
        productTitle: banner.title || 'Alaabta Dallacsiinta',
      },
    }))
  );
}

module.exports = {
  notifyAdmins,
  notifyUser,
  notifyUserByPhone,
  notifyOrderCustomer,
  userAllowsEmailAlerts,
  userAllowsSmsAlerts,
  onOrderCreated,
  onOrderUpdated,
  onDriverAssignmentPending,
  onDriverAssignmentAccepted,
  onDriverAssignmentRejected,
  onDriverUnassigned,
  onSupportAdminReply,
  onSupportTicketCreated,
  onSupportCustomerMessage,
  onDriverApplication,
  onProductBackInStock,
  onPromotionActivated,
  onBannerActivated,
};
