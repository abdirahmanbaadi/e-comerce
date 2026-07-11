/** Shared Tailwind tokens + helpers for admin React tabs */

export const ADM_TABLE_CARD =
  'rounded-2xl border border-deepGreen/6 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421]';
export const ADM_TABLE =
  'w-full border-collapse text-[0.88rem] [&_th]:border-b-2 [&_th]:border-gray-100 [&_th]:px-4 [&_th]:py-3.5 [&_th]:text-left [&_th]:text-[0.78rem] [&_th]:font-extrabold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-gray-500 [&_td]:border-b [&_td]:border-gray-100 [&_td]:px-4 [&_td]:py-3.5 [&_td]:align-middle [&_td]:font-semibold [&_tbody_tr:hover]:bg-deepGreen/[0.015] [.admin-dark_&]:[&_th]:border-white/10 [.admin-dark_&]:[&_td]:border-white/10 [.admin-dark_&]:[&_td]:text-gray-200';
export const ADM_LABEL =
  'mb-1.5 block text-[0.82rem] font-extrabold text-gray-800 [.admin-dark_&]:text-gray-200';
export const ADM_INPUT =
  'w-full rounded-[10px] border-[1.5px] border-black/8 bg-white px-3.5 py-2.5 text-[0.88rem] font-semibold text-gray-900 outline-none transition focus:border-deepGreen focus:shadow-[0_0_0_3.5px_rgba(7,61,53,0.06)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#141f1b] [.admin-dark_&]:text-gray-100';
export const ADM_SELECT = `${ADM_INPUT} cursor-pointer`;
export const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-deepGreen to-teal px-6 py-2.5 text-[0.88rem] font-extrabold text-white transition hover:-translate-y-0.5 disabled:opacity-60';
export const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-[10px] bg-gray-100 px-6 py-2.5 text-[0.88rem] font-extrabold text-gray-800 transition hover:bg-gray-200 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-gray-200';
export const BTN_SUCCESS =
  'inline-flex items-center gap-2 rounded-[10px] bg-emerald-500 px-4 py-2 text-[0.82rem] font-extrabold text-white transition hover:bg-emerald-600';
export const STAT_CARD =
  'flex items-center justify-between rounded-2xl border border-deepGreen/6 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] [.admin-dark_&]:border-white/10 [.admin-dark_&]:bg-[#1a2421]';

export const ADMIN_FETCH_TIMEOUT = 8000;
export const MAX_DRIVER_ACTIVE = 3;

export function token() {
  return localStorage.getItem('token');
}

