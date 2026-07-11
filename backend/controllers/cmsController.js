const CmsContent = require('../models/CmsContent');
const { logUserActivity } = require('../services/activityService');
const { onPromotionActivated } = require('../services/notificationService');
const { validateCmsUpdate } = require('../utils/cmsValidation');

function normalizeCmsAssetPath(path) {
  if (!path) return path;
  const clean = String(path).trim().replace(/^\/+/, '');
  if (!clean) return path;

  if (clean === 'hero1.jpeg') return '/product-images/hero1.jpeg';

  if (/^(bedroom|chair|dining-room|living-room|office|outdoor)\//.test(clean)) {
    return `/product-images/${clean.split('/').pop()}`;
  }

  if (clean.startsWith('product-images/')) return `/${clean}`;
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(clean) && !clean.includes('/')) {
    return `/product-images/${clean}`;
  }

  return path.startsWith('/') ? path : `/${clean}`;
}

function normalizeCmsPayload(cms) {
  const data = typeof cms.toObject === 'function' ? cms.toObject() : { ...cms };

  if (data.hero?.image) {
    data.hero = { ...data.hero, image: normalizeCmsAssetPath(data.hero.image) };
  }

  if (Array.isArray(data.banners)) {
    data.banners = data.banners.map((banner) => ({
      ...banner,
      image: banner.image ? normalizeCmsAssetPath(banner.image) : banner.image,
    }));
  }

  return data;
}

const DEFAULT_CMS = {
  id: 'main',
  hero: {
    smallTitle: 'Premium Furniture Collection',
    title: 'Elevate Your Home\nwith Modern Comfort',
    description:
      'Discover beautifully crafted furniture designed for stylish homes in Mogadishu — elegant designs, trusted quality, secure mobile money payment, and fast delivery.',
    ctaText: 'Explore Products',
    ctaLink: '/products',
    image: '/product-images/hero1.jpeg',
  },
  banners: [
    {
      id: 'banner-1',
      title: 'Summer Collection',
      subtitle: 'Up to 15% off selected living room sets',
      image: '/product-images/hero1.jpeg',
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
    { district: 'Hodan', fee: 0.01 },
    { district: 'Wadajir', fee: 0.01 },
    { district: 'Karaan', fee: 0.02 },
    { district: 'Hamarweyne', fee: 0.01 },
    { district: 'Dayniile', fee: 0.02 },
    { district: 'Yaqshid', fee: 0.01 },
  ],
};

function migrateLegacyDemoDeliveryFees(cms) {
  if (!cms?.deliveryFees?.length) return false;
  let changed = false;
  cms.deliveryFees.forEach((row) => {
    const fee = Number(row.fee);
    if (fee === 0.001) {
      row.fee = 0.01;
      changed = true;
    } else if (fee === 0.002) {
      row.fee = 0.02;
      changed = true;
    }
  });
  return changed;
}

async function getOrCreateCms() {
  let cms = await CmsContent.findOne({ id: 'main' });
  if (!cms) {
    cms = await CmsContent.create(DEFAULT_CMS);
    return cms;
  }
  if (migrateLegacyDemoDeliveryFees(cms)) {
    await cms.save();
  }
  return cms;
}

exports.getPublicContent = async (_req, res) => {
  try {
    const cms = await getOrCreateCms();
    const data = normalizeCmsPayload(cms);
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
      const previousPromos = cms.promotions || [];
      const previousByKey = new Map(
        previousPromos.map((promo) => [promo.id || promo.code, promo])
      );

      cms.promotions = promotions;
      changedSections.push('promotions');

      for (const promo of promotions) {
        if (!promo?.active) continue;
        const key = promo.id || promo.code;
        const previous = previousByKey.get(key);
        if (!previous || !previous.active) {
          await onPromotionActivated(promo);
        }
      }
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
