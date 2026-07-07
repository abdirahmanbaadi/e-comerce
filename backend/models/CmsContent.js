const mongoose = require('mongoose');

const cmsSchema = new mongoose.Schema(
  {
    id: { type: String, default: 'main', unique: true },
    hero: {
      smallTitle: { type: String, default: 'Premium Furniture Collection' },
      title: { type: String, default: 'Elevate Your Home\nwith Modern Comfort' },
      description: {
        type: String,
        default:
          'Discover beautifully crafted furniture designed for stylish homes in Mogadishu — elegant designs, trusted quality, secure mobile money payment, and fast delivery.',
      },
      ctaText: { type: String, default: 'Explore Products' },
      ctaLink: { type: String, default: '/products' },
      image: { type: String, default: '/product-images/hero1.jpeg' },
    },
    banners: [
      {
        id: String,
        title: String,
        subtitle: String,
        image: String,
        link: String,
        active: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
      },
    ],
    promotions: [
      {
        id: String,
        code: String,
        description: String,
        discountAmount: { type: Number, default: 0 },
        discountPercent: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
      },
    ],
    faqs: [
      {
        id: String,
        question: String,
        answer: String,
        order: { type: Number, default: 0 },
      },
    ],
    deliveryFees: [
      {
        district: String,
        fee: { type: Number, default: 0.001 },
      },
    ],
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('CmsContent', cmsSchema);
