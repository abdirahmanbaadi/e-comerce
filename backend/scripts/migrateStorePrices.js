/**
 * One-time migration: set MongoDB product, delivery, and coupon prices to store values.
 * Run: node backend/scripts/migrateStorePrices.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../models/Product');
const CmsContent = require('../models/CmsContent');
const {
  priceForProductId,
  oldPriceForProductId,
  deliveryFeeForIndex,
  FIXED_COUPON_DISCOUNT,
  discountLabel,
} = require('../utils/pricing');

const DISTRICTS = ['Hodan', 'Wadajir', 'Karaan', 'Hamarweyne', 'Dayniile', 'Yaqshid'];

async function migrateProducts() {
  const products = await Product.find({}).sort({ id: 1 });
  let updated = 0;

  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const price = priceForProductId(product.id, index);
    const hadOldPrice = product.oldPrice != null && Number(product.oldPrice) > 0;
    const oldPrice = hadOldPrice ? oldPriceForProductId(product.id, index) : null;

    product.price = price;
    product.oldPrice = oldPrice;
    if (oldPrice && oldPrice > price) {
      product.discount = `${Math.round(((oldPrice - price) / oldPrice) * 100)}% off`;
    } else if (!oldPrice) {
      product.discount = product.discount || '';
    }

    await product.save();
    updated += 1;
    console.log(`  Product #${product.id} "${product.title}" → $${price}${oldPrice ? ` (was $${oldPrice})` : ''}`);
  }

  return updated;
}

async function migrateCms() {
  let cms = await CmsContent.findOne({ id: 'main' });
  if (!cms) {
    cms = await CmsContent.create({ id: 'main' });
  }

  cms.deliveryFees = DISTRICTS.map((district, index) => ({
    district,
    fee: deliveryFeeForIndex(index),
  }));

  cms.promotions = (cms.promotions || []).map((promo) => {
    const fixed = Number(promo.discountAmount) || 0;
    const percent = Number(promo.discountPercent) || 0;
    if (fixed >= 1 && percent <= 0) {
      return {
        ...promo.toObject?.() || promo,
        discountAmount: FIXED_COUPON_DISCOUNT,
        description: discountLabel(FIXED_COUPON_DISCOUNT),
      };
    }
    return promo.toObject?.() || promo;
  });

  if (!cms.promotions.length) {
    cms.promotions = [
      {
        id: 'promo-1',
        code: 'MMF10',
        description: discountLabel(FIXED_COUPON_DISCOUNT),
        discountAmount: FIXED_COUPON_DISCOUNT,
        discountPercent: 0,
        active: true,
      },
    ];
  }

  await cms.save();
  console.log('  CMS delivery fees + promotions updated');
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB\nProducts:');
  const count = await migrateProducts();
  console.log(`\nUpdated ${count} product(s).\nCMS:`);
  await migrateCms();
  console.log('\nDone — all prices are now store values in MongoDB.');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
