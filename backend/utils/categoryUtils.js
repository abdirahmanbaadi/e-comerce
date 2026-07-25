const CATEGORY_SLUG_ALIASES = {
  chair: 'chair',
  chairs: 'chair',
};

function normalizeCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveCategorySlug(value) {
  const normalized = normalizeCategoryKey(value);
  return CATEGORY_SLUG_ALIASES[normalized] || normalized;
}

function collectItemCategorySlugs(item = {}) {
  const slugs = new Set();
  const add = (value) => {
    const slug = resolveCategorySlug(value);
    if (slug) slugs.add(slug);
  };

  if (item.categorySlug) add(item.categorySlug);

  if (item.category) {
    String(item.category)
      .split('/')
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach(add);
  }

  if (item.label) add(item.label);

  return slugs;
}

function itemMatchesCategory(item, applicableCategory) {
  if (!applicableCategory) return true;
  const target = resolveCategorySlug(applicableCategory);
  if (!target) return true;
  return collectItemCategorySlugs(item).has(target);
}

module.exports = {
  normalizeCategoryKey,
  resolveCategorySlug,
  collectItemCategorySlugs,
  itemMatchesCategory,
};
