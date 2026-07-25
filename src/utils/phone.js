/** Somalia phone helpers — +252, 061, 61… treated as the same number */

export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('252')) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return cleaned;
}

export function isValidSomaliMobile(phone) {
  const local = normalizePhoneNumber(phone);
  return /^[67]\d{8}$/.test(local);
}

export function formatPhoneE164(phone) {
  const local = normalizePhoneNumber(phone);
  if (!local) return '';
  return `+252${local}`;
}

export function parseSomaliPhoneInput(phone) {
  const raw = String(phone || '').trim();
  if (!raw) {
    return { ok: false, message: 'Please enter a phone number.' };
  }
  if (!isValidSomaliMobile(raw)) {
    return {
      ok: false,
      message: 'Enter a valid Somali mobile number (+252, 061, or 61…).',
    };
  }
  const local = normalizePhoneNumber(raw);
  return { ok: true, e164: `+252${local}`, local };
}

export function parsePhoneForStorage(phone, countryCode = '') {
  const raw = String(phone || '').trim();
  if (!raw) {
    return { ok: false, message: 'Please enter a phone number.' };
  }

  const combined =
    countryCode && !raw.startsWith('+') ? `${String(countryCode).trim()}${raw}` : raw;
  const digits = combined.replace(/\D/g, '');

  if (combined.startsWith('+') && digits.length > 0 && !digits.startsWith('252')) {
    if (digits.length < 10) {
      return { ok: false, message: 'Please enter a valid phone number.' };
    }
    return { ok: true, e164: `+${digits}`, local: digits };
  }

  return parseSomaliPhoneInput(combined);
}

export function phonesMatch(a, b) {
  const left = normalizePhoneNumber(a);
  const right = normalizePhoneNumber(b);
  return Boolean(left && right && left === right);
}

export const CHECKOUT_PHONE_PREFIX = '+25261';
export const CHECKOUT_PHONE_SUFFIX_KEY = 'checkoutPhoneSuffix';

export function readCheckoutPhoneSuffix() {
  const saved = localStorage.getItem(CHECKOUT_PHONE_SUFFIX_KEY);
  if (!saved) return '';
  let digits = saved.replace(/\D/g, '');
  if (digits.startsWith('25261')) digits = digits.slice(5);
  else if (digits.startsWith('61')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(0, 7);
}

export function buildCheckoutPhone(suffix) {
  const clean = String(suffix || '').replace(/\D/g, '');
  if (!clean) return '';
  return `${CHECKOUT_PHONE_PREFIX}${clean}`;
}
