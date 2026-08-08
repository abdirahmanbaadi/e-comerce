const mongoose = require('mongoose');
const CmsContent = require('../models/CmsContent');
const { onCouponExpiring } = require('./notificationService');

const INTERVAL_MS = 60 * 60 * 1000; // hourly
const WINDOW_MS = 24 * 60 * 60 * 1000; // notify when expires within 24h
const notifiedCodes = new Set();

async function runCouponExpiringCheck() {
  if (mongoose.connection.readyState !== 1) return;

  const cms = await CmsContent.findOne({ id: 'main' }).lean();
  const promos = Array.isArray(cms?.promotions) ? cms.promotions : [];
  const now = Date.now();

  for (const promo of promos) {
    if (!promo?.active || !promo?.code || !promo?.expiresAt) continue;
    const expiresAt = new Date(promo.expiresAt).getTime();
    if (!Number.isFinite(expiresAt)) continue;
    if (expiresAt <= now) continue;
    if (expiresAt - now > WINDOW_MS) continue;

    const key = `${promo.id || promo.code}:${expiresAt}`;
    if (notifiedCodes.has(key)) continue;
    notifiedCodes.add(key);

    try {
      await onCouponExpiring(promo);
      console.log(`Coupon expiring notification sent for ${promo.code}`);
    } catch (err) {
      notifiedCodes.delete(key);
      console.error('Coupon expiring notification failed:', err.message);
    }
  }
}

function startCouponExpiringJob() {
  setTimeout(() => {
    runCouponExpiringCheck().catch((err) => console.error(err.message));
  }, 45 * 1000);
  setInterval(() => {
    runCouponExpiringCheck().catch((err) => console.error(err.message));
  }, INTERVAL_MS);
}

module.exports = {
  startCouponExpiringJob,
  runCouponExpiringCheck,
};
