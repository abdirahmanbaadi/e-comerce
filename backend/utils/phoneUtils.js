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

  const users = await User.find();
  return users.find((u) => normalizePhone(u.phone) === normalized) || null;
}

function maskEmail(email) {
  if (!email || !email.includes('@')) return 'your registered email';
  const [local, domain] = email.split('@');
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local.slice(0, 2)}***`;
  return `${maskedLocal}@${domain}`;
}

module.exports = { normalizePhone, findUserByPhone, maskEmail };
