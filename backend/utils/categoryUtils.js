/**
 * Store category slugs — must match Product.category and admin coupon dropdown values.
 */
const STORE_CATEGORIES = {
  chair: { slug: 'chair', label: 'Chair', aliases: ['chairs'] },
  bedroom: { slug: 'bedroom', label: 'Bedroom', aliases: ['bedrooms'] },
  'living-room': {
    slug: 'living-room',
    label: 'Living Room',
    aliases: ['livingroom', 'living room', 'living'],
  },
  'dining-room': {
    slug: 'dining-room',
    label: 'Dining Room',
    aliases: ['diningroom', 'dining room', 'dining'],
  },
  outdoor: { slug: 'outdoor', label: 'Outdoor', aliases: ['outdoors'] },
  office: { slug: 'office', label: 'Office', aliases: ['offices'] },
};

const SLUG_LOOKUP = new Map();

function registerCategoryKey(canonicalSlug, rawKey) {
  const key = normalizeCategoryKey(rawKey);
  if (!key) return;
  SLUG_LOOKUP.set(key, canonicalSlug);
}

for (const entry of Object.values(STORE_CATEGORIES)) {
  registerCategoryKey(entry.slug, entry.slug);
  registerCategoryKey(entry.slug, entry.label);
  for (const alias of entry.aliases) {
    registerCategoryKey(entry.slug, alias);
  }
}

function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveCategorySlug(value) {
  const key = normalizeCategoryKey(value);
  if (!key) return '';
  return SLUG_LOOKUP.get(key) || '';
}

function isKnownCategorySlug(slug) {
  return Boolean(slug && STORE_CATEGORIES[slug]);
}

function getCategoryDisplayName(value) {
  const slug = resolveCategorySlug(value) || normalizeCategoryKey(value);
  return STORE_CATEGORIES[slug]?.label || String(value || '').trim() || slug;
}

/**
 * Primary product category slug — uses DB `category` / `categorySlug` only.
 * Display strings like "Chair / Linen Fabric" are NOT split into materials.
 */
function getItemCategorySlug(item = {}) {
  if (!item || typeof item !== 'object') return '';

  const candidates = [
    item.categorySlug,
    item.category,
    item.label,
    String(item.category || '').split('/')[0]?.trim(),
  ];

  for (const candidate of candidates) {
    const slug = resolveCategorySlug(candidate);
    if (slug) return slug;
  }

  return '';
}

function itemMatchesCategory(item, couponCategory) {
  if (!couponCategory || !String(couponCategory).trim()) return true;

  const couponSlug = resolveCategorySlug(couponCategory);
  if (!couponSlug) return false;

  const itemSlug = getItemCategorySlug(item);
  if (!itemSlug) return false;

  return itemSlug === couponSlug;
}

function itemMatchesProductRestriction(item, applicableProduct) {
  if (!applicableProduct || !String(applicableProduct).trim()) return true;

  const needle = String(applicableProduct).trim().toLowerCase();
  const id = String(item.id ?? '').toLowerCase();
  const title = String(item.title || '').toLowerCase();

  return id === needle || title.includes(needle);
}

function itemEligibleForPromo(item, promo = {}) {
  const needsCategory = Boolean(String(promo.applicableCategory || '').trim());
  const needsProduct = Boolean(String(promo.applicableProduct || '').trim());

  if (!needsCategory && !needsProduct) return true;

  const categoryOk = !needsCategory || itemMatchesCategory(item, promo.applicableCategory);
  const productOk = !needsProduct || itemMatchesProductRestriction(item, promo.applicableProduct);

  return categoryOk && productOk;
}

/** @deprecated use getItemCategorySlug */
function collectItemCategorySlugs(item = {}) {
  const slug = getItemCategorySlug(item);
  return slug ? new Set([slug]) : new Set();
}

module.exports = {
  STORE_CATEGORIES,
  normalizeCategoryKey,
  resolveCategorySlug,
  isKnownCategorySlug,
  getCategoryDisplayName,
  getItemCategorySlug,
  itemMatchesCategory,
  itemMatchesProductRestriction,
  itemEligibleForPromo,
  collectItemCategorySlugs,
};
