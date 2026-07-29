const Order = require('../models/Order');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { normalizePhone, buildUserOrdersQuery } = require('../utils/phoneUtils');
const { normalizeOrderId } = require('../utils/orderIdUtils');

const {
  REVIEW_FIRST_PROMPT_DELAY_MS,
  REVIEW_REMINDER_DELAY_MS,
} = require('../config/timingConfig');

const FIRST_PROMPT_DELAY_MS = REVIEW_FIRST_PROMPT_DELAY_MS;
const REMINDER_DELAY_MS = REVIEW_REMINDER_DELAY_MS;
const MAX_REVIEW_PROMPTS = 3;

function isOrderPaid(order) {
  const payment = String(order.payment || '').toLowerCase();
  const paymentType = String(order.paymentType || '').toLowerCase();
  return payment === 'paid' || paymentType === 'paid';
}

function isOrderDelivered(order) {
  const step = Number(order.currentStep) || 0;
  const status = String(order.status || '').toLowerCase();
  return step >= 5 || status === 'delivered';
}

function buildUserOrderQuery(user) {
  return buildUserOrdersQuery(user);
}

async function resolveProductId(item, fallbackTitle) {
  if (item?.id) return Number(item.id);
  const title = item?.title || fallbackTitle;
  if (!title) return null;
  const product = await Product.findOne({
    title: { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
  })
    .select('id title')
    .lean();
  return product?.id ?? null;
}

async function getOrderLineProducts(order) {
  const rows = [];
  const seen = new Set();

  const pushItem = (productId, title, image) => {
    const key = productId ? `id:${productId}` : `t:${title}`;
    if (!title || seen.has(key)) return;
    seen.add(key);
    rows.push({
      productId: productId || null,
      title: title || 'Product',
      image: image || '',
    });
  };

  if (Array.isArray(order.items) && order.items.length > 0) {
    for (const item of order.items) {
      const productId = item.id ? Number(item.id) : await resolveProductId(item, order.product);
      pushItem(productId, item.title || order.product, item.image);
    }
  } else if (order.product) {
    const productId = await resolveProductId(null, order.product);
    pushItem(productId, order.product, '');
  }

  return rows;
}

async function getUserReviewsForProducts(userId, productIds) {
  if (!userId || !productIds.length) return [];
  return Review.find({
    userId,
    productId: { $in: productIds.filter(Boolean) },
  }).lean();
}

function getDeliveredTimestamp(order) {
  if (order.deliveredAt) return new Date(order.deliveredAt).getTime();
  if (isOrderDelivered(order) && order.updatedAt) return new Date(order.updatedAt).getTime();
  return null;
}

function isPromptTimingDue(order) {
  const count = Number(order.reviewPromptCount) || 0;
  if (count >= MAX_REVIEW_PROMPTS) return false;

  const deliveredAt = getDeliveredTimestamp(order);
  if (!deliveredAt) return false;

  const now = Date.now();

  if (count === 0) {
    return now >= deliveredAt + FIRST_PROMPT_DELAY_MS;
  }

  if (!order.reviewPromptLastAt) {
    return now >= deliveredAt + FIRST_PROMPT_DELAY_MS + REMINDER_DELAY_MS * count;
  }

  return now >= new Date(order.reviewPromptLastAt).getTime() + REMINDER_DELAY_MS;
}

async function getOrderPromptState(user, order) {
  const products = await getOrderLineProducts(order);
  const productIds = products.map((p) => p.productId).filter(Boolean);
  const reviews = await getUserReviewsForProducts(user.id, productIds);
  const reviewedIds = new Set(reviews.map((r) => Number(r.productId)));

  const pendingProducts = products
    .filter((p) => p.productId && !reviewedIds.has(Number(p.productId)))
    .map((p) => ({
      ...p,
      reviewed: false,
    }));

  const reviewedProducts = products
    .filter((p) => p.productId && reviewedIds.has(Number(p.productId)))
    .map((p) => ({ ...p, reviewed: true }));

  const deliveryRated = Boolean(order.deliveryRating);
  const isComplete = deliveryRated && pendingProducts.length === 0;

  return {
    orderId: order.id,
    driverName: order.driver && order.driver !== 'Not assigned yet' ? order.driver : 'Delivery driver',
    deliveryRated,
    deliveryRating: order.deliveryRating || null,
    promptCount: Number(order.reviewPromptCount) || 0,
    promptAttempt: (Number(order.reviewPromptCount) || 0) + 1,
    isComplete,
    pendingProducts,
    reviewedProducts,
    allProducts: [...pendingProducts, ...reviewedProducts],
  };
}

async function findDuePromptForUser(user) {
  const baseQuery = buildUserOrderQuery(user);
  if (!baseQuery) return null;

  const orders = await Order.find({
    ...baseQuery,
    currentStep: { $gte: 5 },
    status: 'delivered',
    reviewPromptCount: { $lt: MAX_REVIEW_PROMPTS },
  })
    .sort({ deliveredAt: -1, updatedAt: -1 })
    .lean();

  for (const order of orders) {
    if (!isOrderPaid(order) || !isOrderDelivered(order)) continue;
    const state = await getOrderPromptState(user, order);
    if (state.isComplete) continue;
    if (!isPromptTimingDue(order)) continue;
    return state;
  }

  return null;
}

async function markPromptShown(orderId, user) {
  const normalizedId = normalizeOrderId(orderId);
  const baseQuery = buildUserOrderQuery(user);
  if (!baseQuery || !normalizedId) return null;

  const order = await Order.findOne({ id: normalizedId, ...baseQuery });
  if (!order) return null;

  order.reviewPromptCount = (Number(order.reviewPromptCount) || 0) + 1;
  order.reviewPromptLastAt = new Date();
  if (!order.deliveredAt && isOrderDelivered(order)) {
    order.deliveredAt = new Date();
  }
  await order.save();
  return order;
}

function stampDeliveredAt(order, prevStep) {
  const step = Number(order.currentStep) || 0;
  const wasDelivered = (Number(prevStep) || 0) >= 5;
  const nowDelivered = step >= 5 || String(order.status || '').toLowerCase() === 'delivered';
  if (nowDelivered && !wasDelivered && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }
}

module.exports = {
  FIRST_PROMPT_DELAY_MS,
  REMINDER_DELAY_MS,
  MAX_REVIEW_PROMPTS,
  findDuePromptForUser,
  getOrderPromptState,
  markPromptShown,
  stampDeliveredAt,
  getOrderLineProducts,
};
