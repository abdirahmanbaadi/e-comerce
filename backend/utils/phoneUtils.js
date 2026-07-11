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
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

module.exports = { normalizePhone, findUserByPhone, maskEmail };
