function trimStr(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function normalizeBanner(entry, index) {
  return {
    id: trimStr(entry.id, 80) || `banner-${index + 1}`,
    title: trimStr(entry.title, 120),
    subtitle: trimStr(entry.subtitle, 200),
    image: trimStr(entry.image, 300),
    link: trimStr(entry.link, 200) || '/products',
    active: entry.active !== false,
    order: Number(entry.order) || index + 1,
  };
}

function normalizePromotion(entry, index) {
  const code = trimStr(entry.code, 30).toUpperCase();
  if (!code) return null;

  return {
    id: trimStr(entry.id, 80) || `promo-${index + 1}`,
    code,
    description: trimStr(entry.description, 200),
    title: trimStr(entry.title || entry.description, 120),
    discountAmount: Math.max(0, Number(entry.discountAmount) || 0),
    discountPercent: Math.min(100, Math.max(0, Number(entry.discountPercent) || 0)),
    active: entry.active !== false,
  };
}

function normalizeFaq(entry, index) {
  const question = trimStr(entry.question, 300);
  const answer = trimStr(entry.answer, 2000);
  if (!question || !answer) return null;

  return {
    id: trimStr(entry.id, 80) || `faq-${index + 1}`,
    question,
    answer,
    order: Number(entry.order) || index + 1,
  };
}

function normalizeDeliveryFee(entry) {
  const district = trimStr(entry.district, 80);
  const fee = Number(entry.fee);
  if (!district || Number.isNaN(fee) || fee < 0) return null;
  return { district, fee };
}

function validateCmsUpdate(body = {}) {
  const errors = [];
  const data = {};

  if (body.hero && typeof body.hero === 'object') {
    data.hero = {
      smallTitle: trimStr(body.hero.smallTitle, 120),
      title: trimStr(body.hero.title, 200),
      description: trimStr(body.hero.description, 600),
      ctaText: trimStr(body.hero.ctaText, 60),
      ctaLink: trimStr(body.hero.ctaLink, 200) || '/products',
      image: trimStr(body.hero.image, 300),
    };
  }

  if (Array.isArray(body.banners)) {
    data.banners = body.banners.map(normalizeBanner);
  }

  if (Array.isArray(body.promotions)) {
    data.promotions = body.promotions.map(normalizePromotion).filter(Boolean);
  }

  if (Array.isArray(body.faqs)) {
    data.faqs = body.faqs.map(normalizeFaq).filter(Boolean);
    if (body.faqs.length > 0 && data.faqs.length === 0) {
      errors.push('Each FAQ needs a question and answer.');
    }
  }

  if (Array.isArray(body.deliveryFees)) {
    data.deliveryFees = body.deliveryFees.map(normalizeDeliveryFee).filter(Boolean);
    if (body.deliveryFees.length > 0 && data.deliveryFees.length === 0) {
      errors.push('Delivery fees must include a district name and a valid fee.');
    }
  }

  return { ok: errors.length === 0, errors, data };
}

module.exports = { validateCmsUpdate };
