/**
 * Shared customer notification type registry — keep web + mobile in sync.
 * Types match backend/services/notificationService.js emitters.
 */

export const CUSTOMER_NOTIFICATION_TYPES = [
  'order_placed',
  'order_confirmed',
  'payment_success',
  'payment_failed',
  'payment_pending',
  'payment_refunded',
  'order_processing',
  'order_preparing',
  'order_shipped',
  'order_delivered',
  'order_cancelled',
  'driver_assigned',
  'delivery_qr_ready',
  'delivery_delayed',
  'delivery_pickup',
  'support_replied',
  'support_ticket',
  'wishlist_stock',
  'wishlist_drop',
  'coupon_offer',
  'coupon_expiring',
  'weekend_offer',
  'promo_new',
  'review_reminder',
  'review_thanks',
  'review_moderated',
  'account_security',
];

/** Navbar / list icon map (Font Awesome class + accent). */
export const NOTIF_TYPE_ICON = {
  order_placed: { icon: 'fa-bag-shopping', color: '#f59e0b' },
  order_confirmed: { icon: 'fa-bag-shopping', color: '#10b981' },
  payment_success: { icon: 'fa-wallet', color: '#10b981' },
  payment_failed: { icon: 'fa-circle-xmark', color: '#ef4444' },
  payment_pending: { icon: 'fa-clock', color: '#f59e0b' },
  payment_refunded: { icon: 'fa-money-bill-transfer', color: '#10b981' },
  order_processing: { icon: 'fa-box', color: '#f59e0b' },
  order_preparing: { icon: 'fa-box-open', color: '#f59e0b' },
  order_shipped: { icon: 'fa-truck-fast', color: '#2456c8' },
  order_delivered: { icon: 'fa-check-double', color: '#10b981' },
  order_cancelled: { icon: 'fa-ban', color: '#ef4444' },
  driver_assigned: { icon: 'fa-user-check', color: '#10b981' },
  delivery_qr_ready: { icon: 'fa-qrcode', color: '#10b981' },
  delivery_delayed: { icon: 'fa-clock', color: '#f59e0b' },
  delivery_pickup: { icon: 'fa-warehouse', color: '#f59e0b' },
  support_replied: { icon: 'fa-headset', color: '#3b82f6' },
  support_ticket: { icon: 'fa-ticket', color: '#5b3cc4' },
  wishlist_stock: { icon: 'fa-heart', color: '#d8a128' },
  wishlist_drop: { icon: 'fa-tags', color: '#c0392b' },
  coupon_offer: { icon: 'fa-tags', color: '#b4236b' },
  coupon_expiring: { icon: 'fa-hourglass-half', color: '#b4236b' },
  weekend_offer: { icon: 'fa-tag', color: '#f59e0b' },
  promo_new: { icon: 'fa-sparkles', color: '#0b6b45' },
  review_reminder: { icon: 'fa-star', color: '#c48a00' },
  review_thanks: { icon: 'fa-star', color: '#10b981' },
  review_moderated: { icon: 'fa-star', color: '#10b981' },
  account_security: { icon: 'fa-shield-halved', color: '#334155' },
};

