import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { apiUrl } from '../utils/data';
import { formatMoney, productImage } from '../utils/format';
import { renderRatingStars } from '../utils/rating';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/product-modal.css';

function RatingStars({ rating, className = '' }) {
  const stars = renderRatingStars(rating);
  return (
    <div className={`product-modal-stars d-flex gap-1 ${className}`.trim()}>
      {stars.map((type, index) => (
        <i
          key={index}
          className={
            type === 'solid'
              ? 'fa-solid fa-star'
              : type === 'half'
                ? 'fa-solid fa-star-half-stroke'
                : 'fa-regular fa-star'
          }
        />
      ))}
    </div>
  );
}

export default function ProductModal({ isOpen, product, onClose }) {
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const [activeSlide, setActiveSlide] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewBlocked, setReviewBlocked] = useState('');

  const images = (product?.images || []).filter(Boolean);
  const inStock = product?.stock !== 'out-of-stock';
  const wishlisted = product ? isWishlisted(product.title) : false;

  useEffect(() => {
    if (!isOpen || !product) return undefined;

    setActiveSlide(0);
    setQuantity(1);
    setReviewRating(0);
    setReviewComment('');
    setApprovedReviews([]);
    setReviewSubmitted(false);
    setReviewBlocked('');

    let cancelled = false;
    setReviewsLoading(true);

    fetch(apiUrl(`/api/reviews/product/${product.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success) setApprovedReviews(data.reviews || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    return () => {
      cancelled = true;
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, product, onClose]);

  if (!isOpen || !product) return null;

  const totalPrice = product.price * quantity;
  const showTotal = quantity >= 2;

  const handleAddToCart = () => {
    if (!inStock) {
      showTopFloatNotification('This product is out of stock!', 'danger');
      return;
    }
    const added = addToCart(product, quantity);
    if (added) {
      showTopFloatNotification(`${quantity} item(s) added to cart!`);
    }
  };

  const handleWishlist = () => {
    const wasWishlisted = wishlisted;
    toggleWishlist(product.title);
    showTopFloatNotification(
      wasWishlisted ? 'Product removed from wishlist!' : 'Product saved to wishlist!'
    );
  };

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      showTopFloatNotification('Fadlan dooro rating (xiddigo)!', 'danger');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showTopFloatNotification('Please login to submit a review.', 'danger');
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/reviews'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });
      const data = await response.json();
      if (data.success) {
        setReviewSubmitted(true);
        setReviewRating(0);
        setReviewComment('');
        showTopFloatNotification('Review submitted! It will appear after admin approval.');
      } else {
        if (data.message?.includes('already reviewed')) {
          setReviewBlocked(data.message);
        }
        showTopFloatNotification(data.message || 'Failed to submit review', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not submit review. Check backend connection.', 'danger');
    }
  };

  return (
    <div className="product-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="product-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="productModalTitle"
      >
        <button type="button" className="product-modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="product-modal-body">
          <div className="row g-4">
            <div className="col-md-6">
              <div className="modal-carousel-box">
                <div className="product-modal-carousel-inner">
                  {images.map((img, index) => (
                    <div
                      key={img}
                      className={`product-modal-carousel-slide${index === activeSlide ? ' is-active' : ''}`}
                    >
                      <img src={productImage(img)} alt={product.title} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-thumbnails-row">
                {images.map((img, index) => (
                  <button
                    key={img}
                    type="button"
                    className={`thumb-box${index === activeSlide ? ' active-thumb' : ''}`}
                    onClick={() => setActiveSlide(index)}
                  >
                    <img src={productImage(img)} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <div className="col-md-6">
              <h2 id="productModalTitle" className="modal-product-title">
                {product.title}
              </h2>

              <div className="d-flex align-items-center gap-2 mb-2">
                <RatingStars rating={product.rating || 0} />
                <span style={{ fontSize: '0.85rem', color: '#666' }}>
                  {product.rating || 0} rating
                  {approvedReviews.length > 0 ? ` · ${approvedReviews.length} review${approvedReviews.length === 1 ? '' : 's'}` : ''}
                </span>
              </div>

              <div className="modal-price">{formatMoney(product.price)}</div>

              <p className="modal-desc">
                {product.description?.trim()
                  || 'Crafted with premium materials and modern detail, designed to bring comfort, beauty, and long-lasting quality to your home.'}
              </p>

              <table className="table table-borderless modal-specs-table">
                <tbody>
                  <tr>
                    <td>
                      <i className="fa-solid fa-couch" /> Material
                    </td>
                    <td>{product.material}</td>
                  </tr>
                  <tr>
                    <td>
                      <i className="fa-solid fa-palette" /> Color
                    </td>
                    <td>{product.color}</td>
                  </tr>
                  {product.dimensions ? (
                    <tr>
                      <td>
                        <i className="fa-solid fa-ruler-combined" /> Dimensions
                      </td>
                      <td>{product.dimensions}</td>
                    </tr>
                  ) : null}
                  <tr>
                    <td>
                      <i className="fa-solid fa-circle-check" /> Availability
                    </td>
                    <td className={inStock ? 'spec-in-stock' : 'spec-out-of-stock'}>
                      {product.availability}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="quantity-btn-group">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                    -
                  </button>
                  <input type="text" value={quantity} readOnly aria-label="Quantity" />
                  <button type="button" onClick={() => setQuantity((q) => q + 1)}>
                    +
                  </button>
                </div>

                <div className={`total-price-label${showTotal ? ' is-visible' : ''}`}>
                  Total Price: {formatMoney(totalPrice)}
                </div>
              </div>

              <div className="d-flex align-items-center gap-3 mb-3 flex-wrap">
                <button
                  type="button"
                  className={`btn-modal-add-wishlist${wishlisted ? ' wishlisted-active' : ''}`}
                  onClick={handleWishlist}
                >
                  <i className={`fa-${wishlisted ? 'solid' : 'regular'} fa-heart me-2`} />
                  {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <button
                  type="button"
                  className="btn-modal-add-cart"
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  <i className={`fa-solid ${inStock ? 'fa-cart-shopping' : 'fa-ban'} me-2`} />
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>

              <div className="modal-review-section">
                <div className="rate-title">Customer Reviews</div>
                {reviewsLoading && (
                  <p className="text-muted small mb-2">Loading reviews…</p>
                )}
                {!reviewsLoading && approvedReviews.length === 0 && (
                  <p className="text-muted small mb-3">No approved reviews yet. Be the first to review!</p>
                )}
                {approvedReviews.length > 0 && (
                  <div className="modal-reviews-list mb-3">
                    {approvedReviews.map((rev) => (
                      <div key={rev.id} className="modal-review-item mb-2 p-2 rounded bg-light">
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <RatingStars rating={rev.rating} />
                          <strong className="small">{rev.userName || 'Customer'}</strong>
                        </div>
                        {rev.comment && <p className="small mb-0 text-secondary">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="rate-title">Rate this product</div>

                {reviewSubmitted && (
                  <p className="small text-success mb-2">
                    Thank you! Your review is pending admin approval.
                  </p>
                )}
                {reviewBlocked && (
                  <p className="small text-muted mb-2">{reviewBlocked}</p>
                )}

                {!reviewSubmitted && !reviewBlocked && (
                  <>
                <div className="interactive-stars product-modal-stars product-modal-stars--interactive">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      role="button"
                      tabIndex={0}
                      className={`fa-${star <= reviewRating ? 'solid' : 'regular'} fa-star${star <= reviewRating ? ' selected' : ''}`}
                      onClick={() => setReviewRating(star)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') setReviewRating(star);
                      }}
                    />
                  ))}
                </div>

                <div className="rate-title">Add a comment (optional)</div>
                <textarea
                  className="modal-comment-box"
                  placeholder="Share your experience with this product..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />

                <button type="button" className="btn-submit-review" onClick={handleSubmitReview}>
                  Submit Review
                </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
