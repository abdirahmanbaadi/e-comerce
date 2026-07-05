const CmsContent = require('../models/CmsContent');
const { getDefaultCms } = require('./cmsController');

const BUILTIN_COUPONS = {
  MMF10: { discount: 10, label: '$10 off your order' },
};

async function resolveCoupon(code, subtotal) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) {
    return { ok: false, message: 'Enter a coupon code.' };
  }

  if (BUILTIN_COUPONS[normalized]) {
    return {
      ok: true,
      code: normalized,
      discount: BUILTIN_COUPONS[normalized].discount,
      label: BUILTIN_COUPONS[normalized].label,
    };
  }

  let cms = await CmsContent.findOne();
  if (!cms) cms = getDefaultCms();

  const promo = (cms.promotions || []).find(
    (entry) =>
      entry.active &&
      String(entry.code || '')
        .trim()
        .toUpperCase() === normalized
  );

  if (!promo) {
    return { ok: false, message: 'Invalid coupon code.' };
  }

  let discount = Number(promo.discountAmount) || 0;
  const percent = Number(promo.discountPercent) || 0;
  if (percent > 0) {
    discount = Math.round((Number(subtotal) || 0) * (percent / 100) * 1000) / 1000;
  }

  if (discount <= 0) {
    return { ok: false, message: 'This coupon has no discount configured.' };
  }

  return {
    ok: true,
    code: normalized,
    discount,
    label: promo.title || promo.description || normalized,
  };
}

exports.validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    const result = await resolveCoupon(code, subtotal);

    if (!result.ok) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.status(200).json({
      success: true,
      code: result.code,
      discount: result.discount,
      label: result.label,
      message: `Coupon applied: ${result.label}`,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to validate coupon.' });
  }
};

module.exports.resolveCoupon = resolveCoupon;
