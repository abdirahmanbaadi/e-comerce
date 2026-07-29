function stripPromotionPasswordFromStoreSettings(storeSettings = {}) {
  const data = { ...(storeSettings?.toObject?.() || storeSettings) };
  delete data.adminPromotionPasswordHash;
  return data;
}

module.exports = { stripPromotionPasswordFromStoreSettings };
