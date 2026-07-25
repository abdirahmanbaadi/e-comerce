const mongoose = require('mongoose');

const stockBatchSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    productTitle: { type: String, default: '' },
    unitsAdded: { type: Number, required: true, min: 0 },
    unitsRemaining: { type: Number, required: true, min: 0 },
    stockBefore: { type: Number, required: true, min: 0 },
    stockAfter: { type: Number, required: true, min: 0 },
    addedBy: {
      id: { type: String, default: '' },
      name: { type: String, default: 'Unknown' },
      email: { type: String, default: '' },
    },
    source: {
      type: String,
      enum: ['admin_manual', 'migration', 'system'],
      default: 'admin_manual',
    },
  },
  { timestamps: true, versionKey: false }
);

stockBatchSchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('StockBatch', stockBatchSchema);
