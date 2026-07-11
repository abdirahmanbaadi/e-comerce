import { apiUrl } from './data';

export function parseOrderAmount(value) {
  if (typeof value === 'number') return value;
  return Number(String(value || '').replace(/[^0-9.]/g, '')) || 0;
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
  return { ok: response.ok, data };
}
