const crypto = require('crypto');

const MIN_PASSWORD_LENGTH = 8;
const MAX_OTP_ATTEMPTS = 5;

function hashOtp(code) {
  return crypto.createHash('sha256').update(String(code).trim()).digest('hex');
}

function validatePassword(password) {
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) {
    return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long!` };
  }
  return { ok: true };
}

function maskPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.length < 4) return '***';
  return `***${digits.slice(-4)}`;
}

function maskCustomerName(name) {
  const value = String(name || '').trim();
  if (!value) return 'Customer';
  const parts = value.split(/\s+/);
  if (parts.length === 1) return `${parts[0].charAt(0)}***`;
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}***`;
}

function maskAddress(address) {
  if (!address) return 'Mogadishu (details hidden)';
  const parts = address.split(',');
  const district = parts.find((p) => /district/i.test(p)) || parts[parts.length - 1];
  return `${district.trim()} (full address hidden until verified)`;
}

function allowSeedPasswordUpgrade() {
  return process.env.ALLOW_SEED_PASSWORD_UPGRADE === 'true';
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  MAX_OTP_ATTEMPTS,
  hashOtp,
  validatePassword,
  maskPhone,
  maskCustomerName,
  maskAddress,
  allowSeedPasswordUpgrade,
};
