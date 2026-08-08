const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const { notifyUser } = require('../services/notificationService');
const { buildUserOrdersQuery } = require('../utils/phoneUtils');
const { normalizeOrderId } = require('../utils/orderIdUtils');
const { recalculateDriverRating } = require('../services/driverRatingService');
const {
  findDuePromptForUser,
  getOrderPromptState,
  markPromptShown,
  getOrderLineProducts,
} = require('../services/reviewPromptService');

function mapProductReviewStatus(review) {
  if (!review) return 'missing';
  if (review.status === 'approved') return 'live';
  if (review.status === 'rejected') return 'rejected';
  return 'pending';
}

function driverLabel(order) {
  const name = String(order.driver || '').trim();
  if (!name || name === 'Not assigned yet') return 'Delivery driver';
  return name;
}

async function resolveDriverContact(order) {
  const fallback = {
    driverName: driverLabel(order),
    driverPhone: '',
    driverAvatar: '',
  };

  if (!order.assignedDriverId) return fallback;

  try {
    const driver = await User.findOne({ id: order.assignedDriverId })
      .select('firstName lastName phone avatar')
      .lean();
    if (!driver) return fallback;
    const name = `${driver.firstName || ''} ${driver.lastName || ''}`.trim();
    return {
      driverName: name || fallback.driverName,
      driverPhone: driver.phone || '',
      driverAvatar: driver.avatar || '',
    };
  } catch {
    return fallback;
  }
}

