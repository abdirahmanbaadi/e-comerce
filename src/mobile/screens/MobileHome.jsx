import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import MobileBottomNav from '../MobileBottomNav';
import MobileHeaderIcons from '../MobileHeaderIcons';
import MobileProfileButton from '../MobileProfileButton';

const categoryThumbs = {
  'living-room': '/product-images/ivory-luxe-living-room-set-main.jpeg.jpeg',
  bedroom: '/product-images/blush-velvet-arch-bed-main.jpeg.jpeg',
  'dining-room': '/product-images/dining-table.png',
  outdoor: '/product-images/sunhaven-outdoor-lounge-set-main.jpeg.jpeg',
  chair: '/product-images/olive-curve-lounge-chair-main.jpeg.png',
  office: '/product-images/office-chair.png',
};

const homeCategories = [
  { value: 'living-room', label: 'Sofa' },
  { value: 'bedroom', label: 'Bed' },
  { value: 'dining-room', label: 'Table' },
  { value: 'chair', label: 'Chair' },
  { value: 'office', label: 'Storage' },
  { value: 'outdoor', label: 'Outdoor' },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getFirstName(user) {
  if (!user?.isLoggedIn) return 'Guest';
  const fromFull = String(user?.fullName || localStorage.getItem('userFullName') || '')
    .trim()
    .split(/\s+/)[0];
  return user?.firstName || fromFull || 'Guest';
}

function SectionHeader({ title, to = '/app/shop' }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="m-0 text-[1.02rem] font-extrabold text-[#2f241a]">{title}</h2>
      <Link to={to} className="text-[0.78rem] font-bold text-[#8a5a33] no-underline">
        View all
      </Link>
    </div>
  );
}

function ProductCard({ product, onOpen, onToggleWish, wishlisted }) {
  const image = productImage(product?.images?.[0] || product?.image);
  return (
    <article
      className="w-[158px] shrink-0 cursor-pointer overflow-hidden rounded-[20px] bg-white shadow-[0_10px_24px_rgba(111,77,43,0.08)] ring-1 ring-[#eadfce]"
      onClick={() => onOpen(product)}
    >
      <div className="relative h-[118px] bg-[#f2e7d9]">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWish(product);
          }}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border-0 bg-white/90"
          aria-label="Wishlist"
        >
          <i
            className={`fa-heart text-[0.92rem] ${
              wishlisted ? 'fa-solid text-[#e11d48]' : 'fa-regular text-[#7b4a28]'
            }`}
          />
        </button>
      </div>
      <div className="px-3 py-3">
        <h3 className="m-0 line-clamp-1 text-[0.8rem] font-extrabold text-[#2f241a]">{product.title}</h3>
        <p className="mb-1 mt-1 text-[0.78rem] font-black text-[#2f241a]">{formatMoney(product.price)}</p>
        <div className="flex items-center gap-1 text-[0.68rem] font-bold text-[#8a7865]">
          <span className="text-[#f2a324]">★</span>
          <span>{Number(product.rating || 4.8).toFixed(1)}</span>
        </div>
      </div>
    </article>
  );
}

function ProductRail({ products, onOpen, onToggleWish, isWishlisted }) {
  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide">
      {products.map((product) => (
        <ProductCard
          key={product.id || product.title}
          product={product}
          onOpen={onOpen}
          onToggleWish={onToggleWish}
          wishlisted={isWishlisted?.(product.title)}
        />
      ))}
    </div>
  );
}

