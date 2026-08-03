const CmsContent = require('../models/CmsContent');
const { logUserActivity } = require('../services/activityService');
const { onPromotionActivated, onBannerActivated } = require('../services/notificationService');
const { validateCmsUpdate } = require('../utils/cmsValidation');
const { FIXED_COUPON_DISCOUNT, discountLabel } = require('../utils/pricing');
const { stripPromotionPasswordFromStoreSettings } = require('../utils/cmsSecurityUtils');
const {
  buildDefaultDeliveryFees,
  mergeBanadirDeliveryFees,
} = require('../utils/banadirDelivery');

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

  if (data.storeSettings) {
    data.storeSettings = stripPromotionPasswordFromStoreSettings(data.storeSettings);
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
      description: discountLabel(FIXED_COUPON_DISCOUNT),
      discountAmount: FIXED_COUPON_DISCOUNT,
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
      question: 'How do I pay with EVC Plus?',
      answer:
        'At checkout, enter your Somali mobile number. After you place the order, approve the EVC Plus prompt on your phone and enter your PIN. Payment is confirmed instantly via Waafi.',
      order: 4,
    },
  ],
  deliveryFees: buildDefaultDeliveryFees().map(({ district, fee }) => ({ district, fee })),
  storeSettings: {
    isOpen: true,
    maintenanceMessage: 'We are temporarily closed for maintenance. Please check back soon.',
    lowStockThreshold: 5,
    supportPhone: '+252 61 000 0000',
    supportEmail: 'support@mogadishumodernfurniture.com',
    storeDisplayName: 'Mogadishu Modern Furniture',
    minOrderAmount: 0,
  },
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

function expandBanadirDeliveryFees(cms) {
  const existing = cms.deliveryFees || [];
  // Incomplete list → seed all 20 Banadir districts with Hodan-distance fees
  if (existing.length < 15) {
    cms.deliveryFees = buildDefaultDeliveryFees().map(({ district, fee }) => ({ district, fee }));
    return true;
  }
  const merged = mergeBanadirDeliveryFees(existing);
  if (merged.length === existing.length) {
    const same = merged.every(
      (row, i) =>
        row.district === existing[i]?.district && Number(row.fee) === Number(existing[i]?.fee)
    );
    if (same) return false;
  }
  cms.deliveryFees = merged.map(({ district, fee }) => ({ district, fee }));
  return true;
}

async function getOrCreateCms() {
  let cms = await CmsContent.findOne({ id: 'main' });
  if (!cms) {
    cms = await CmsContent.create(DEFAULT_CMS);
    return cms;
  }
  let dirty = false;
  if (migrateLegacyDemoDeliveryFees(cms)) dirty = true;
  if (expandBanadirDeliveryFees(cms)) dirty = true;
  if (dirty) await cms.save();
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

/** Same as public — prices live in MongoDB */
exports.getAdminContent = exports.getPublicContent;

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
    const { hero, banners, promotions, faqs, deliveryFees, storeSettings } = validation.data;
    const changedSections = [];

    if (hero) {
      cms.hero = { ...(cms.hero.toObject?.() || cms.hero), ...hero };
      changedSections.push('hero');
    }
    if (Array.isArray(banners)) {
      const previousBanners = cms.banners || [];
      const previousByKey = new Map(
        previousBanners.map((b) => [b.id || b.title, b])
      );

      cms.banners = banners;
      changedSections.push('banners');

      for (const banner of banners) {
        if (!banner?.active) continue;
        const key = banner.id || banner.title;
        const previous = previousByKey.get(key);
        if (!previous || !previous.active) {
          await onBannerActivated(banner);
        }
      }
    }
    if (Array.isArray(promotions)) {
      const previousPromos = cms.promotions || [];
      const previousByKey = new Map(
        previousPromos.map((promo) => [promo.id || promo.code, promo])
      );

      // Process and calculate expiresAt based on durationDays
      const processedPromos = promotions.map((promo) => {
        const item = { ...promo };
        const prev = previousByKey.get(promo.id || promo.code);
        
        if (item.durationDays && (!prev || prev.durationDays !== item.durationDays || !item.expiresAt)) {
          item.expiresAt = new Date(Date.now() + Number(item.durationDays) * 24 * 60 * 60 * 1000);
        }
        return item;
      });

      cms.promotions = processedPromos;
      changedSections.push('promotions');

      for (const promo of processedPromos) {
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
    if (storeSettings) {
      cms.storeSettings = {
        ...(cms.storeSettings?.toObject?.() || cms.storeSettings || {}),
        ...storeSettings,
      };
      changedSections.push('storeSettings');
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

/** Admin: upload a CMS image (hero / banner). Returns public `/uploads/...` path. */
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded.' });
    }

    const imagePath = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully.',
      path: imagePath,
      url: imagePath,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to upload image.' });
  }
};
