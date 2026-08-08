const Notification = require('../models/Notification');
const { isDashboardRole } = require('../utils/roleUtils');

function formatTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const UI_META = {
  order_placed: { iconType: 'order-placed', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-placed', highlight: true },
  order_confirmed: { iconType: 'order-confirmed', dot: 'green', iconWrap: 'solid-green', modalType: 'order-confirmed', highlight: true },
  payment_success: { iconType: 'payment-success', dot: 'green', iconWrap: 'solid-green', modalType: 'payment-success' },
  payment_failed: { iconType: 'payment-failed', dot: 'red', iconWrap: 'solid-red', modalType: 'payment-failed' },
  payment_pending: { iconType: 'payment-pending', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'payment-pending', highlight: true },
  payment_refunded: { iconType: 'payment-refunded', dot: 'green', iconWrap: 'solid-green', modalType: 'payment-refunded' },
  order_processing: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-processing' },
  order_payment_verified: { iconType: 'order-processing', dot: 'green', iconWrap: 'solid-green', modalType: 'order-payment-verified' },
  order_preparing: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-preparing' },
  order_shipped: { iconType: 'delivery-assigned', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-shipped' },
  order_delivered: { iconType: 'order-confirmed', dot: 'green', iconWrap: 'solid-green', modalType: 'order-delivered' },
  order_cancelled: { iconType: 'payment-failed', dot: 'red', iconWrap: 'solid-red', modalType: 'payment-failed' },
  driver_assigned: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-processing' },
  delivery_delayed: { iconType: 'delivery-delayed', dot: 'gold', iconWrap: 'solid-orange', modalType: 'delivery-delayed' },
  delivery_pickup: { iconType: 'delivery-pickup', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'delivery-pickup' },
  support_replied: { iconType: 'support-replied', dot: 'grey', iconWrap: 'solid-brown', modalType: 'support-replied', dynamic: true },
  support_ticket: { iconType: 'support-ticket', dot: 'grey', iconWrap: 'solid-brown', modalType: 'support-ticket' },
  wishlist_stock: { iconType: 'wishlist', dot: 'grey', iconWrap: 'solid-yellow', modalType: 'wishlist-available' },
  wishlist_drop: { iconType: 'wishlist-drop', dot: 'gold', iconWrap: 'solid-orange', modalType: 'wishlist-drop' },
  weekend_offer: { iconType: 'weekend-offer', dot: 'grey', iconWrap: 'solid-orange', modalType: 'weekend-offer' },
  coupon_offer: { iconType: 'weekend-offer', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'coupon-offer' },
  coupon_expiring: { iconType: 'coupon-expiring', dot: 'gold', iconWrap: 'solid-orange', modalType: 'coupon-expiring' },
  promo_new: { iconType: 'promo-new', dot: 'green', iconWrap: 'solid-green', modalType: 'promo-new' },
  review_reminder: { iconType: 'review-reminder', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'review-reminder' },
  review_thanks: { iconType: 'review-thanks', dot: 'green', iconWrap: 'solid-green', modalType: 'review-thanks' },
  account_security: { iconType: 'account-security', dot: 'grey', iconWrap: 'solid-brown', modalType: 'account-security' },
  new_order: { iconType: 'order-confirmed', dot: 'green', iconWrap: 'solid-green', modalType: 'order-confirmed' },
  driver_application: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-processing' },
  new_support_ticket: { iconType: 'support-replied', dot: 'grey', iconWrap: 'solid-brown', modalType: 'support-replied' },
  delivery_assigned: { iconType: 'delivery-assigned', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'delivery-assigned' },
  delivery_accepted: { iconType: 'order-confirmed', dot: 'green', iconWrap: 'solid-green', modalType: 'order-confirmed' },
  driver_rejected: { iconType: 'payment-failed', dot: 'red', iconWrap: 'solid-red', modalType: 'payment-failed' },
  support_message: { iconType: 'support-replied', dot: 'grey', iconWrap: 'solid-brown', modalType: 'support-replied' },
  order_status_changed: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-processing' },
  delivery_unassigned: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'delivery-assigned' },
  delivery_qr_ready: { iconType: 'delivery-qr-ready', dot: 'green', iconWrap: 'solid-green', modalType: 'delivery-qr-ready', highlight: true },
  review_moderated: { iconType: 'weekend-offer', dot: 'green', iconWrap: 'solid-green', modalType: 'review-moderated' },
};

function mapNotification(n, index) {
  const meta = UI_META[n.type] || {
    iconType: 'order-confirmed',
    dot: 'grey',
    iconWrap: 'solid-green',
    modalType: 'order-confirmed',
  };

  return {
    id: n.id,
    index,
    type: n.type,
    title: n.title,
    desc: n.message,
    body: n.message,
    time: formatTime(n.createdAt),
    unread: !n.read,
    read: n.read,
    relatedId: n.relatedId,
    orderId: n.metadata?.orderId || n.relatedId,
    paymentTotal: n.metadata?.amount || '',
    couponCode: n.metadata?.promoCode || '',
    productImage: n.metadata?.image || '',
    productName: n.metadata?.productTitle || '',
    metadata: n.metadata || {},
    dot: n.read ? 'grey' : meta.dot,
    iconWrap: meta.iconWrap,
    iconType: meta.iconType,
    modalType: meta.modalType,
    highlight: meta.highlight && !n.read,
    dynamic: meta.dynamic,
    audience: n.audience,
  };
}

function queryForUser(user) {
  if (isDashboardRole(user.role)) {
    return { audience: 'admin' };
  }
  return { audience: 'user', userId: user.id };
}

exports.getNotifications = async (req, res) => {
  try {
    const filter = queryForUser(req.user);
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ ...filter, read: false }),
    ]);

    return res.status(200).json({
      success: true,
      count: items.length,
      unreadCount,
      notifications: items.map(mapNotification),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const filter = { ...queryForUser(req.user), read: false };
    const count = await Notification.countDocuments(filter);
    return res.status(200).json({ success: true, count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to count notifications.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { id, ...queryForUser(req.user) };
    const notification = await Notification.findOneAndUpdate(filter, { read: true }, { new: true });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    return res.status(200).json({ success: true, notification: mapNotification(notification, 0) });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    const filter = { ...queryForUser(req.user), read: false };
    await Notification.updateMany(filter, { read: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to mark notifications as read.' });
  }
};
