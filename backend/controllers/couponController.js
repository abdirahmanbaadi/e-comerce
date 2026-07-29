const CmsContent = require('../models/CmsContent');
const Product = require('../models/Product');
const { getDefaultCms } = require('./cmsController');
const { FIXED_COUPON_DISCOUNT, discountLabel } = require('../utils/pricing');
const {
  itemEligibleForPromo,
  getCategoryDisplayName,
} = require('../utils/categoryUtils');

const BUILTIN_COUPONS = {
  MMF10: { discount: FIXED_COUPON_DISCOUNT, label: discountLabel(FIXED_COUPON_DISCOUNT) },
};

async function enrichCartItems(items = []) {
  const enriched = [];
  for (const item of items) {
    if (!item?.id) {
      enriched.push(item);
      continue;
    }
    const product = await Product.findOne({ id: Number(item.id) }).lean();
    if (!product) {
      enriched.push(item);
      continue;
    }
    enriched.push({
      ...item,
      title: item.title || product.title,
      categorySlug: product.category || '',
      categoryLabel: product.label || '',
      label: product.label || '',
      materialType: product.materialType || '',
      materialLabel: product.materialLabel || '',
    });
  }
  return enriched;
}

function calculatePromoDiscount(promo, applicableSubtotal) {
  const fixed = Number(promo.discountAmount) || 0;
  const percent = Number(promo.discountPercent) || 0;
  let discount = 0;

  if (percent > 0 && applicableSubtotal > 0) {
    discount = Math.round(applicableSubtotal * (percent / 100) * 100) / 100;
  }
  if (fixed > 0) {
    discount = Math.max(discount, fixed);
  }

  // Demo catalog uses $0.01 items — percent-only coupons must still apply something.
  if (discount <= 0 && applicableSubtotal > 0 && (fixed > 0 || percent > 0)) {
    discount = Math.min(FIXED_COUPON_DISCOUNT, applicableSubtotal);
  }

  return discount;
}

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
  const cartItems = Array.isArray(items) && items.length > 0 ? await enrichCartItems(items) : [];

  if (promo.applicableCategory || promo.applicableProduct) {
    if (cartItems.length === 0) {
      return {
        ok: false,
        message: 'Kuuboonkan wuxuu u shaqeeyaa alaabo gaar ah. Fadlan marka hore alaabta ku shub cart-ka.',
      };
    }

    const matchingItems = cartItems.filter((item) => itemEligibleForPromo(item, promo));

    if (matchingItems.length === 0) {
      const catMsg = promo.applicableCategory
        ? `qaybta "${getCategoryDisplayName(promo.applicableCategory)}"`
        : '';
      const prodMsg = promo.applicableProduct ? `alaabta "${promo.applicableProduct}"` : '';
      const msg = [catMsg, prodMsg].filter(Boolean).join(' ama ');
      return {
        ok: false,
        message: `Kuuboonkan wuxuu u shaqeeyaa oo kaliya ${msg}. Ku dar alaab ka tirsan qaybtaas cart-kaaga.`,
      };
    }

    applicableSubtotal = matchingItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }

  let discount = calculatePromoDiscount(promo, applicableSubtotal);

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
