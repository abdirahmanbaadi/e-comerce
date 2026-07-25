const Cart = require('../models/Cart');
const Product = require('../models/Product');

function mergeCartItems(existing = [], incoming = []) {
  const map = new Map();

  for (const item of existing) {
    if (item?.id != null) map.set(item.id, { ...item });
  }

  for (const item of incoming) {
    if (item?.id == null) continue;
    const prev = map.get(item.id);
    if (prev) {
      map.set(item.id, {
        ...prev,
        ...item,
        quantity: Math.max(Number(prev.quantity) || 1, Number(item.quantity) || 1),
      });
    } else {
      map.set(item.id, { ...item, quantity: Math.max(1, Number(item.quantity) || 1) });
    }
  }

  return Array.from(map.values());
}

async function refreshCartPrices(items = []) {
  const refreshed = [];
  for (const item of items) {
    if (!item?.id) continue;
    const product = await Product.findOne({ id: Number(item.id) });
    if (!product) {
      refreshed.push(item);
      continue;
    }
    refreshed.push({
      ...item,
      title: product.title,
      price: Number(product.price) || 0,
      image: product.images?.[0] || item.image,
    });
  }
  return refreshed;
}

exports.validateCart = async (req, res) => {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) {
      return res.status(400).json({ success: false, valid: false, message: 'Cart is empty.' });
    }

    const validatedItems = [];
    const issues = [];

    for (const item of items) {
      if (!item?.id) continue;

      const product = await Product.findOne({ id: Number(item.id) });
      if (!product) {
        issues.push(`"${item.title || item.id}" is no longer available.`);
        continue;
      }

      if (product.status === 'Inactive') {
        issues.push(`"${product.title}" is no longer sold.`);
        continue;
      }

      const maxStock =
        typeof product.stockVal === 'number'
          ? product.stockVal
          : product.stock === 'in-stock'
            ? 99
            : 0;
      const quantity = Math.max(1, Number(item.quantity) || 1);

      if (maxStock <= 0 || product.stock === 'out-of-stock') {
        issues.push(`"${product.title}" is out of stock.`);
      } else if (quantity > maxStock) {
        issues.push(`"${product.title}" — only ${maxStock} left in stock.`);
      }

      const currentPrice = Number(product.price) || 0;
      const priceChanged = Math.abs(Number(item.price) - currentPrice) > 0.0000001;
      const safeQty = maxStock > 0 ? Math.min(quantity, maxStock) : 0;

      validatedItems.push({
        id: product.id,
        title: product.title,
        category:
          item.category || `${product.label} / ${product.materialLabel || product.materialType}`,
        categorySlug: product.category || item.categorySlug || '',
        price: currentPrice,
        quantity: safeQty || quantity,
        image: product.images?.[0] || item.image,
        maxStock,
        stockOk: maxStock > 0 && quantity <= maxStock,
        priceChanged,
        stock: product.stock,
      });
    }

    const valid = issues.length === 0 && validatedItems.length === items.length;

    return res.status(200).json({
      success: true,
      valid,
      message: valid ? 'Cart is ready for checkout.' : issues[0] || 'Some cart items need attention.',
      issues,
      items: validatedItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, valid: false, message: 'Failed to validate cart.' });
  }
};

exports.getCart = async (req, res) => {
  try {
    const doc = await Cart.findOne({ userId: req.user.id });
    const cartItems = await refreshCartPrices(doc?.cartItems || []);
    const savedItems = await refreshCartPrices(doc?.savedItems || []);
    return res.status(200).json({
      success: true,
      cartItems,
      savedItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load cart.' });
  }
};

exports.syncCart = async (req, res) => {
  try {
    const incomingCart = Array.isArray(req.body.cartItems) ? req.body.cartItems : [];
    const incomingSaved = Array.isArray(req.body.savedItems) ? req.body.savedItems : [];

    let doc = await Cart.findOne({ userId: req.user.id });
    if (!doc) {
      doc = await Cart.create({
        userId: req.user.id,
        cartItems: await refreshCartPrices(incomingCart),
        savedItems: await refreshCartPrices(incomingSaved),
      });
    } else {
      doc.cartItems = await refreshCartPrices(mergeCartItems(doc.cartItems, incomingCart));
      doc.savedItems = await refreshCartPrices(mergeCartItems(doc.savedItems, incomingSaved));
      await doc.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Cart synced.',
      cartItems: doc.cartItems,
      savedItems: doc.savedItems,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to sync cart.' });
  }
};
