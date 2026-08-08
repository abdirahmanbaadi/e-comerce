import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { apiUrl } from '../../utils/data';
import { formatMoney, productImage } from '../../utils/format';
import {
  getProductAvailability,
  getProductColor,
  getProductDescription,
  getProductMaterial,
  isProductInStock,
} from '../../utils/productDisplay';

const categoryNames = {
  'living-room': 'Living Room',
  bedroom: 'Bedroom',
  'dining-room': 'Dining Room',
  outdoor: 'Outdoor',
  chair: 'Chair',
  office: 'Office',
};

function SpecRow({ icon, label, value, valueClass = '' }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center text-[#0b3d35]">
        <i className={`fa-solid ${icon} text-[0.95rem]`} />
      </span>
      <span className="w-[96px] shrink-0 text-[0.88rem] font-extrabold text-[#111111]">{label}</span>
      <span className={`min-w-0 flex-1 text-[0.88rem] font-medium leading-snug text-[#444444] ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

export default function MobileProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [activeImage, setActiveImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 });
  const carouselRef = useRef(null);

  const product = useMemo(
    () => (products || []).find((item) => String(item.id) === String(productId)),
    [productId, products]
  );

  useEffect(() => {
    if (!product?.id) return undefined;
    let cancelled = false;

    fetch(apiUrl(`/api/reviews/product/${product.id}`))
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        setReviewStats(data.stats || { avgRating: 0, count: data.reviews?.length || 0 });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  if (!product) return <Navigate to="/app/shop" replace />;

  const images = product.images?.length ? product.images : [product.image].filter(Boolean);
  const wishlisted = isWishlisted?.(product.title);
  const inStock = isProductInStock(product);
  const category =
    product.label ||
    product.categoryLabel ||
    categoryNames[product.category] ||
    product.category ||
    'Furniture';
  const ratingValue =
    reviewStats.count > 0 ? Number(reviewStats.avgRating || 0) : Number(product.rating || 0);
  const reviewCount = Number(reviewStats.count || product.reviewCount || 0);
  const description = getProductDescription(product);
  const material = getProductMaterial(product);
  const color = getProductColor(product);
  const availability = getProductAvailability(product);

  const handleAdd = () => {
    addToCart(product, qty);
  };

  const goToImage = (index) => {
    setActiveImage(index);
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.scrollTo({ left: carousel.clientWidth * index, behavior: 'smooth' });
    }
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-white font-sans text-[#111111]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#f1ece6] bg-white px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-[#f6f2ec] text-[#111111]"
          aria-label="Back"
        >
          <i className="fa-solid fa-chevron-left text-[0.85rem]" />
        </button>
        <h1 className="m-0 text-[0.98rem] font-black text-[#111111]">Product Details</h1>
        <span className="h-10 w-10" aria-hidden="true" />
      </header>

      <section className="relative h-[min(46dvh,420px)] w-full bg-[#f6f2ec]">
        <div
          ref={carouselRef}
          className="absolute inset-0 flex snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-hide"
          onScroll={(event) => {
            const next = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth);
            if (next !== activeImage && next >= 0 && next < images.length) setActiveImage(next);
          }}
        >
          {images.map((image, index) => (
            <div key={`${image}-${index}`} className="flex min-w-full snap-center items-center justify-center bg-[#f6f2ec]">
              <img
                src={productImage(image)}
                alt=""
                className="h-full w-full object-cover"
                draggable="false"
              />
            </div>
          ))}
        </div>

        {images.length > 1 ? (
          <div className="absolute inset-x-0 bottom-4 z-20 flex justify-center gap-1.5">
            {images.slice(0, 5).map((image, index) => (
              <button
                key={`${image}-thumb-${index}`}
                type="button"
                onClick={() => goToImage(index)}
                className={`h-2 rounded-full border-0 shadow-sm transition-all ${
                  activeImage === index ? 'w-4 bg-white' : 'w-2 bg-white/70'
                }`}
                aria-label={`Product image ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h2 className="m-0 min-w-0 flex-1 text-[1.35rem] font-black leading-tight text-[#161616]">
            {product.title}
          </h2>
          <button
            type="button"
            onClick={() => toggleWishlist?.(product.title)}
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#eee8e2] bg-white text-[1.05rem] text-red-500 shadow-sm"
            aria-label="Wishlist"
          >
            <i className={`${wishlisted ? 'fa-solid' : 'fa-regular'} fa-heart`} />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="m-0 truncate text-[0.8rem] font-semibold text-[#8b8178]">{category}</p>
          <p className="m-0 flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[0.8rem] font-semibold text-[#8b8178]">
            <i className="fa-solid fa-star text-[0.72rem] text-[#f2a324]" />
            <span className="font-black text-[#111111]">
              {ratingValue > 0 ? ratingValue.toFixed(1) : 'New'}
            </span>
            <span className="text-[#a69c93]">
              {reviewCount > 0 ? `(${reviewCount} reviews)` : '(No reviews yet)'}
            </span>
          </p>
        </div>

        <section className="mb-4">
          <h3 className="mb-1 text-[0.82rem] font-black text-[#161616]">Description</h3>
          <p className="m-0 text-[0.8rem] font-semibold leading-relaxed text-[#8b8178]">{description}</p>
        </section>

        <section className="mb-5">
          <SpecRow icon="fa-couch" label="Material" value={material} />
          <SpecRow icon="fa-palette" label="Color" value={color} />
          <SpecRow
            icon="fa-circle-check"
            label="Availability"
            value={availability}
            valueClass={inStock ? 'font-extrabold text-[#087443]' : 'font-extrabold text-[#b42318]'}
          />
        </section>

        <section className="mb-6 flex items-center justify-between">
          <h3 className="m-0 text-[0.82rem] font-black text-[#161616]">Quantity</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQty((value) => Math.max(1, value - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eee8e2] bg-white text-[#111111]"
            >
              -
            </button>
            <span className="min-w-4 text-center text-[0.88rem] font-black">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((value) => value + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eee8e2] bg-white text-[#111111]"
            >
              +
            </button>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <div className="min-w-[92px]">
            <p className="m-0 text-[0.68rem] font-bold text-[#8b8178]">Total Price</p>
            <p className="m-0 text-[1.08rem] font-black text-[#111111]">
              {formatMoney(Number(product.price || 0) * qty)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!inStock}
            className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full border-0 bg-[#111111] text-[0.9rem] font-black text-white shadow-[0_12px_26px_rgba(0,0,0,0.18)] disabled:bg-[#b8afa7]"
          >
            <i className="fa-solid fa-bag-shopping text-[0.82rem]" />
            {inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </section>
    </div>
  );
}
