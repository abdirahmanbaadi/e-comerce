/**
 * STORE PRODUCTS — ProductCard + ProductModal (Tailwind only)
 */
import { useEffect, useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import { getMaterialLabel } from '../../utils/productFilters';
import { renderRatingStars } from '../../utils/rating';
import { showTopFloatNotification } from '../../utils/notifications';

/* ═══════════════════════════════════════════════════
   PRODUCT CARD
   ═══════════════════════════════════════════════════ */

export function ProductCard({
  product,
  onOpen,
  onAddToCart,
  className = '',
  categoryFormat = 'slash',
}) {
  const categoryText =
    categoryFormat === 'dot'
      ? `${product.label || product.category} • ${product.materialLabel || getMaterialLabel(product.materialType)}`
      : `${product.label || product.category} / ${product.materialLabel || getMaterialLabel(product.materialType)}`;

  return (
    <div className={className}>
      <div
        className="group h-[305px] cursor-pointer overflow-hidden rounded-[14px] border border-black/[0.06] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] transition-all duration-[250ms] hover:-translate-y-[5px] hover:shadow-[0_10px_24px_rgba(0,0,0,0.09)]"
        onClick={() => onOpen(product)}
        role="presentation"
      >
        <div className="relative h-[175px] w-full overflow-hidden bg-[#f5f5f5]">
          {product.discount ? (
            <span className="absolute left-3 top-3 z-[2] rounded-full bg-deepGreen px-2.5 py-1 text-[0.72rem] font-extrabold text-white">
              {product.discount}
            </span>
          ) : null}
          <img
            src={productImage(product.images?.[0])}
            alt={product.title}
            className="block h-full w-full max-w-none object-cover transition duration-[350ms] group-hover:scale-[1.06]"
          />
        </div>

        <div className="px-3.5 py-[11px]">
          <h3
            className="mb-1 truncate text-[0.95rem] font-extrabold text-productTitle"
            title={product.title}
          >
            {product.title}
          </h3>

          <div className="mb-2 flex items-center justify-between">
            <div className="mb-0 text-[0.76rem] capitalize text-[#999999]">{categoryText}</div>
            <span className="text-[0.78rem] font-bold text-[#555555]">
              <i className="fa-solid fa-star text-starGold" /> {product.rating}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-btnBrown">{formatMoney(product.price)}</span>
              {product.discount && product.oldPrice ? (
                <span className="text-[0.86rem] font-bold text-[#999999] line-through">
                  {formatMoney(product.oldPrice)}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-0 bg-deepGreen p-0 text-[0.8rem] text-white shadow-[0_3px_8px_rgba(7,61,53,0.2)] transition-all duration-200 hover:scale-110 hover:bg-gold hover:shadow-[0_4px_10px_rgba(216,161,40,0.3)]"
              onClick={(e) => onAddToCart(product, e)}
              title="Add to Cart"
            >
              <i className="fa-solid fa-cart-shopping" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT MODAL — helpers
   ═══════════════════════════════════════════════════ */

function RatingStars({ rating, interactive = false, onSelect, className = '' }) {
  if (interactive) {
    return (
      <div className={`flex gap-[7px] text-[1.35rem] ${className}`.trim()}>
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            role="button"
            tabIndex={0}
            className={`cursor-pointer transition-all duration-200 hover:scale-125 ${
              star <= rating ? 'fa-solid fa-star text-starGold' : 'fa-regular fa-star text-[#cccccc]'
            }`}
            onClick={() => onSelect?.(star)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelect?.(star);
            }}
          />
        ))}
      </div>
    );
  }

  const stars = renderRatingStars(rating);
  return (
    <div className={`flex gap-1 ${className}`.trim()}>
      {stars.map((type, index) => (
        <i
          key={index}
          className={`text-[0.95rem] text-starGold ${
            type === 'solid'
              ? 'fa-solid fa-star'
              : type === 'half'
                ? 'fa-solid fa-star-half-stroke'
                : 'fa-regular fa-star'
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   PRODUCT MODAL
   ═══════════════════════════════════════════════════ */

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
    if (added) showTopFloatNotification(`${quantity} item(s) added to cart!`);
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
        if (data.message?.includes('already reviewed')) setReviewBlocked(data.message);
        showTopFloatNotification(data.message || 'Failed to submit review', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not submit review. Check backend connection.', 'danger');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-deepGreen/45 p-4 backdrop-blur-[4px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-productModalIn relative max-h-[92vh] w-full max-w-[930px] overflow-y-auto rounded-[18px] bg-softBg shadow-[0_25px_60px_rgba(0,0,0,0.22)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="productModalTitle"
      >
        <button
          type="button"
          className="absolute right-[15px] top-[15px] z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-0 bg-white text-[1.4rem] leading-none text-[#111] shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <div className="p-6">
          <div className="flex flex-col gap-4 md:flex-row">
            {/* Images */}
            <div className="w-full md:w-1/2">
              <div className="mb-3 h-[300px] overflow-hidden rounded-[14px] border border-black/[0.05] bg-white md:h-[390px]">
                <div className="relative h-full">
                  {images.map((img, index) => (
                    <div
                      key={img}
                      className={`h-full ${index === activeSlide ? 'block' : 'hidden'}`}
                    >
                      <img
                        src={productImage(img)}
                        alt={product.title}
                        className="block h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {images.map((img, index) => (
                  <button
                    key={img}
                    type="button"
                    className={`h-[74px] w-[74px] cursor-pointer overflow-hidden rounded-lg border-2 bg-white p-0 transition-colors ${
                      index === activeSlide
                        ? 'border-deepGreen'
                        : 'border-transparent hover:border-deepGreen'
                    }`}
                    onClick={() => setActiveSlide(index)}
                  >
                    <img src={productImage(img)} alt="" className="block h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="w-full md:w-1/2">
              <h2
                id="productModalTitle"
                className="mb-2 font-display text-[1.75rem] font-bold leading-[1.15] text-deepGreen md:text-[2.15rem]"
              >
                {product.title}
              </h2>

              <div className="mb-2 flex items-center gap-2">
                <RatingStars rating={product.rating || 0} />
                <span className="text-[0.85rem] text-[#666666]">
                  {product.rating || 0} rating
                  {approvedReviews.length > 0
                    ? ` · ${approvedReviews.length} review${approvedReviews.length === 1 ? '' : 's'}`
                    : ''}
                </span>
              </div>

              <div className="mb-3 text-[1.55rem] font-extrabold text-[#111111]">
                {formatMoney(product.price)}
              </div>

              <p className="mb-4 text-[0.9rem] leading-relaxed text-[#555555]">
                {product.description?.trim() ||
                  'Crafted with premium materials and modern detail, designed to bring comfort, beauty, and long-lasting quality to your home.'}
              </p>

              <table className="mb-[18px] mt-2.5 w-full border-collapse text-[0.88rem]">
                <tbody>
                  {[
                    { icon: 'fa-couch', label: 'Material', value: product.material },
                    { icon: 'fa-palette', label: 'Color', value: product.color },
                    product.dimensions
                      ? { icon: 'fa-ruler-combined', label: 'Dimensions', value: product.dimensions }
                      : null,
                    {
                      icon: 'fa-circle-check',
                      label: 'Availability',
                      value: product.availability,
                      stockClass: inStock
                        ? 'font-extrabold text-[#087443]'
                        : 'font-extrabold text-[#b42318]',
                    },
                  ]
                    .filter(Boolean)
                    .map((row) => (
                      <tr key={row.label}>
                        <td className="w-[125px] py-1.5 align-middle font-extrabold text-[#111111]">
                          <i className={`fa-solid ${row.icon} mr-1.5 w-4 text-deepGreen`} />
                          {row.label}
                        </td>
                        <td className={`py-1.5 align-middle text-[#444444] ${row.stockClass || ''}`}>
                          {row.value}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-[39px] items-center overflow-hidden rounded-[7px] border border-black/15 bg-white">
                  <button
                    type="button"
                    className="h-full cursor-pointer border-0 bg-transparent px-3 font-extrabold text-[#111]"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    -
                  </button>
                  <input
                    type="text"
                    value={quantity}
                    readOnly
                    aria-label="Quantity"
                    className="w-[38px] border-0 bg-transparent text-center font-extrabold outline-none"
                  />
                  <button
                    type="button"
                    className="h-full cursor-pointer border-0 bg-transparent px-3 font-extrabold text-[#111]"
                    onClick={() => setQuantity((q) => q + 1)}
                  >
                    +
                  </button>
                </div>

                {showTotal && (
                  <div className="text-[0.95rem] font-extrabold text-[#111111]">
                    Total Price: {formatMoney(totalPrice)}
                  </div>
                )}
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className={`h-10 cursor-pointer rounded-[7px] border-[1.5px] px-[18px] text-[0.9rem] font-extrabold transition-all duration-300 active:scale-[0.96] ${
                    wishlisted
                      ? 'border-btnBrown bg-btnBrown text-white'
                      : 'border-btnBrown bg-white text-btnBrown hover:-translate-y-0.5 hover:bg-btnBrown hover:text-white hover:shadow-[0_6px_15px_rgba(201,125,85,0.25)]'
                  }`}
                  onClick={handleWishlist}
                >
                  <i className={`fa-${wishlisted ? 'solid' : 'regular'} fa-heart me-2`} />
                  {wishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </button>

                <button
                  type="button"
                  className={`h-10 cursor-pointer rounded-[7px] border-0 px-[18px] text-[0.9rem] font-extrabold text-white transition-all duration-300 active:scale-[0.96] ${
                    inStock
                      ? 'bg-deepGreen hover:-translate-y-0.5 hover:bg-[#0e4c30] hover:shadow-[0_6px_15px_rgba(10,54,34,0.3)]'
                      : 'cursor-not-allowed bg-[#999999]'
                  }`}
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  <i className={`fa-solid ${inStock ? 'fa-cart-shopping' : 'fa-ban'} me-2`} />
                  {inStock ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>

              <div className="mt-[18px] rounded-xl border border-black/[0.04] bg-white/[0.55] p-4">
                <div className="mb-1.5 text-[0.85rem] font-extrabold text-[#111]">Customer Reviews</div>
                {reviewsLoading && <p className="mb-2 text-sm text-gray-500">Loading reviews…</p>}
                {!reviewsLoading && approvedReviews.length === 0 && (
                  <p className="mb-3 text-sm text-gray-500">No approved reviews yet. Be the first to review!</p>
                )}
                {approvedReviews.length > 0 && (
                  <div className="mb-3">
                    {approvedReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="mb-2 rounded border border-black/[0.05] bg-white/70 p-2"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <RatingStars rating={rev.rating} />
                          <strong className="text-sm">{rev.userName || 'Customer'}</strong>
                        </div>
                        {rev.comment && <p className="mb-0 text-sm text-gray-500">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mb-1.5 text-[0.85rem] font-extrabold text-[#111]">Rate this product</div>

                {reviewSubmitted && (
                  <p className="mb-2 text-sm text-green-600">
                    Thank you! Your review is pending admin approval.
                  </p>
                )}
                {reviewBlocked && <p className="mb-2 text-sm text-gray-500">{reviewBlocked}</p>}

                {!reviewSubmitted && !reviewBlocked && (
                  <>
                    <RatingStars
                      rating={reviewRating}
                      interactive
                      onSelect={setReviewRating}
                      className="mb-3"
                    />

                    <div className="mb-1.5 text-[0.85rem] font-extrabold text-[#111]">
                      Add a comment (optional)
                    </div>
                    <textarea
                      className="mb-0 h-[72px] w-full resize-none rounded-lg border border-black/15 p-2.5 font-sans text-[0.88rem] transition-all duration-300 focus:border-deepGreen focus:outline-none focus:shadow-[0_0_0_3px_rgba(10,54,34,0.1)]"
                      placeholder="Share your experience with this product..."
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                    />

                    <button
                      type="button"
                      className="mt-2.5 cursor-pointer rounded-[7px] border-0 bg-deepGreen px-4 py-2 text-[0.85rem] font-extrabold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0e4c30] hover:shadow-[0_6px_15px_rgba(10,54,34,0.3)] active:scale-[0.96]"
                      onClick={handleSubmitReview}
                    >
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