function generateReviewId() {
  return `REV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

async function recalculateProductRating(productId) {
  const approved = await Review.find({ productId, status: 'approved' });
  if (!approved.length) {
    await Product.findOneAndUpdate({ id: productId }, { rating: 0 });
    return;
  }

  const avg = approved.reduce((sum, r) => sum + r.rating, 0) / approved.length;
  await Product.findOneAndUpdate({ id: productId }, { rating: Math.round(avg * 10) / 10 });
}

async function findUserOrders(user) {
  if (!user?.id && !user?.phone) return [];

  return Order.find({
    ...buildUserOrdersQuery(user),
    currentStep: { $ne: 0 },
    status: { $nin: ['cancelled'] },
  }).lean();
}

function orderContainsProduct(order, productId, productTitle) {
  const pid = Number(productId);
  const title = String(productTitle || '').toLowerCase();

  return (order.items || []).some(
    (item) =>
      (item.id && Number(item.id) === pid) ||
      (item.title && title && item.title.toLowerCase().includes(title))
  ) || (order.product && title && order.product.toLowerCase().includes(title));
}

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

async function getProductReviewEligibility(user, productId, productTitle) {
  const existing = await Review.findOne({ productId: Number(productId), userId: user.id }).lean();
  if (existing) {
    const eligibility =
      existing.status === 'pending'
        ? 'pending_review'
        : existing.status === 'rejected'
          ? 'rejected_review'
          : 'already_reviewed';
    return {
      canReview: false,
      eligibility,
      hasReviewed: true,
      userReview: existing,
      purchased: true,
      delivered: true,
    };
  }

  const orders = await findUserOrders(user);
  const matching = orders.filter((order) => orderContainsProduct(order, productId, productTitle));

  if (!matching.length) {
    return {
      canReview: false,
      eligibility: 'not_purchased',
      hasReviewed: false,
      userReview: null,
      purchased: false,
      delivered: false,
    };
  }

  const hasPaid = matching.some(isOrderPaid);
  if (!hasPaid) {
    return {
      canReview: false,
      eligibility: 'not_paid',
      hasReviewed: false,
      userReview: null,
      purchased: true,
      delivered: false,
    };
  }

  const hasDelivered = matching.some((order) => isOrderPaid(order) && isOrderDelivered(order));
  if (!hasDelivered) {
    return {
      canReview: false,
      eligibility: 'not_delivered',
      hasReviewed: false,
      userReview: null,
      purchased: true,
      delivered: false,
    };
  }

  return {
    canReview: true,
    eligibility: 'can_review',
    hasReviewed: false,
    userReview: null,
    purchased: true,
    delivered: true,
  };
}

exports.createReview = async (req, res) => {
  try {
    const { productId, productTitle, rating, comment } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ success: false, message: 'Product and rating are required.' });
    }

    const numericProductId = Number(productId);
    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const existing = await Review.findOne({
      productId: numericProductId,
      userId: req.user.id,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product.',
      });
    }

    const eligibility = await getProductReviewEligibility(req.user, numericProductId, productTitle);
    if (!eligibility.canReview) {
      const messages = {
        not_purchased: 'You can only review products you have purchased.',
        not_paid: 'Review is available after your payment is confirmed.',
        not_delivered: 'You can review this product after it has been delivered.',
        already_reviewed: 'You have already reviewed this product.',
        pending_review: 'Your review is already pending approval.',
        rejected_review: 'Your previous review was not approved.',
      };
      return res.status(403).json({
        success: false,
        message: messages[eligibility.eligibility] || 'You cannot review this product yet.',
        eligibility: eligibility.eligibility,
      });
    }

    const review = await Review.create({
      id: generateReviewId(),
      productId: numericProductId,
      productTitle: productTitle || '',
      userId: req.user?.id || '',
      userName: `${req.user?.firstName || 'Customer'} ${req.user?.lastName || ''}`.trim(),
      rating: numericRating,
      comment: comment || '',
      status: 'pending',
    });

    try {
      const { onReviewThanks } = require('../services/notificationService');
      onReviewThanks(review).catch((err) => console.error('Review thanks notification failed:', err.message));
    } catch (_) {
      /* ignore */
    }

    return res.status(201).json({ success: true, message: 'Review submitted for moderation.', review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const reviews = await Review.find({ productId, status: 'approved' }).sort({ createdAt: -1 }).lean();
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Number(r.rating) || 0));
      breakdown[star] += 1;
    });
    const avgRating = reviews.length
      ? Math.round((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) * 10) / 10
      : 0;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
      stats: { avgRating, count: reviews.length, breakdown },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load reviews.' });
  }
};

exports.getReviewStatus = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const product = await Product.findOne({ id: productId }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    const eligibility = await getProductReviewEligibility(req.user, productId, product.title);

    return res.status(200).json({
      success: true,
      ...eligibility,
      canReview: eligibility.canReview,
      hasReviewed: eligibility.hasReviewed,
      userReview: eligibility.userReview,
      purchased: eligibility.purchased,
      delivered: eligibility.delivered,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to check review status.' });
  }
};

exports.getAllReviews = async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).lean();
    const approved = reviews.filter((r) => r.status === 'approved');
    const avgRating = approved.length
      ? Math.round((approved.reduce((sum, r) => sum + (r.rating || 0), 0) / approved.length) * 10) / 10
      : 0;

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
      stats: {
        pending: reviews.filter((r) => r.status === 'pending').length,
        approved: approved.length,
        rejected: reviews.filter((r) => r.status === 'rejected').length,
        avgRating,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load reviews.' });
  }
};

exports.moderateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid review status.' });
    }

    const review = await Review.findOneAndUpdate({ id }, { status }, { new: true });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    await recalculateProductRating(review.productId);

    if (review.userId) {
      const statusLabel = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'updated';
      await notifyUser({
        userId: review.userId,
        type: 'review_moderated',
        title: status === 'approved' ? 'Review Approved' : status === 'rejected' ? 'Review Rejected' : 'Review Updated',
        message:
          status === 'approved'
            ? `Your review for "${review.productTitle}" is now visible on the product page.`
            : status === 'rejected'
              ? `Your review for "${review.productTitle}" was not approved.`
              : `Your review status was updated to ${status}.`,
        relatedId: review.id,
        metadata: { reviewId: review.id, productId: review.productId, status: statusLabel },
      });
    }

    return res.status(200).json({ success: true, message: 'Review updated.', review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update review.' });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findOneAndDelete({ id: req.params.id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }
    await recalculateProductRating(review.productId);
    return res.status(200).json({ success: true, message: 'Review deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to delete review.' });
  }
};

/** Customer review inbox: incomplete order sessions + rating history. */
exports.getReviewInbox = async (req, res) => {
  try {
    const baseQuery = buildUserOrdersQuery(req.user);
    if (!baseQuery) {
      return res.status(200).json({
        success: true,
        toRate: [],
        history: { delivery: [], products: [] },
      });
    }

    const orders = await Order.find({
      ...baseQuery,
      $or: [{ currentStep: { $gte: 5 } }, { status: 'delivered' }],
    })
      .sort({ deliveredAt: -1, updatedAt: -1 })
      .lean();

    const toRate = [];
    const deliveryHistory = [];

    for (const order of orders) {
      if (!isOrderPaid(order) || !isOrderDelivered(order)) continue;

      const lineProducts = await getOrderLineProducts(order);
      const productIds = lineProducts.map((p) => p.productId).filter(Boolean);
      const reviews = productIds.length
        ? await Review.find({ userId: req.user.id, productId: { $in: productIds } }).lean()
        : [];
      const reviewByProduct = new Map(reviews.map((r) => [Number(r.productId), r]));

      const products = lineProducts
        .filter((p) => p.productId)
        .map((p) => {
          const review = reviewByProduct.get(Number(p.productId));
          return {
            productId: p.productId,
            title: p.title,
            image: p.image || '',
            status: mapProductReviewStatus(review),
            rating: review ? Number(review.rating) || null : null,
            comment: review?.comment || '',
            reviewId: review?.id || null,
          };
        });

      const deliveryDone = Boolean(order.deliveryRating);
      const driverContact = await resolveDriverContact(order);
      const delivery = {
        status: deliveryDone ? 'done' : 'missing',
        rating: deliveryDone ? Number(order.deliveryRating) : null,
        comment: order.deliveryRatingComment || '',
        ratedAt: order.deliveryRatedAt || null,
        driverName: driverContact.driverName,
        driverPhone: driverContact.driverPhone,
        driverAvatar: driverContact.driverAvatar,
      };

      const ratedCount =
        (deliveryDone ? 1 : 0) + products.filter((p) => p.status !== 'missing').length;
      const totalCount = 1 + products.length;
      const isComplete = ratedCount >= totalCount && products.every((p) => p.status !== 'missing') && deliveryDone;

      const session = {
        orderId: order.id,
        deliveredAt: order.deliveredAt || order.updatedAt || null,
        delivery,
        products,
        progress: { rated: ratedCount, total: totalCount },
        isComplete,
      };

      if (!isComplete) toRate.push(session);

      if (deliveryDone) {
        deliveryHistory.push({
          orderId: order.id,
          rating: delivery.rating,
          comment: delivery.comment,
          ratedAt: delivery.ratedAt,
          driverName: delivery.driverName,
        });
      }
    }

    const productReviews = await Review.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const historyProducts = productReviews.map((review) => ({
      reviewId: review.id,
      productId: review.productId,
      title: review.productTitle || 'Product',
      rating: Number(review.rating) || 0,
      comment: review.comment || '',
      status: mapProductReviewStatus(review),
      createdAt: review.createdAt,
    }));

    return res.status(200).json({
      success: true,
      toRate,
      history: {
        delivery: deliveryHistory,
        products: historyProducts,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load review inbox.' });
  }
};

exports.getReviewPrompt = async (req, res) => {
  try {
    const prompt = await findDuePromptForUser(req.user);
    return res.status(200).json({
      success: true,
      prompt,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load review prompt.' });
  }
};

exports.markReviewPromptSeen = async (req, res) => {
  try {
    const orderId = normalizeOrderId(req.params.orderId);
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }
    const order = await markPromptShown(orderId, req.user);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    const state = await getOrderPromptState(req.user, order.toObject ? order.toObject() : order);
    return res.status(200).json({ success: true, prompt: state });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to update review prompt.' });
  }
};

exports.rateDelivery = async (req, res) => {
  try {
    const orderId = normalizeOrderId(req.params.orderId);
    const { rating, comment } = req.body;
    const numericRating = Number(rating);

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required.' });
    }

    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
    }

    const order = await Order.findOne({ id: orderId, ...buildUserOrdersQuery(req.user) });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const step = Number(order.currentStep) || 0;
    if (step < 5 && String(order.status || '').toLowerCase() !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Delivery can only be rated after delivery.' });
    }

    if (order.deliveryRating) {
      return res.status(400).json({ success: false, message: 'You already rated this delivery.' });
    }

    order.deliveryRating = numericRating;
    order.deliveryRatingComment = (comment || '').trim();
    order.deliveryRatedAt = new Date();
    if (!order.deliveredAt) order.deliveredAt = new Date();
    await order.save();

    if (order.assignedDriverId) {
      await recalculateDriverRating(order.assignedDriverId);
    }

    const state = await getOrderPromptState(req.user, order.toObject());
    return res.status(200).json({
      success: true,
      message: 'Delivery rating saved.',
      prompt: state,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to save delivery rating.' });
  }
};