/** Mobile list tones (Tailwind-friendly). */
export const NOTIF_TYPE_TONE = {
  order_placed: { icon: 'fa-bag-shopping', iconStyle: 'fa-solid', tone: 'bg-[#fff1e6] text-[#b45309]' },
  order_confirmed: { icon: 'fa-bag-shopping', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  payment_success: { icon: 'fa-wallet', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  payment_failed: { icon: 'fa-circle-xmark', iconStyle: 'fa-solid', tone: 'bg-[#fdecec] text-[#c0392b]' },
  payment_pending: { icon: 'fa-clock', iconStyle: 'fa-solid', tone: 'bg-[#fff1e6] text-[#b45309]' },
  payment_refunded: { icon: 'fa-money-bill-transfer', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  order_processing: { icon: 'fa-box', iconStyle: 'fa-solid', tone: 'bg-[#f3eee6] text-[#6b4228]' },
  order_preparing: { icon: 'fa-box-open', iconStyle: 'fa-solid', tone: 'bg-[#f3eee6] text-[#6b4228]' },
  order_shipped: { icon: 'fa-truck-fast', iconStyle: 'fa-solid', tone: 'bg-[#e8f0ff] text-[#2456c8]' },
  order_delivered: { icon: 'fa-check-double', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  order_cancelled: { icon: 'fa-ban', iconStyle: 'fa-solid', tone: 'bg-[#fdecec] text-[#c0392b]' },
  driver_assigned: { icon: 'fa-user-check', iconStyle: 'fa-solid', tone: 'bg-[#e8f0ff] text-[#2456c8]' },
  delivery_qr_ready: { icon: 'fa-qrcode', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  delivery_delayed: { icon: 'fa-clock', iconStyle: 'fa-solid', tone: 'bg-[#fff1e6] text-[#b45309]' },
  delivery_pickup: { icon: 'fa-warehouse', iconStyle: 'fa-solid', tone: 'bg-[#e8f0ff] text-[#2456c8]' },
  support_replied: { icon: 'fa-headset', iconStyle: 'fa-solid', tone: 'bg-[#ece8ff] text-[#5b3cc4]' },
  support_ticket: { icon: 'fa-ticket', iconStyle: 'fa-solid', tone: 'bg-[#ece8ff] text-[#5b3cc4]' },
  wishlist_stock: { icon: 'fa-heart', iconStyle: 'fa-solid', tone: 'bg-[#fdecec] text-[#c0392b]' },
  wishlist_drop: { icon: 'fa-tags', iconStyle: 'fa-solid', tone: 'bg-[#fdecec] text-[#c0392b]' },
  coupon_offer: { icon: 'fa-tags', iconStyle: 'fa-solid', tone: 'bg-[#fde8f1] text-[#b4236b]' },
  coupon_expiring: { icon: 'fa-hourglass-half', iconStyle: 'fa-solid', tone: 'bg-[#fde8f1] text-[#b4236b]' },
  weekend_offer: { icon: 'fa-tag', iconStyle: 'fa-solid', tone: 'bg-[#fff1e6] text-[#b45309]' },
  promo_new: { icon: 'fa-sparkles', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  review_reminder: { icon: 'fa-star', iconStyle: 'fa-solid', tone: 'bg-[#fff6e0] text-[#c48a00]' },
  review_thanks: { icon: 'fa-star', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  review_moderated: { icon: 'fa-star', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' },
  account_security: { icon: 'fa-shield-halved', iconStyle: 'fa-solid', tone: 'bg-[#eef2f6] text-[#334155]' },
};

export function getNotificationTypeIcon(type = '') {
  const key = String(type || '');
  return NOTIF_TYPE_ICON[key] || { icon: 'fa-bell', color: '#10b981' };
}

export function getNotificationTypeTone(type = '') {
  const key = String(type || '');
  if (NOTIF_TYPE_TONE[key]) return NOTIF_TYPE_TONE[key];
  const t = key.toLowerCase();
  if (t.includes('payment') || t.includes('refund')) {
    return { icon: 'fa-wallet', iconStyle: 'fa-solid', tone: 'bg-[#e8f5ef] text-[#0b6b45]' };
  }
  if (t.includes('deliver') || t.includes('ship') || t.includes('driver')) {
    return { icon: 'fa-truck-fast', iconStyle: 'fa-solid', tone: 'bg-[#e8f0ff] text-[#2456c8]' };
  }
  if (t.includes('coupon') || t.includes('offer') || t.includes('promo')) {
    return { icon: 'fa-tags', iconStyle: 'fa-solid', tone: 'bg-[#fde8f1] text-[#b4236b]' };
  }
  if (t.includes('wish')) {
    return { icon: 'fa-heart', iconStyle: 'fa-solid', tone: 'bg-[#fdecec] text-[#c0392b]' };
  }
  if (t.includes('review')) {
    return { icon: 'fa-star', iconStyle: 'fa-solid', tone: 'bg-[#fff6e0] text-[#c48a00]' };
  }
  if (t.includes('support')) {
    return { icon: 'fa-headset', iconStyle: 'fa-solid', tone: 'bg-[#ece8ff] text-[#5b3cc4]' };
  }
  if (t.includes('account') || t.includes('security')) {
    return { icon: 'fa-shield-halved', iconStyle: 'fa-solid', tone: 'bg-[#eef2f6] text-[#334155]' };
  }
  return { icon: 'fa-bell', iconStyle: 'fa-solid', tone: 'bg-[#f3eee6] text-[#6b4228]' };
}

/** Shared copy — list preview (short). */
export function getNotificationListText(item) {
  return String(item?.desc || item?.message || item?.body || '').trim();
}

/** Shared copy — detail panel (full). Same on web + app. */
export function getNotificationDetailText(item) {
  return String(item?.body || item?.message || item?.desc || '').trim();
}

export function getNotificationTitle(item) {
  return String(item?.title || 'Notification').trim();
}

export function getNotificationOrderId(item) {
  return String(item?.orderId || item?.metadata?.orderId || item?.relatedId || '').trim();
}

export function getNotificationCouponCode(item) {
  return String(item?.couponCode || item?.metadata?.promoCode || '').trim();
}

export function getNotificationProductImage(item) {
  return String(item?.productImage || item?.metadata?.image || '').trim();
}

export function getNotificationProductName(item) {
  return String(item?.productName || item?.metadata?.productTitle || '').trim();
}

/**
 * Shared CTA labels (paths differ by platform).
 * @param {'app'|'web'} platform
 */
export function getNotificationCta(item, platform = 'web') {
  const type = String(item?.type || '');
  const orderId = getNotificationOrderId(item);
  const app = platform === 'app';

  if (type.includes('wish') || type.includes('stock')) {
    return {
      label: 'Open Wishlist',
      path: app ? '/app/profile/wishlist' : '/profile?tab=profile',
    };
  }
  if (type.includes('coupon') || type.includes('offer') || type.includes('promo') || type === 'weekend_offer') {
    return {
      label: 'Browse Shop',
      path: app ? '/app/shop' : '/products',
    };
  }
  if (type.includes('review') || type.includes('rate')) {
    return {
      label: 'Rate Order',
      path: app
        ? orderId
          ? `/app/profile/reviews?orderId=${encodeURIComponent(orderId)}`
          : '/app/profile/reviews'
        : '/profile?tab=orders',
    };
  }
  if (type.includes('support') || type.includes('chat') || type.includes('reply')) {
    return {
      label: 'Open Chat',
      path: app ? '/app/profile/support/chat' : '/profile?tab=help',
    };
  }
  if (type.includes('account') || type.includes('security')) {
    return {
      label: 'Open Settings',
      path: app ? '/app/profile/settings' : '/profile?tab=settings',
    };
  }
  if (type.includes('payment') || type.includes('order') || type.includes('deliver') || type.includes('ship')) {
    return {
      label: orderId ? 'View Order' : 'My Orders',
      path: app
        ? orderId
          ? `/app/orders/${encodeURIComponent(orderId)}`
          : '/app/profile/orders'
        : orderId
          ? `/profile?tab=track&orderId=${encodeURIComponent(orderId)}`
          : '/profile?tab=orders',
    };
  }
  return {
    label: 'Go to Profile',
    path: app ? '/app/profile' : '/profile',
  };
}
