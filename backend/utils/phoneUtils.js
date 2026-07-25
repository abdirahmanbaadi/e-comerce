/** Somalia mobile: +252, 252, 061, 61… → canonical +252XXXXXXXXX, compare via 9-digit local */

function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('252')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

function isValidSomaliMobile(phone) {
  const local = normalizePhone(phone);
  return /^[67]\d{8}$/.test(local);
}

/** Canonical storage / API format for Somali numbers */
function formatPhoneE164(phone) {
  const local = normalizePhone(phone);
  if (!local) return '';
  return `+252${local}`;
}

/**
 * Accept +252…, 252…, 061…, 61…, or suffix after +25261 at checkout.
 * Returns { ok, e164, local, message? }
 */
function parseSomaliPhoneInput(phone) {
  const raw = String(phone || '').trim();
  if (!raw) {
    return { ok: false, message: 'Please enter a phone number.' };
  }

  const local = normalizePhone(raw);
  if (!isValidSomaliMobile(raw)) {
    return {
      ok: false,
      message: 'Enter a valid Somali mobile number (+252, 061, or 61…).',
    };
  }

  return {
    ok: true,
    e164: `+252${local}`,
    local,
  };
}

/**
 * Register / profile — Somalia uses E164; other country codes stored as +digits.
 */
function parsePhoneForStorage(phone, countryCode = '') {
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

/** All common stored formats for the same Somali mobile number */
function buildPhoneLookupVariants(phone) {
  const raw = String(phone || '').trim();
  const normalized = normalizePhone(raw);
  const variants = new Set();

  if (raw) variants.add(raw);

  if (!normalized) return [...variants];

  variants.add(normalized);
  variants.add(`0${normalized}`);
  variants.add(`252${normalized}`);
  variants.add(`+252${normalized}`);

  return [...variants];
}

function phonesMatch(a, b) {
  const left = normalizePhone(a);
  const right = normalizePhone(b);
  return Boolean(left && right && left === right);
}

function buildUserOrdersQuery(user) {
  const or = [];
  const userId = user?.id;
  if (userId) or.push({ userId });

  const phoneVariants = buildPhoneLookupVariants(user?.phone);
  if (phoneVariants.length) {
    or.push({ phone: { $in: phoneVariants } });
  }

  if (!or.length) return { userId: '__none__' };
  return { $or: or };
}

async function findUserByPhone(User, phone, { select } = {}) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return null;

  const variants = buildPhoneLookupVariants(trimmed);
  if (variants.length) {
    const variantQuery = User.findOne({ phone: { $in: variants } });
    const user = select ? await variantQuery.select(select) : await variantQuery;
    if (user) return user;
  }

  const normalized = normalizePhone(trimmed);
  if (!normalized) return null;

  const candidateSelect =
    select ||
    'id phone email firstName lastName role password avatar address notificationPreferences driverApplication passwordChangedAt lastLoginAt resetOtp resetOtpExpires resetOtpAttempts';

  const candidates = await User.find({
    phone: { $exists: true, $ne: '' },
  })
    .select(candidateSelect)
    .limit(5000);

  return candidates.find((u) => normalizePhone(u.phone) === normalized) || null;
}

async function phoneTakenByOtherUser(User, phone, excludeUserId = null) {
  const existing = await findUserByPhone(User, phone);
  if (!existing) return false;
  if (excludeUserId && existing.id === excludeUserId) return false;
  return true;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'your registered email';
  const [local, domain] = email.split('@');
  if (!local) return `***@${domain}`;
  if (local.length === 1) return `*@${domain}`;
  if (local.length === 2) return `${local[0]}*@${domain}`;
  const first = local[0];
  const last = local[local.length - 1];
  const stars = '*'.repeat(Math.max(local.length - 2, 3));
  return `${first}${stars}${last}@${domain}`;
}

function isPhoneLike(value) {
  const raw = String(value || '').trim();
  if (!raw) return false;
  const digits = raw.replace(/\D/g, '');
  const compact = raw.replace(/\s/g, '');
  return digits.length >= 7 && digits.length / Math.max(compact.length, 1) >= 0.55;
}

async function findUserByLoginIdentifier(User, identifier) {
  const trimmed = String(identifier || '').trim();
  if (!trimmed) return null;

  if (trimmed.includes('@')) {
    return User.findOne({ email: trimmed.toLowerCase() });
  }

  if (isPhoneLike(trimmed)) {
    return findUserByPhone(User, trimmed);
  }

  return User.findOne({ username: trimmed.toLowerCase() });
}

module.exports = {
  normalizePhone,
  isValidSomaliMobile,
  formatPhoneE164,
  parseSomaliPhoneInput,
  parsePhoneForStorage,
  buildPhoneLookupVariants,
  phonesMatch,
  buildUserOrdersQuery,
  findUserByPhone,
  phoneTakenByOtherUser,
  findUserByLoginIdentifier,
  maskEmail,
  isPhoneLike,
};
