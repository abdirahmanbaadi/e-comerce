const CmsContent = require('../models/CmsContent');
const { logUserActivity } = require('../services/activityService');
const { validateCmsUpdate } = require('../utils/cmsValidation');

const DEFAULT_CMS = {
  id: 'main',
  hero: {
    smallTitle: 'Premium Furniture Collection',
    title: 'Elevate Your Home\nwith Modern Comfort',
    description:
      'Discover beautifully crafted furniture designed for stylish homes in Mogadishu — elegant designs, trusted quality, secure mobile money payment, and fast delivery.',
    ctaText: 'Explore Products',
    ctaLink: '/products',
    image: '/hero1.jpeg',
  },
  banners: [
    {
      id: 'banner-1',
      title: 'Summer Collection',
      subtitle: 'Up to 15% off selected living room sets',
      image: '/hero1.jpeg',
      link: '/products',
      active: true,
      order: 1,
    },
  ],
  promotions: [
    {
      id: 'promo-1',
      code: 'MMF10',
      description: '$10 off your order',
      discountAmount: 10,
      discountPercent: 0,
      active: true,
    },
    {
      id: 'promo-2',
      code: 'WEEKEND15',
      description: '15% weekend discount',
      discountAmount: 0,
      discountPercent: 15,
      active: true,
    },
  ],
  faqs: [
    {
      id: 'faq-1',
      question: 'How do I pay with EVC Plus?',
      answer: 'Select EVC Plus at checkout and enter your registered mobile number. Payment is processed securely via Waafi.',
      order: 1,
    },
    {
      id: 'faq-2',
      question: 'Do you deliver across Mogadishu?',
      answer: 'Yes. We deliver to major districts in Mogadishu. Delivery fees vary by district and are shown at checkout.',
      order: 2,
    },
    {
      id: 'faq-3',
      question: 'Can I track my order?',
      answer: 'Yes. After placing an order you receive a tracking code. Use the Track Order page to follow delivery status.',
      order: 3,
    },
    {
      id: 'faq-4',
      question: 'What is Cash on Delivery?',
      answer: 'Pay when your furniture is delivered to your address. No upfront mobile payment is required.',
      order: 4,
    },
  ],
  deliveryFees: [
    { district: 'Hodan', fee: 0.001 },
    { district: 'Wadajir', fee: 0.001 },
    { district: 'Karaan', fee: 0.002 },
    { district: 'Hamarweyne', fee: 0.001 },
    { district: 'Dayniile', fee: 0.002 },
    { district: 'Yaqshid', fee: 0.001 },
  ],
};

async function getOrCreateCms() {
  let cms = await CmsContent.findOne({ id: 'main' });
  if (!cms) {
    cms = await CmsContent.create(DEFAULT_CMS);
  }
  return cms;
}

exports.getPublicContent = async (_req, res) => {
  try {
    const cms = await getOrCreateCms();
    const data = cms.toObject();
    delete data._id;
    return res.status(200).json({
      success: true,
      cms: {
        ...data,
        updatedAt: cms.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load site content.' });
  }
};

exports.updateContent = async (req, res) => {
  try {
    const validation = validateCmsUpdate(req.body);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0] || 'Invalid CMS content.',
      });
    }

    const cms = await getOrCreateCms();
    const { hero, banners, promotions, faqs, deliveryFees } = validation.data;
    const changedSections = [];

    if (hero) {
      cms.hero = { ...(cms.hero.toObject?.() || cms.hero), ...hero };
      changedSections.push('hero');
    }
    if (Array.isArray(banners)) {
      cms.banners = banners;
      changedSections.push('banners');
    }
    if (Array.isArray(promotions)) {
      cms.promotions = promotions;
      changedSections.push('promotions');
    }
    if (Array.isArray(faqs)) {
      cms.faqs = faqs;
      changedSections.push('faqs');
    }
    if (Array.isArray(deliveryFees)) {
      cms.deliveryFees = deliveryFees;
      changedSections.push('deliveryFees');
    }

    if (changedSections.length === 0) {
      return res.status(400).json({ success: false, message: 'No CMS fields to update.' });
    }

    await cms.save();

    if (req.user?.id) {
      await logUserActivity({
        userId: req.user.id,
        action: 'cms_updated',
        description: `Updated site content: ${changedSections.join(', ')}`,
        metadata: { sections: changedSections },
      });
    }

    const payload = cms.toObject();
    delete payload._id;

    return res.status(200).json({
      success: true,
      message: 'Site content updated.',
      cms: payload,
      updatedAt: cms.updatedAt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update site content.' });
  }
};

exports.getDefaultCms = () => DEFAULT_CMS;
