function normalizePhone(phone) {
  if (!phone) return '';
  let digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('252')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return digits;
}

async function findUserByPhone(User, phone) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return null;

  let user = await User.findOne({ phone: trimmed });
  if (user) return user;

  const normalized = normalizePhone(trimmed);
  if (!normalized) return null;

  const candidates = await User.find({
    phone: { $exists: true, $ne: '' },
  })
    .select('id phone email firstName lastName role password avatar address notificationPreferences driverApplication passwordChangedAt lastLoginAt')
    .limit(5000);

  return candidates.find((u) => normalizePhone(u.phone) === normalized) || null;
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
  findUserByPhone,
  findUserByLoginIdentifier,
  maskEmail,
  isPhoneLike,
};