export function authHeaders(json = true) {
  const h = { Authorization: `Bearer ${token()}` };
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

export function formatAdminPrice(price) {
  const n = Number(price);
  if (Number.isNaN(n)) return '$0';
  if (n > 0 && n < 1) return `$${n.toFixed(3)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatUSD(val) {
  return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export function getOrderStatusLabel(order) {
  if (order.currentStep === 0 || order.status === 'Cancelled') return 'Cancelled';
  if (order.currentStep === 5 || order.status === 'Delivered') return 'Delivered';
  if (order.currentStep === 4 || order.status === 'Shipped') return 'Shipped';
  if (order.currentStep === 2 || order.currentStep === 3 || order.status === 'Processing') return 'Processing';
  return 'Pending';
}

export function getOrderPaymentLabel(order) {
  if (!order.payment) return 'Pending';
  const p = order.payment.toLowerCase();
  if (p === 'paid') return 'Paid';
  if (p === 'failed') return 'Failed';
  return 'Pending';
}

export function orderStatusBadgeClass(status) {
  if (status === 'Delivered') return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (status === 'Shipped') return 'bg-blue-100 text-blue-700 [.admin-dark_&]:bg-blue-500/15 [.admin-dark_&]:text-blue-300';
  if (status === 'Cancelled') return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  if (status === 'Processing') return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
  return 'bg-slate-100 text-slate-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-300';
}

export function paymentBadgeClass(payment) {
  if (payment === 'Paid') return 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300';
  if (payment === 'Failed') return 'bg-red-100 text-red-700 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300';
  return 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300';
}

export function getDriverAssignmentMeta(order) {
  const status = order?.assignmentStatus || 'none';
  if (status === 'pending') {
    return {
      label: 'Driver pending',
      cls: 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300',
      icon: 'fa-clock',
    };
  }
  if (status === 'accepted' && order?.assignedDriverId) {
    return {
      label: 'Driver accepted',
      cls: 'bg-emerald-100 text-emerald-800 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300',
      icon: 'fa-circle-check',
    };
  }
  if (order?.assignmentRejectReason) {
    return {
      label: 'Driver rejected',
      cls: 'bg-red-100 text-red-800 [.admin-dark_&]:bg-red-500/15 [.admin-dark_&]:text-red-300',
      icon: 'fa-circle-xmark',
      reason: order.assignmentRejectReason,
    };
  }
  return null;
}

export function buildDriverAssignmentHint(order) {
  const meta = getDriverAssignmentMeta(order);
  if (!meta) return '';
  if (meta.reason) return `Last driver declined: "${meta.reason}". Assign another driver.`;
  if (order.assignmentStatus === 'pending') {
    return 'Waiting for the assigned driver to accept or decline this delivery.';
  }
  if (order.assignmentStatus === 'accepted') {
    return 'Driver accepted this delivery. You can reassign if needed.';
  }
  return '';
}

export function parseOrderDate(order) {
  if (order.createdAt) return new Date(order.createdAt);
  if (order.date) {
    const parsed = new Date(order.date);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

export function isOrderInDateRange(order, dateFilter) {
  if (dateFilter === 'all') return true;
  const orderDate = parseOrderDate(order);
  if (!orderDate) return dateFilter === 'all';
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  if (dateFilter === 'today') return orderDate >= startOfToday;
  if (dateFilter === 'yesterday') return orderDate >= startOfYesterday && orderDate < startOfToday;
  if (dateFilter === 'week') return orderDate >= startOfWeek;
  return true;
}

export function formatLastLogin(value) {
  if (!value) return 'Never';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Never';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatActivityLabel(action) {
  const labels = {
    register: 'Registered account',
    login: 'Signed in',
    profile_update: 'Updated profile',
    password_change: 'Changed password',
    order_placed: 'Order placed',
    role_changed: 'Role updated',
    account_activated: 'Account activated',
    account_deactivated: 'Account deactivated',
    status_changed: 'Status updated',
    payment_updated: 'Payment updated',
    driver_assigned: 'Driver assigned',
    driver_reassigned: 'Driver reassigned',
    order_cancelled: 'Order cancelled',
    estimate_updated: 'Delivery estimate updated',
  };
  return labels[action] || action;
}

export function formatActivityIcon(action) {
  const icons = {
    register: 'fa-user-plus',
    login: 'fa-right-to-bracket',
    profile_update: 'fa-user-pen',
    password_change: 'fa-key',
    order_placed: 'fa-bag-shopping',
    role_changed: 'fa-user-gear',
    account_activated: 'fa-user-check',
    account_deactivated: 'fa-user-slash',
    status_changed: 'fa-truck-fast',
    payment_updated: 'fa-credit-card',
    driver_assigned: 'fa-motorcycle',
    driver_reassigned: 'fa-arrows-rotate',
    order_cancelled: 'fa-ban',
    estimate_updated: 'fa-clock',
  };
  return icons[action] || 'fa-circle-info';
}

export function getDeliveryStageBadge(step) {
  if (step >= 5) return { label: '5. Delivered', cls: 'bg-emerald-100 text-emerald-700 [.admin-dark_&]:bg-emerald-500/15 [.admin-dark_&]:text-emerald-300' };
  if (step === 4) return { label: '4. Out for Delivery', cls: 'bg-blue-100 text-blue-700 [.admin-dark_&]:bg-blue-500/15 [.admin-dark_&]:text-blue-300' };
  if (step === 3) return { label: '3. Preparing', cls: 'bg-cyan-100 text-cyan-700 [.admin-dark_&]:bg-cyan-500/15 [.admin-dark_&]:text-cyan-300' };
  if (step === 2) return { label: '2. Payment Verified', cls: 'bg-amber-100 text-amber-800 [.admin-dark_&]:bg-amber-500/15 [.admin-dark_&]:text-amber-300' };
  return { label: '1. Pending', cls: 'bg-slate-100 text-slate-600 [.admin-dark_&]:bg-white/10 [.admin-dark_&]:text-slate-300' };
}

export function isDriverSelectable(driver, selectedId) {
  if (!driver) return false;
  if (selectedId && driver.id === selectedId) return true;
  if (driver.driverStatus === 'offline') return false;
  return (driver.activeDeliveries || 0) < MAX_DRIVER_ACTIVE;
}

export function driverOptionLabel(driver) {
  const active = driver.activeDeliveries || 0;
  const status = driver.driverStatus || 'available';
  if (status === 'offline') return `${driver.name} (${driver.phone}) — Offline`;
  if (active >= MAX_DRIVER_ACTIVE) return `${driver.name} (${driver.phone}) — At capacity (${active}/${MAX_DRIVER_ACTIVE})`;
  if (status === 'busy' || active > 0) return `${driver.name} (${driver.phone}) — Busy (${active}/${MAX_DRIVER_ACTIVE})`;
  return `${driver.name} (${driver.phone}) — Available`;
}

export function getAvatarBgColor(name) {
  const colors = ['#073D35', '#0F6F64', '#D8A128', '#4B5563', '#7C3AED', '#DC2626'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function formatRelativeTime(iso) {
  if (!iso) return 'Just now';
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}
