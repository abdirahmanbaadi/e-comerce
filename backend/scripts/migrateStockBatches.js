/**
 * One-time migration: reset all product stock to 0, then seed 12-unit batches
 * attributed to the primary admin account.
 *
 * Run: node scripts/migrateStockBatches.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const connectDB = require('../config/database');
const User = require('../models/User');
const Product = require('../models/Product');
const StockHistory = require('../models/StockHistory');
const StockBatch = require('../models/StockBatch');
const StockConsumption = require('../models/StockConsumption');
const { createStockBatch } = require('../services/stockBatchService');
const { recordStockChange } = require('../services/stockHistoryService');

const INITIAL_UNITS = 12;

async function migrateStockBatches() {
  await connectDB();

  const admin =
    (await User.findOne({ email: 'admin@gmail.com' }).lean()) ||
    (await User.findOne({ role: 'admin' }).lean());

  if (!admin) {
    console.error('No admin user found. Seed users first.');
    process.exit(1);
  }

  console.log(`Using admin: ${admin.firstName} ${admin.lastName || ''} (${admin.email})`);

  await StockConsumption.deleteMany({});
  await StockBatch.deleteMany({});
  await StockHistory.deleteMany({});

  const products = await Product.find().sort({ id: 1 });
  console.log(`Migrating ${products.length} products…`);

  for (const product of products) {
    const stockBefore = 0;
    const stockAfter = INITIAL_UNITS;

    product.stockVal = 0;
    product.stock = 'out-of-stock';
    product.availability = 'Out of Stock';
    await product.save();

    product.stockVal = stockAfter;
    product.stock = 'in-stock';
    product.availability = 'In Stock';
    await product.save();

    await recordStockChange({
      product,
      previousStock: stockBefore,
      newStock: stockAfter,
      user: admin,
      source: 'admin_manual',
    });

    await createStockBatch({
      product,
      unitsAdded: INITIAL_UNITS,
      stockBefore,
      stockAfter,
      user: admin,
      source: 'migration',
    });

    console.log(`  ✓ ${product.title} → ${INITIAL_UNITS} units`);
  }

  console.log('\nStock batch migration complete.');
  await mongoose.disconnect();
}

migrateStockBatches().catch((err) => {
  console.error(err);
  process.exit(1);
});
