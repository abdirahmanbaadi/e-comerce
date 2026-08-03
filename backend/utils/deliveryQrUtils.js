const crypto = require('crypto');

const QR_PREFIX = 'MMF1';
const TOKEN_BYTES = 16;

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

function buildPayload(orderId, token) {
  return `${QR_PREFIX}.${encodeURIComponent(String(orderId))}.${token}`;
}

function generatePin() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function parsePayload(raw) {
  const text = String(raw || '').trim();
  if (!text) return { ok: false, message: 'Empty QR code.' };

  const match = text.match(/MMF1\.[^.\s]+\.[A-Za-z0-9_-]+/);
  const payload = match ? match[0] : text;
  const parts = payload.split('.');
  if (parts.length !== 3 || parts[0] !== QR_PREFIX) {
    return { ok: false, message: 'Invalid delivery QR code.' };
  }

  let orderId = parts[1];
  try {
    orderId = decodeURIComponent(orderId);
  } catch {
    /* keep raw */
  }
  const token = parts[2];
  if (!orderId || !token) {
    return { ok: false, message: 'Invalid delivery QR code.' };
  }
  return { ok: true, orderId, token, payload };
}

/** Issue QR + 6-digit backup. Valid until order is delivered (no time expiry). */
function issueDeliveryQr(order) {
  const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
  const payload = buildPayload(order.id, token);
  const pin = generatePin();
  order.deliveryConfirmTokenHash = hashToken(token);
  order.deliveryConfirmPayload = payload;
  order.deliveryConfirmPin = pin;
  order.deliveryConfirmPinHash = hashToken(pin);
  order.deliveryConfirmStatus = 'pending';
  order.deliveryConfirmExpiresAt = null;
  order.deliveryConfirmedAt = null;
  return { payload, pin, expiresAt: null };
}

function clearDeliveryQr(order) {
  order.deliveryConfirmTokenHash = '';
  order.deliveryConfirmPayload = '';
  order.deliveryConfirmPin = '';
  order.deliveryConfirmPinHash = '';
  order.deliveryConfirmStatus = 'none';
  order.deliveryConfirmExpiresAt = null;
}

function isDeliveryQrPending(order) {
  return (
    order?.deliveryConfirmStatus === 'pending' &&
    Boolean(order.deliveryConfirmTokenHash) &&
    Boolean(order.deliveryConfirmPayload)
  );
}

/** Kept for compatibility — codes no longer expire by time. */
function isDeliveryQrExpired() {
  return false;
}

function assertPendingForVerify(order) {
  if (!order) return { ok: false, message: 'Order not found.' };
  if (Number(order.currentStep) >= 5 || order.status === 'delivered') {
    return { ok: false, message: 'This order is already delivered.' };
  }
  if (!isDeliveryQrPending(order)) {
    return {
      ok: false,
      message: 'No delivery code is active. It appears when the order is out for delivery.',
    };
  }
  return { ok: true };
}

function verifyDeliveryQr(order, rawPayload) {
  const gate = assertPendingForVerify(order);
  if (!gate.ok) return gate;

  const parsed = parsePayload(rawPayload);
  if (!parsed.ok) return parsed;

  if (parsed.orderId !== order.id) {
    return { ok: false, message: 'This QR belongs to a different order.' };
  }

  const incomingHash = hashToken(parsed.token);
  if (incomingHash !== order.deliveryConfirmTokenHash) {
    return { ok: false, message: 'QR code does not match. Ask the customer to show the latest code.' };
  }

  return { ok: true, method: 'qr' };
}

function verifyDeliveryPin(order, rawPin) {
  const gate = assertPendingForVerify(order);
  if (!gate.ok) return gate;

  const pin = String(rawPin || '').replace(/\D/g, '');
  if (pin.length !== 6) {
    return { ok: false, message: 'Enter the 6-digit delivery code.' };
  }

  const pinOk =
    (order.deliveryConfirmPinHash && hashToken(pin) === order.deliveryConfirmPinHash) ||
    (order.deliveryConfirmPin && pin === String(order.deliveryConfirmPin));

  if (!pinOk) {
    return { ok: false, message: 'Code does not match. Ask the customer for the current 6-digit code.' };
  }

  return { ok: true, method: 'pin' };
}

function publicDeliveryQrState(order) {
  const pending = isDeliveryQrPending(order);
  return {
    deliveryConfirmStatus: order.deliveryConfirmStatus || 'none',
    deliveryQrPending: pending,
    deliveryConfirmExpiresAt: null,
  };
}

module.exports = {
  QR_PREFIX,
  issueDeliveryQr,
  clearDeliveryQr,
  isDeliveryQrPending,
  isDeliveryQrExpired,
  verifyDeliveryQr,
  verifyDeliveryPin,
  parsePayload,
  publicDeliveryQrState,
  buildPayload,
};
