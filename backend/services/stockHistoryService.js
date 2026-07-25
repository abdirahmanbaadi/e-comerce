const StockHistory = require('../models/StockHistory');

function generateStockHistoryId() {
  return `SH-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function getActorDisplayName(user) {
  if (!user) return 'Unknown';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || 'Admin';
}

function normalizeStockValue(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function recordStockChange({
  product,
  previousStock,
  newStock,
  user,
  source = 'admin_manual',
}) {
  const previous = normalizeStockValue(previousStock);
  const next = normalizeStockValue(newStock);
  const delta = next - previous;

  if (!product?.id || delta === 0) return null;

  try {
    return await StockHistory.create({
      id: generateStockHistoryId(),
      productId: product.id,
      productTitle: product.title || '',
      previousStock: previous,
      newStock: next,
      delta,
      changedBy: {
        id: user?.id || '',
        name: getActorDisplayName(user),
        email: user?.email || '',
      },
      source,
    });
  } catch (error) {
    console.error('Stock history log failed:', error.message);
    return null;
  }
}

async function getProductStockHistory(productId, { limit = 30 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);
  const rows = await StockHistory.find({ productId: Number(productId) })
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return rows.map((row) => ({
    id: row.id,
    productId: row.productId,
    productTitle: row.productTitle,
    previousStock: row.previousStock,
    newStock: row.newStock,
    delta: row.delta,
    changedBy: row.changedBy,
    source: row.source,
    createdAt: row.createdAt,
  }));
}

module.exports = {
  recordStockChange,
  getProductStockHistory,
  getActorDisplayName,
};
