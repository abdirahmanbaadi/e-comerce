import { getMaterialLabel } from './productFilters';

/** Shared fallback so web modal and mobile product page never diverge. */
export const DEFAULT_PRODUCT_DESCRIPTION =
  'Crafted with premium materials and modern detail, designed to bring comfort, beauty, and long-lasting quality to your home.';

export function getProductDescription(product) {
  const text = String(product?.description || '').trim();
  return text || DEFAULT_PRODUCT_DESCRIPTION;
}

export function getProductMaterial(product) {
  return (
    String(product?.material || '').trim() ||
    String(product?.materialLabel || '').trim() ||
    getMaterialLabel(product?.materialType) ||
    '—'
  );
}

export function getProductColor(product) {
  return String(product?.color || '').trim() || '—';
}

export function isProductInStock(product) {
  return product?.stock !== 'out-of-stock' && product?.status !== 'Inactive';
}

export function getProductAvailability(product) {
  const custom = String(product?.availability || '').trim();
  if (custom) return custom;
  return isProductInStock(product) ? 'In Stock' : 'Out of Stock';
}
