const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { notifyUser } = require('../services/notificationService');
const { normalizePhone } = require('../utils/phoneUtils');

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

async function userPurchasedProduct(user, productId, productTitle) {
  if (!user?.id && !user?.phone) return false;

  const query = user.id
    ? { $or: [{ userId: user.id }, { phone: normalizePhone(user.phone) }] }
    : { phone: normalizePhone(user.phone) };

  const orders = await Order.find({
    ...query,
    currentStep: { $ne: 0 },
    status: { $nin: ['cancelled'] },
  }).lean();

  const pid = Number(productId);
  const title = String(productTitle || '').toLowerCase();

  return orders.some((order) =>
    (order.items || []).some(
      (item) =>
        (item.id && Number(item.id) === pid) ||
        (item.title && title && item.title.toLowerCase().includes(title))
    )
  );
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

    const purchased = await userPurchasedProduct(req.user, numericProductId, productTitle);
    if (!purchased) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have ordered.',
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

    return res.status(201).json({ success: true, message: 'Review submitted for moderation.', review });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to submit review.' });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const reviews = await Review.find({ productId, status: 'approved' }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: reviews.length, reviews });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'Failed to load reviews.' });
  }
};

exports.getAllReviews = async (_req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: reviews.length, reviews });
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