export default function MobileHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products } = useProducts();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [query, setQuery] = useState('');

  const activeProducts = useMemo(
    () => (products || []).filter((product) => product.status !== 'Inactive'),
    [products]
  );
  const popular = useMemo(() => activeProducts.slice(0, 8), [activeProducts]);
  const newArrivals = useMemo(() => [...activeProducts].slice(-8).reverse(), [activeProducts]);
  const bestSellers = useMemo(
    () => [...activeProducts].sort((a, b) => Number(b.rating || 4.8) - Number(a.rating || 4.8)).slice(0, 8),
    [activeProducts]
  );
  const recommended = useMemo(
    () => activeProducts.filter((product) => product.discount || product.oldPrice).slice(0, 8),
    [activeProducts]
  );

  const submitSearch = (event) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/app/shop?q=${encodeURIComponent(q)}` : '/app/shop');
  };

  const handleWish = (product) => {
    const wasWishlisted = isWishlisted?.(product.title);
    toggleWishlist?.(product.title);
    showTopFloatNotification(wasWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const openProduct = (product) => {
    navigate(`/app/product/${product.id}`);
  };

  const firstName = getFirstName(user);

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#f7f2eb] pb-[calc(8.5rem+env(safe-area-inset-bottom))] font-sans text-[#2f241a]">
      <main className="mx-auto max-w-md px-4 pb-6 pt-[max(0.85rem,env(safe-area-inset-top))]">
        {/* Header — profile avatar | greeting | notifications */}
        <header className="mb-4 flex items-center gap-2.5">
          <MobileProfileButton />

          <h1 className="m-0 min-w-0 flex-1 truncate text-[0.98rem] font-bold leading-snug text-[#2f241a]">
            {getGreeting()}, <span className="font-extrabold">{firstName}</span> 👋
          </h1>

          <MobileHeaderIcons />
        </header>

        {/* Search → Shop */}
        <form onSubmit={submitSearch} className="mb-4">
          <label className="relative block min-w-0">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.9rem] text-[#9b8876]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-[48px] w-full rounded-full border-0 bg-white pl-11 pr-4 text-[0.8rem] font-semibold text-[#3c2c1f] shadow-[0_4px_16px_rgba(87,58,31,0.06)] outline-none ring-1 ring-[#eadfce] placeholder:text-[#9b8876]"
              placeholder="Search furniture, brands, categories..."
            />
          </label>
        </form>

        {/* Promo banner */}
        <section className="relative mb-5 h-[168px] overflow-hidden rounded-[24px] bg-[#8a5a33] shadow-[0_16px_35px_rgba(121,80,43,0.18)]">
          <img
            src="/product-images/ivory-cloud-sofa-set-main.jpeg.jpeg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#5a3722]/92 via-[#6b4228]/55 to-transparent" />
          <div className="relative z-[1] flex h-full max-w-[62%] flex-col justify-center px-5 py-4 text-white">
            <p className="mb-1 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-white/90">
              Summer Sale
            </p>
            <h2 className="m-0 text-[1.45rem] font-black leading-[1.1]">Up to 40% OFF</h2>
            <p className="mb-3.5 mt-1 text-[0.78rem] font-semibold text-white/90">On selected items</p>
            <Link
              to="/app/shop?deals=1"
              className="inline-flex w-fit min-h-[36px] items-center gap-2 rounded-full bg-white px-4 text-[0.76rem] font-black text-[#6b4228] no-underline"
            >
              Shop Now <i className="fa-solid fa-arrow-right text-[0.68rem]" />
            </Link>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-6">
          <SectionHeader title="Categories" />
          <div className="-mx-4 flex gap-3.5 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {homeCategories.map((category) => (
              <Link
                key={category.value}
                to={`/app/shop?category=${encodeURIComponent(category.value)}`}
                className="w-[64px] shrink-0 text-center no-underline"
              >
                <span className="mb-2 flex h-[58px] w-[58px] items-center justify-center overflow-hidden rounded-[18px] bg-white shadow-sm ring-1 ring-[#eadfce]">
                  <img
                    src={categoryThumbs[category.value]}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="block truncate text-[0.7rem] font-bold text-[#3d2d20]">{category.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <SectionHeader title="Popular Products" to="/app/shop?sort=popular" />
          <ProductRail products={popular} onOpen={openProduct} onToggleWish={handleWish} isWishlisted={isWishlisted} />
        </section>

        <section className="mb-6">
          <SectionHeader title="New Arrivals" to="/app/shop?sort=newest" />
          <ProductRail
            products={newArrivals}
            onOpen={openProduct}
            onToggleWish={handleWish}
            isWishlisted={isWishlisted}
          />
        </section>

        <section className="mb-6">
          <SectionHeader title="Best Sellers" to="/app/shop?sort=rating" />
          <ProductRail
            products={bestSellers}
            onOpen={openProduct}
            onToggleWish={handleWish}
            isWishlisted={isWishlisted}
          />
        </section>

        <section>
          <SectionHeader title="Recommended" to="/app/shop?deals=1" />
          <ProductRail
            products={recommended.length ? recommended : popular}
            onOpen={openProduct}
            onToggleWish={handleWish}
            isWishlisted={isWishlisted}
          />
        </section>
      </main>
      <MobileBottomNav />
    </div>
  );
}
