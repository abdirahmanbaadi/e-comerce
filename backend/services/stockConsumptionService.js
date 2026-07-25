const Product = require('../models/Product');
const StockBatch = require('../models/StockBatch');
const {
  getCurrentBatch,
  getProductBatches,
  getBatchConsumption,
} = require('../services/stockBatchService');

async function getProductStockConsumption(productId, { batchId, limit = 50 } = {}) {
  const product = await Product.findOne({ id: Number(productId) }).select('id title stockVal').lean();
  if (!product) return null;

  const batch = batchId
    ? await StockBatch.findOne({ id: String(batchId), productId: Number(productId) }).lean()
    : await getCurrentBatch(productId);

  if (!batch) {
    return {
      productId: product.id,
      productTitle: product.title,
      batch: {
        hasBatch: false,
        unitsAdded: 0,
        unitsSold: 0,
        unitsRemaining: Number(product.stockVal) || 0,
      },
      entries: [],
      byCustomer: [],
      totals: {
        sold: 0,
        remaining: Number(product.stockVal) || 0,
        customers: 0,
        orders: 0,
      },
    };
  }

  const consumptionRows = await getBatchConsumption(batch.id, { limit });
  const entries = consumptionRows.map((row) => ({
    orderId: row.orderId,
    customer: row.customer,
    phone: row.phone,
    userId: row.userId,
    quantity: row.quantity,
    orderedAt: row.orderedAt,
    paymentStatus: 'Active order',
    otherItems: row.otherItems || [],
  }));

  const byCustomerMap = new Map();
  entries.forEach((entry) => {
    const key = entry.userId || `${entry.customer}|${entry.phone}`;
    const existing = byCustomerMap.get(key) || {
      customer: entry.customer,
      phone: entry.phone,
      totalQuantity: 0,
      orderCount: 0,
      orderIds: [],
    };
    existing.totalQuantity += entry.quantity;
    existing.orderCount += 1;
    if (!existing.orderIds.includes(entry.orderId)) {
      existing.orderIds.push(entry.orderId);
    }
    byCustomerMap.set(key, existing);
  });

  const byCustomer = [...byCustomerMap.values()].sort((a, b) => b.totalQuantity - a.totalQuantity);
  const unitsSold = Math.max(0, batch.unitsAdded - batch.unitsRemaining);

  return {
    productId: product.id,
    productTitle: product.title,
    batch: {
      hasBatch: true,
      batchId: batch.id,
      restockedAt: batch.createdAt,
      restockedBy: batch.addedBy?.name || null,
      unitsAdded: batch.unitsAdded,
      unitsSold,
      unitsRemaining: batch.unitsRemaining,
      stockBefore: batch.stockBefore,
      stockAfter: batch.stockAfter,
      source: batch.source,
    },
    entries,
    byCustomer,
    totals: {
      sold: unitsSold,
      remaining: batch.unitsRemaining,
      customers: byCustomer.length,
      orders: entries.length,
    },
  };
}

async function getProductStockInventory(productId) {
  const product = await Product.findOne({ id: Number(productId) }).select('id title stockVal').lean();
  if (!product) return null;

  const batches = await getProductBatches(productId, { limit: 30 });
  const currentBatch = batches.find((b) => b.unitsRemaining > 0) || batches[0] || null;
  const consumption = currentBatch
    ? await getProductStockConsumption(productId, { batchId: currentBatch.id })
    : await getProductStockConsumption(productId);

  return {
    productId: product.id,
    productTitle: product.title,
    currentStock: Number(product.stockVal) || 0,
    batches,
    currentBatch,
    consumption,
  };
}

module.exports = {
  getProductStockConsumption,
  getProductStockInventory,
};
