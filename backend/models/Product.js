const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    materialType: {
      type: String,
      required: true,
      trim: true,
    },
    materialLabel: {
      type: String,
      required: true,
      trim: true,
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    oldPrice: {
      type: Number,
      default: null,
    },
    discount: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 0,
    },
    popularity: {
      type: Number,
      default: 0,
    },
    isNewest: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: String,
      default: 'in-stock',
    },
    stockVal: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: 'Active',
    },
    availability: {
      type: String,
      default: 'In Stock',
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    dimensions: {
      type: String,
      default: '',
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    images: {
      type: [String],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
    toObject: {
      transform: (_doc, ret) => {
        delete ret._id;
        return ret;
      },
    },
  }
);

productSchema.pre('save', async function assignProductId(next) {
  if (!this.isNew || this.id != null) {
    return next();
  }

  const latest = await this.constructor.findOne().sort({ id: -1 }).select('id').lean();
  this.id = latest?.id ? latest.id + 1 : 1;
  next();
});

module.exports = mongoose.model('Product', productSchema);
