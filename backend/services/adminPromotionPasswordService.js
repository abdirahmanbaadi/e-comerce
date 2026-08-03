const bcrypt = require('bcryptjs');
const CmsContent = require('../models/CmsContent');

async function getCmsDocument() {
  let cms = await CmsContent.findOne({ id: 'main' });
  if (!cms) {
    cms = await CmsContent.create({ id: 'main' });
  }
  return cms;
}

function getHashFromCms(cms) {
  const settings = cms?.storeSettings;
  const raw = settings?.toObject?.() || settings || {};
  return String(raw.adminPromotionPasswordHash || '').trim();
}

async function isAdminPromotionPasswordConfigured() {
  const cms = await getCmsDocument();
  return Boolean(getHashFromCms(cms));
}

async function verifyAdminPromotionPassword(password) {
  const cms = await getCmsDocument();
  const hash = getHashFromCms(cms);
  if (!hash) {
    return { ok: false, code: 'NOT_CONFIGURED', message: 'Role-change password is not set. Configure it in Settings first.' };
  }
  const plain = String(password || '');
  if (!plain) {
    return { ok: false, code: 'MISSING', message: 'Enter the role-change password.' };
  }
  const match = await bcrypt.compare(plain, hash);
  if (!match) {
    return { ok: false, code: 'INVALID', message: 'Incorrect role-change password.' };
  }
  return { ok: true };
}

async function setAdminPromotionPassword(newPassword) {
  const plain = String(newPassword || '').trim();
  if (plain.length < 6) {
    return { ok: false, message: 'Password must be at least 6 characters.' };
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plain, salt);
  const cms = await getCmsDocument();

  cms.storeSettings = {
    ...(cms.storeSettings?.toObject?.() || cms.storeSettings || {}),
    adminPromotionPasswordHash: hash,
  };
  await cms.save();

  return { ok: true };
}

module.exports = {
  isAdminPromotionPasswordConfigured,
  verifyAdminPromotionPassword,
  setAdminPromotionPassword,
};
