/**
 * notifications.js — All notification-related frontend utilities in one place.
 *
 * Sections:
 *   1. Toast & UI alerts   — showTopFloatNotification, showAlert, showModalError
 *   2. User preferences    — email/SMS/push alert settings (localStorage)
 *   3. Order context       — order data for notification modals
 */

import { formatMoney } from './format';
import { apiUrl, normalizeOrderId } from './data';

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 1 — Toast & UI alerts
   ═══════════════════════════════════════════════════════════════════════════ */

let toastTimeoutId = null;

/** Floating toast at top of screen (success / danger / warning). */
export function showTopFloatNotification(message, type = 'success') {
  let toast = document.getElementById('sitopiaToast') || document.getElementById('toastBox') || document.getElementById('dynamicToast');
  let msgEl = document.getElementById('toastMessage');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dynamicToast';
    toast.className = 'sitopia-toast';

    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-triangle-exclamation';
    toast.appendChild(icon);

    msgEl = document.createElement('span');
    msgEl.id = 'toastMessage';
    toast.appendChild(msgEl);

    document.body.appendChild(toast);
  } else {
    const icon = toast.querySelector('i');
    if (icon) {
      if (type === 'success') icon.className = 'fa-solid fa-circle-check';
      else if (type === 'danger') icon.className = 'fa-solid fa-circle-xmark';
      else icon.className = 'fa-solid fa-triangle-exclamation';
    }
  }

  if (msgEl) msgEl.textContent = message;
  else {
    const span = toast.querySelector('span');
    if (span) span.textContent = message;
  }

  toast.classList.add('show');

  if (toastTimeoutId) clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => toast.classList.remove('show'), 3000);
}

/** Inline alert inside a container element (legacy Bootstrap-style pages). */
export function showAlert(containerId, message, type = 'danger') {
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = `
      <div class="alert alert-${type} alert-dismissible fade show" role="alert" style="border-radius: 10px; font-size: 0.88rem; font-weight: 600;">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
  }
}

/** Temporary error banner inside a modal step. */
export function showModalError(stepId, message) {
  const stepEl = document.getElementById(stepId);
  if (!stepEl) return;
  const existingAlert = stepEl.querySelector('.alert-modal-error');
  if (existingAlert) existingAlert.remove();

  const alertDiv = document.createElement('div');
  alertDiv.className = 'alert alert-danger alert-modal-error mt-2';
  alertDiv.style.borderRadius = '8px';
  alertDiv.style.fontSize = '0.82rem';
  alertDiv.style.fontWeight = '600';
  alertDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation me-2"></i>${message}`;

  const button = stepEl.querySelector('button');
  if (button) stepEl.insertBefore(alertDiv, button);
  else stepEl.appendChild(alertDiv);

  setTimeout(() => alertDiv.remove(), 4000);
}

/** Toggle password field visibility (used on auth forms). */
export function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const wrapper = input.parentElement;
  const icon = wrapper.querySelector('.password-toggle-icon') || input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) {
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  } else {
    input.type = 'password';
    if (icon) {
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 2 — User notification preferences (Settings tab)
   ═══════════════════════════════════════════════════════════════════════════ */

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  emailAlerts: true,
  smsAlerts: false,
  pushAlerts: false,
  securityEmail: true,
  securitySms: true,
};

/** Read saved alert preferences from localStorage (with safe defaults). */
export function readNotificationPreferences() {
  try {
    const raw = localStorage.getItem('userNotificationPrefs');
    if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

/** Persist alert preferences and return the merged object. */
export function storeNotificationPreferences(prefs) {
  const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...prefs };
  localStorage.setItem('userNotificationPrefs', JSON.stringify(merged));
  return merged;
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION 3 — Order context for notification modals
   ═══════════════════════════════════════════════════════════════════════════ */

/** Last checkout order from localStorage, or demo fallback for modals. */
export function getLastOrderDetails() {
  try {
    const stored = JSON.parse(localStorage.getItem('lastOrderDetails'));
    if (stored?.orderId) return stored;
  } catch {
    // ignore parse errors
  }

  return {
    orderId: 'MF-250515-001',
    total: 650,
    customerName: 'Abdullahi Hassan',
    customerPhone: '+252 61 2345678',
    paymentMethod: 'EVC Plus',
    paymentStatus: 'Paid',
    deliveryAddress: 'Hodan District, Mogadishu',
    orderStatus: 'Confirmed',
    orderDate: 'May 15, 2025',
    items: [
      {
        title: 'Luxe 3-Seater Sofa',
        image: '/product-images/ivory-cloud-sofa-set-main.jpeg.jpeg',
        quantity: 1,
        price: 650,
      },
      {
        title: 'Bloom Accent Chair Set',
        image: '/product-images/bloom-round-accent-chair-set-main.jpeg.png',
        quantity: 1,
        price: 150,
      },
      {
        title: 'Blush Velvet Arch Bed',
        image: '/product-images/blush-velvet-arch-bed-main.jpeg.jpeg',
        quantity: 1,
        price: 850,
      },
    ],
  };
}

/** Format order total for display in payment notification modals. */
export function getOrderTotalFormatted(order) {
  if (!order?.total) return '$650.00';
  return typeof order.total === 'string' && order.total.startsWith('$')
    ? order.total
    : formatMoney(order.total);
}

/** Fetch real order details from API for notification modals (falls back to getLastOrderDetails). */
export async function fetchOrderForNotification(orderId) {
  const normalizedId = normalizeOrderId(orderId);
  if (!normalizedId) return null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const response = await fetch(apiUrl(`/api/orders/${encodeURIComponent(normalizedId)}/details`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    if (!response.ok || !data.success) return null;

    const order = data.order;
    const breakdown = data.breakdown || {};

    return {
      orderId: order.id,
      customerName: order.customer,
      customerPhone: order.phone,
      customerEmail: order.email || '',
      paymentMethod: order.paymentMethod || order.payment || 'EVC Plus',
      paymentStatus: order.payment || 'Pending',
      deliveryAddress: order.address,
      orderStatus: order.status || 'Confirmed',
      orderDate: order.createdAt
        ? new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
        : '',
      total: breakdown.grandTotal ?? order.amount,
      subtotal: breakdown.subtotal,
      discount: breakdown.discount,
      deliveryFee: breakdown.deliveryFee,
      items: (order.items || []).map((item) => ({
        title: item.title,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
      })),
    };
  } catch {
    return null;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Legacy window exports (onclick handlers in older markup)
   ═══════════════════════════════════════════════════════════════════════════ */

if (typeof window !== 'undefined') {
  window.showTopFloatNotification = showTopFloatNotification;
  window.showAlert = showAlert;
  window.showModalError = showModalError;
  window.togglePasswordVisibility = togglePasswordVisibility;
}
