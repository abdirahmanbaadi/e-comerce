import { apiUrl } from './data';

export async function validateCartItems(items) {
  const response = await fetch(apiUrl('/api/cart/validate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  });
  return response.json();
}

export async function validateCouponCode(code, subtotal) {
  const response = await fetch(apiUrl('/api/coupons/validate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, subtotal }),
  });
  return response.json();
}
