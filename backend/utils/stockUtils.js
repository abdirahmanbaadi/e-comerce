const Product = require('../models/Product');
const { consumeFromBatches, restoreConsumptionsForOrder, mapOtherItems } = require('../services/stockBatchService');

async function decrementStockForItems(items = [], orderContext = {}) {
  for (const item of items) {
    if (!item) continue;
    const product =
      (item.id && (await Product.findOne({ id: item.id }))) ||
      (item.title && (await Product.findOne({ title: item.title })));
    if (!product || typeof product.stockVal !== 'number') continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    product.stockVal = Math.max(0, product.stockVal - qty);
    if (product.stockVal === 0) {
      product.stock = 'out-of-stock';
      product.availability = 'Out of Stock';
    }
    await product.save();

    if (orderContext.orderId) {
      await consumeFromBatches(product.id, qty, {
        orderId: orderContext.orderId,
        customer: orderContext.customer || '',
        phone: orderContext.phone || '',
        userId: orderContext.userId || '',
        otherItems: mapOtherItems(items, item),
      });
    }
  }
}

async function restoreStockForItems(items = [], orderContext = {}) {
  if (orderContext.orderId) {
    await restoreConsumptionsForOrder(orderContext.orderId);
  }

  for (const item of items) {
    if (!item) continue;
    const product =
      (item.id && (await Product.findOne({ id: item.id }))) ||
      (item.title && (await Product.findOne({ title: item.title })));
    if (!product || typeof product.stockVal !== 'number') continue;

    const qty = Math.max(1, Number(item.quantity) || 1);
    product.stockVal += qty;
    if (product.stockVal > 0) {
      product.stock = 'in-stock';
      product.availability = 'In Stock';
    }
    await product.save();
  }
}

module.exports = { decrementStockForItems, restoreStockForItems };
