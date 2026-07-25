import { apiUrl } from './data';

export function parseOrderAmount(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
}

/** Tell open admin tabs to refresh orders, payments, and dashboard stats. */
export function notifyAdminPaymentDataRefresh() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('admin-payments-invalidate'));
  window.dispatchEvent(new CustomEvent('admin-dashboard-invalidate'));
  window.dispatchEvent(new CustomEvent('admin-orders-invalidate'));
}

export async function submitWaafiPayment({
  orderId,
  accountNo,
  amount,
  paymentReference = '',
  description = '',
}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(apiUrl('/api/payments/waafi'), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      orderId,
      accountNo: accountNo.trim(),
      amount: parseOrderAmount(amount),
      paymentReference,
      description: description || `Payment for ${orderId}`,
    }),
  });

  const data = await response.json();
  if (response.ok && data.success) {
    notifyAdminPaymentDataRefresh();
  }
  return { ok: response.ok, data };
}
