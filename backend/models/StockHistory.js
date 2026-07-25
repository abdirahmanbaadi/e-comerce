const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: Number, required: true, index: true },
    productTitle: { type: String, default: '' },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    delta: { type: Number, required: true },
    changedBy: {
      id: { type: String, default: '' },
      name: { type: String, default: 'Unknown' },
      email: { type: String, default: '' },
    },
    source: {
      type: String,
      enum: ['admin_manual', 'order', 'system'],
      default: 'admin_manual',
    },
  },
  { timestamps: true, versionKey: false }
);

stockHistorySchema.index({ productId: 1, createdAt: -1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
