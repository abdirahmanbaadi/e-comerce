/** Demo/test prices for Waafi checkout — must match src/utils/data.js */
const DEMO_PRODUCT_PRICES = [0.001, 0.003, 0.001, 0.002, 0.003, 0.001, 0.002, 0.001, 0.003, 0.002];
const DEMO_PRODUCT_OLD_PRICES = [0.002, 0.004, 0.002, 0.003, 0.004, 0.002, 0.003, 0.002, 0.004, 0.003];

function slotIndex(productId, index = 0) {
  return typeof productId === 'number' ? productId - 1 : index;
}

function demoPriceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx = ((slot % DEMO_PRODUCT_PRICES.length) + DEMO_PRODUCT_PRICES.length) % DEMO_PRODUCT_PRICES.length;
  return DEMO_PRODUCT_PRICES[idx];
}

function demoOldPriceForProductId(productId, index = 0) {
  const slot = slotIndex(productId, index);
  const idx = ((slot % DEMO_PRODUCT_OLD_PRICES.length) + DEMO_PRODUCT_OLD_PRICES.length) % DEMO_PRODUCT_OLD_PRICES.length;
  return DEMO_PRODUCT_OLD_PRICES[idx];
}

function applyDemoPricesToProduct(product, index = 0) {
  if (!product) return product;
  const plain = product.toObject ? product.toObject() : { ...product };
  return {
    ...plain,
    price: demoPriceForProductId(plain.id, index),
    oldPrice: plain.oldPrice != null ? demoOldPriceForProductId(plain.id, index) : undefined,
  };
}

function applyDemoPricesToProducts(products = []) {
  return products.map((p, index) => applyDemoPricesToProduct(p, index));
}

function applyDemoPriceToCartItem(item, index = 0) {
  if (!item?.id) return item;
  return {
    ...item,
    price: demoPriceForProductId(Number(item.id), index),
  };
}

function applyDemoPricesToCartItems(items = []) {
  return items.map((item, index) => applyDemoPriceToCartItem(item, index));
}

module.exports = {
  demoPriceForProductId,
  demoOldPriceForProductId,
  applyDemoPricesToProduct,
  applyDemoPricesToProducts,
  applyDemoPriceToCartItem,
  applyDemoPricesToCartItems,
};
