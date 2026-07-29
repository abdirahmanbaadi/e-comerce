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
        applicableCategory: { type: String, default: '' },
        applicableProduct: { type: String, default: '' },
        durationDays: { type: Number, default: 0 },
        expiresAt: { type: Date, default: null },
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
        fee: { type: Number, default: 0.01 },
      },
    ],
    storeSettings: {
      isOpen: { type: Boolean, default: true },
      maintenanceMessage: {
        type: String,
        default: 'We are temporarily closed for maintenance. Please check back soon.',
      },
      lowStockThreshold: { type: Number, default: 5 },
      supportPhone: { type: String, default: '+252 61 000 0000' },
      supportEmail: { type: String, default: 'support@mogadishumodernfurniture.com' },
      storeDisplayName: { type: String, default: 'Mogadishu Modern Furniture' },
      minOrderAmount: { type: Number, default: 0 },
      adminPromotionPasswordHash: { type: String, default: '' },
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('CmsContent', cmsSchema);
