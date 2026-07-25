const CmsContent = require('../models/CmsContent');
const { getDefaultCms } = require('./cmsController');
const { FIXED_COUPON_DISCOUNT, discountLabel } = require('../utils/pricing');

const BUILTIN_COUPONS = {
  MMF10: { discount: FIXED_COUPON_DISCOUNT, label: discountLabel(FIXED_COUPON_DISCOUNT) },
};

async function resolveCoupon(code, subtotal, items) {
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) {
    return { ok: false, message: 'Enter a coupon code.' };
  }

  if (BUILTIN_COUPONS[normalized]) {
    const discount = Math.min(BUILTIN_COUPONS[normalized].discount, Number(subtotal) || BUILTIN_COUPONS[normalized].discount);
    return {
      ok: true,
      code: normalized,
      discount,
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
    return { ok: false, message: 'Koodhka qiimo dhimista (coupon) ma jiro.' };
  }

  if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
    return { ok: false, message: 'Waqtigii kuuboonkan waa dhammaaday (Expired).' };
  }

  let applicableSubtotal = Number(subtotal) || 0;

  if (promo.applicableCategory || promo.applicableProduct) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return {
        ok: false,
        message: 'Kuuboonkan wuxuu u shaqeeyaa alaabo gaar ah. Fadlan marka hore alaabta ku shub cart-ka.',
      };
    }

    const matchingItems = items.filter((item) => {
      const matchCat =
        !promo.applicableCategory ||
        String(item.category || '').toLowerCase() === String(promo.applicableCategory).toLowerCase();
      const matchProd =
        !promo.applicableProduct ||
        String(item.id || '').toLowerCase() === String(promo.applicableProduct).toLowerCase() ||
        String(item.title || '').toLowerCase().includes(String(promo.applicableProduct).toLowerCase());
      return matchCat && matchProd;
    });

    if (matchingItems.length === 0) {
      const catMsg = promo.applicableCategory ? `qaybta "${promo.applicableCategory}"` : '';
      const prodMsg = promo.applicableProduct ? `alaabta "${promo.applicableProduct}"` : '';
      const msg = [catMsg, prodMsg].filter(Boolean).join(' ama ');
      return {
        ok: false,
        message: `Kuuboonkan wuxuu u shaqeeyaa oo kaliya ${msg}.`,
      };
    }

    applicableSubtotal = matchingItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }

  let discount = Number(promo.discountAmount) || 0;
  const percent = Number(promo.discountPercent) || 0;
  if (percent > 0) {
    discount = Math.round(applicableSubtotal * (percent / 100) * 100) / 100;
  }

  if (discount <= 0) {
    return { ok: false, message: 'Kuuboonkan kuma habboona dalabkaaga hadda.' };
  }

  if (discount > Number(subtotal)) {
    discount = Number(subtotal);
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
    const { code, subtotal, items } = req.body;
    const result = await resolveCoupon(code, subtotal, items);

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
