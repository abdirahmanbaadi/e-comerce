import { MOCK_NOTIFICATIONS } from '../mobile/mockNotifications';
import { getNotificationCta } from './notificationTypes';

/** Matches backend/controllers/notificationController.js UI_META for customer types. */
const UI_META = {
  order_placed: { iconType: 'order-placed', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-placed', highlight: true },
  order_confirmed: { iconType: 'order-confirmed', dot: 'green', iconWrap: 'solid-green', modalType: 'order-confirmed', highlight: true },
  payment_success: { iconType: 'payment-success', dot: 'green', iconWrap: 'solid-green', modalType: 'payment-success' },
  payment_failed: { iconType: 'payment-failed', dot: 'red', iconWrap: 'solid-red', modalType: 'payment-failed' },
  payment_pending: { iconType: 'payment-pending', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'payment-pending', highlight: true },
  payment_refunded: { iconType: 'payment-refunded', dot: 'green', iconWrap: 'solid-green', modalType: 'payment-refunded' },
  order_processing: { iconType: 'order-processing', dot: 'gold', iconWrap: 'solid-yellow', modalType: 'order-processing' },
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
  delivery_qr_ready: { iconType: 'delivery-qr-ready', dot: 'green', iconWrap: 'solid-green', modalType: 'delivery-qr-ready', highlight: true },
};

function metaFor(type) {
  return (
    UI_META[type] || {
      iconType: 'order-confirmed',
      dot: 'grey',
      iconWrap: 'solid-green',
      modalType: 'order-confirmed',
    }
  );
}

/** Web API-shaped preview notifications (same content as mobile mocks). */
export function getWebMockNotifications() {
  return MOCK_NOTIFICATIONS.map((n, index) => {
    const meta = metaFor(n.type);
    const unread = Boolean(n.unread);
    return {
      id: `web-mock-${n.id}`,
      index,
      type: n.type,
      title: n.title,
      desc: n.desc || '',
      body: n.body || n.desc || '',
      time: n.time,
      unread,
      read: !unread,
      relatedId: n.orderId || '',
      orderId: n.orderId || '',
      paymentTotal: '',
      couponCode: n.couponCode || '',
      productImage: n.productImage || '',
      productName: n.productName || '',
      metadata: {
        orderId: n.orderId || '',
        promoCode: n.couponCode || '',
        image: n.productImage || '',
        productTitle: n.productName || '',
        preview: true,
      },
      dot: unread ? meta.dot : 'grey',
      iconWrap: meta.iconWrap,
      iconType: meta.iconType,
      modalType: meta.modalType,
      highlight: Boolean(meta.highlight && unread),
      dynamic: Boolean(meta.dynamic),
      audience: 'user',
      isPreview: true,
    };
  });
}

export function getWebMockUnreadCount(items = getWebMockNotifications()) {
  return items.filter((n) => n.unread).length;
}

/** Web navigation targets for notification CTAs (mirrors app actions / labels). */
export function getWebNotificationAction(item) {
  return getNotificationCta(item, 'web');
}
