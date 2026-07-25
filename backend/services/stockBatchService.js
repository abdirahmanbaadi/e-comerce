const StockBatch = require('../models/StockBatch');
const StockConsumption = require('../models/StockConsumption');
const { getActorDisplayName } = require('./stockHistoryService');

function generateBatchId() {
  return `BATCH-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function generateConsumptionId() {
  return `SCON-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function normalizeQty(value) {
  const qty = Number.parseInt(value, 10);
  return Number.isFinite(qty) && qty > 0 ? qty : 1;
}

function mapOtherItems(items = [], currentItem = null) {
  return items
    .filter((item) => {
      if (!item || !currentItem) return Boolean(item);
      if (currentItem.id && item.id) return Number(item.id) !== Number(currentItem.id);
      return String(item.title || '').trim() !== String(currentItem.title || '').trim();
    })
    .map((item) => ({
      id: item.id,
      title: item.title || 'Unknown item',
      quantity: normalizeQty(item.quantity),
      category: item.category || '',
    }));
}

async function createStockBatch({
  product,
  unitsAdded,
  stockBefore,
  stockAfter,
  user,
  source = 'admin_manual',
}) {
  const added = Math.max(0, Number.parseInt(unitsAdded, 10) || 0);
  if (!product?.id || added <= 0) return null;

  try {
    return await StockBatch.create({
      id: generateBatchId(),
      productId: product.id,
      productTitle: product.title || '',
      unitsAdded: added,
      unitsRemaining: added,
      stockBefore: Math.max(0, Number(stockBefore) || 0),
      stockAfter: Math.max(0, Number(stockAfter) || 0),
      addedBy: {
        id: user?.id || '',
        name: getActorDisplayName(user),
        email: user?.email || '',
      },
      source,
    });
  } catch (error) {
    console.error('Stock batch create failed:', error.message);
    return null;
  }
}

async function consumeFromBatches(productId, quantity, orderContext = {}) {
  let remaining = Math.max(0, Number.parseInt(quantity, 10) || 0);
  if (!productId || remaining <= 0) return [];

  const batches = await StockBatch.find({
    productId: Number(productId),
    unitsRemaining: { $gt: 0 },
  }).sort({ createdAt: 1 });

  const created = [];

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.unitsRemaining, remaining);
    if (take <= 0) continue;

    batch.unitsRemaining -= take;
    await batch.save();

    const consumption = await StockConsumption.create({
      id: generateConsumptionId(),
      batchId: batch.id,
      productId: Number(productId),
      orderId: orderContext.orderId || '',
      customer: orderContext.customer || 'Unknown customer',
      phone: orderContext.phone || '',
      userId: orderContext.userId || '',
      quantity: take,
      otherItems: orderContext.otherItems || [],
      status: 'active',
    });

    created.push(consumption);
    remaining -= take;
  }

  if (remaining > 0) {
    console.warn(
      `[stock-batch] ${remaining} unit(s) for product ${productId} consumed without batch coverage (order ${orderContext.orderId || 'n/a'})`
    );
  }

  return created;
}

async function restoreConsumptionsForOrder(orderId) {
  if (!orderId) return 0;

  const consumptions = await StockConsumption.find({
    orderId: String(orderId),
    status: 'active',
  });

  let restored = 0;
  for (const consumption of consumptions) {
    const batch = await StockBatch.findOne({ id: consumption.batchId });
    if (batch) {
      batch.unitsRemaining += consumption.quantity;
      await batch.save();
    }
    consumption.status = 'reversed';
    await consumption.save();
    restored += consumption.quantity;
  }

  return restored;
}

async function reduceBatchesForAdjustment(productId, quantity) {
  let remaining = Math.max(0, Number.parseInt(quantity, 10) || 0);
  if (!productId || remaining <= 0) return 0;

  const batches = await StockBatch.find({
    productId: Number(productId),
    unitsRemaining: { $gt: 0 },
  }).sort({ createdAt: 1 });

  for (const batch of batches) {
    if (remaining <= 0) break;
    const take = Math.min(batch.unitsRemaining, remaining);
    batch.unitsRemaining -= take;
    await batch.save();
    remaining -= take;
  }

  return Math.max(0, Number.parseInt(quantity, 10) || 0) - remaining;
}

async function getLatestOpenBatch(productId) {
  return StockBatch.findOne({
    productId: Number(productId),
    unitsRemaining: { $gt: 0 },
  })
    .sort({ createdAt: 1 })
    .lean();
}

async function getCurrentBatch(productId) {
  const open = await getLatestOpenBatch(productId);
  if (open) return open;
  return StockBatch.findOne({ productId: Number(productId) }).sort({ createdAt: -1 }).lean();
}

async function getProductBatches(productId, { limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const batches = await StockBatch.find({ productId: Number(productId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return batches.map((batch) => ({
    id: batch.id,
    productId: batch.productId,
    productTitle: batch.productTitle,
    unitsAdded: batch.unitsAdded,
    unitsRemaining: batch.unitsRemaining,
    unitsSold: Math.max(0, batch.unitsAdded - batch.unitsRemaining),
    stockBefore: batch.stockBefore,
    stockAfter: batch.stockAfter,
    addedBy: batch.addedBy,
    source: batch.source,
    createdAt: batch.createdAt,
  }));
}

async function getBatchConsumption(batchId, { limit = 100 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
  const rows = await StockConsumption.find({
    batchId: String(batchId),
    status: 'active',
  })
    .sort({ createdAt: 1 })
    .limit(safeLimit)
    .lean();

  return rows.map((row) => ({
    id: row.id,
    batchId: row.batchId,
    productId: row.productId,
    orderId: row.orderId,
    customer: row.customer,
    phone: row.phone,
    userId: row.userId,
    quantity: row.quantity,
    otherItems: row.otherItems || [],
    orderedAt: row.createdAt,
  }));
}

module.exports = {
  createStockBatch,
  consumeFromBatches,
  restoreConsumptionsForOrder,
  reduceBatchesForAdjustment,
  getCurrentBatch,
  getProductBatches,
  getBatchConsumption,
  mapOtherItems,
};
