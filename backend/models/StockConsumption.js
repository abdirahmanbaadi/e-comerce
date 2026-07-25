const mongoose = require('mongoose');

const stockConsumptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    batchId: { type: String, required: true, index: true },
    productId: { type: Number, required: true, index: true },
    orderId: { type: String, required: true, index: true },
    customer: { type: String, default: 'Unknown customer' },
    phone: { type: String, default: '' },
    userId: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    otherItems: {
      type: [
        {
          id: Number,
          title: String,
          quantity: Number,
          category: String,
        },
      ],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'reversed'],
      default: 'active',
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

stockConsumptionSchema.index({ productId: 1, batchId: 1, createdAt: -1 });
stockConsumptionSchema.index({ orderId: 1, productId: 1, status: 1 });

module.exports = mongoose.model('StockConsumption', stockConsumptionSchema);
