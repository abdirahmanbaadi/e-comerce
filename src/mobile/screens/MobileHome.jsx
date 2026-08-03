import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { productImage, formatMoney } from '../../utils/format';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../../utils/productFilters';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppBottomSheet } from '../MobileUi';

const roomMeta = {
  'living-room': { icon: 'fa-couch', tone: 'from-[#D7EEE5] to-[#F7FBF8]' },
  bedroom: { icon: 'fa-bed', tone: 'from-[#F5E1D3] to-[#FFF9F4]' },
  'dining-room': { icon: 'fa-utensils', tone: 'from-[#EFE0B8] to-[#FFF9E8]' },
  outdoor: { icon: 'fa-tree', tone: 'from-[#DDEECC] to-[#F7FBEE]' },
  chair: { icon: 'fa-chair', tone: 'from-[#E7D8F3] to-[#FBF7FF]' },
  office: { icon: 'fa-briefcase', tone: 'from-[#D7E6F5] to-[#F7FAFF]' },
};

function discountText(product) {
  if (product?.discount) return String(product.discount).toUpperCase();
  if (!product?.oldPrice || !product?.price) return '';
  const percent = Math.round((1 - Number(product.price) / Number(product.oldPrice)) * 100);
  return percent > 0 ? `${percent}% OFF` : '';
}

function ProductImageStage({ product, className = '', imageClassName = '' }) {
  return (
    <div className={`relative overflow-hidden bg-[#F1E9DD] ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_40%,rgba(255,255,255,0.9),transparent_42%)]" />
      {product ? (
        <img
          src={productImage(product.images?.[0] || product.image)}
          alt=""
          className={`relative z-[1] h-full w-full object-contain ${imageClassName}`}
          loading="lazy"
        />
      ) : (
        <div className="relative z-[1] flex h-full items-center justify-center text-deepGreen/20">
          <i className="fa-solid fa-couch text-4xl" />
        </div>
      )}
    </div>
  );
}

export default function MobileHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, cartCount } = useCart();
  const { products } = useProducts();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const active = useMemo(() => (products || []).filter((product) => product.status !== 'Inactive'), [products]);
  const saleProducts = useMemo(() => active.filter((product) => product.discount || product.oldPrice), [active]);
  const heroProducts = useMemo(() => (saleProducts.length ? saleProducts : active).slice(0, 4), [active, saleProducts]);
  const hero = heroProducts[heroIndex] || heroProducts[0];
  const spotlight = useMemo(() => active.slice(0, 2), [active]);
  const newArrivals = useMemo(() => active.filter((product) => !product.discount).slice(0, 6), [active]);
  const recommended = newArrivals.length ? newArrivals : active.slice(0, 6);
  const firstName = user?.firstName || user?.fullName?.split?.(' ')?.[0] || 'Guest';

  useEffect(() => {
    if (heroProducts.length < 2) return undefined;
    const timer = setInterval(() => setHeroIndex((index) => (index + 1) % heroProducts.length), 4600);
    return () => clearInterval(timer);
  }, [heroProducts.length]);

  const submitSearch = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/app/shop?q=${encodeURIComponent(value)}` : '/app/shop');
  };

  const handleWish = (product) => {
    toggleWishlist?.(product.title);
    showTopFloatNotification('Wishlist updated');
  };

  const handleAdd = (product) => {
    addToCart(product, 1);
    showTopFloatNotification('Added to cart');
  };

  return (
    <div className="min-h-[100dvh] bg-[#F7F3EC] text-[#19231F]">
      <header className="sticky top-0 z-40 bg-[#F7F3EC]/95 px-4 pb-3 pt-[max(0.8rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-black/[0.06] bg-white text-[#19231F] shadow-sm"
            aria-label="Open menu"
          >
            <i className="fa-solid fa-grip-lines text-[1rem]" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-[#A67C35]">
              Welcome, {firstName}
            </p>
            <h1 className="m-0 font-display text-[1.72rem] font-bold leading-none text-deepGreen">MMF Home</h1>
          </div>
          <Link
            to="/app/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-[18px] bg-deepGreen text-white no-underline shadow-[0_10px_20px_rgba(7,61,53,0.2)]"
            aria-label="Cart"
          >
            <i className="fa-solid fa-bag-shopping" />
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[0.62rem] font-extrabold text-deepGreen">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            ) : null}
          </Link>
        </div>
      </header>

      <main className="pb-8">
        <form className="px-4" onSubmit={submitSearch}>
          <label className="relative block">
            <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9F9589]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search sofa, bed, dining..."
              className="min-h-[54px] w-full rounded-[22px] border border-black/[0.06] bg-white pl-11 pr-4 text-[0.92rem] font-semibold text-[#19231F] outline-none shadow-[0_12px_30px_rgba(57,48,39,0.06)] placeholder:text-[#A79D91] focus:border-deepGreen/30"
            />
          </label>
        </form>

        <section className="px-4 pt-4">
          <div className="relative overflow-hidden rounded-[32px] bg-[#173E35] shadow-[0_22px_50px_rgba(7,61,53,0.24)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(216,161,40,0.28),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_45%)]" />
            <div className="relative grid min-h-[330px] grid-rows-[auto_1fr] p-5">
              <div className="z-[2] animate-fadeUp">
                <p className="m-0 text-[0.68rem] font-extrabold uppercase tracking-[0.22em] text-gold">
                  {discountText(hero) || 'New collection'}
                </p>
                <h2 className="mb-2 mt-2 max-w-[14rem] font-display text-[2.35rem] font-bold leading-[0.95] text-white">
                  Make every room feel complete
                </h2>
                <p className="mb-4 max-w-[16rem] text-[0.84rem] font-medium leading-relaxed text-white/68">
                  Premium pieces, clean finishes, and delivery across Mogadishu.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => (hero ? setSelected(hero) : navigate('/app/shop'))}
                    className="min-h-[45px] rounded-2xl border-0 bg-gold px-5 text-[0.83rem] font-extrabold text-deepGreen shadow-[0_14px_28px_rgba(216,161,40,0.28)] active:scale-[0.98]"
                  >
                    Explore
                  </button>
                  <Link
                    to="/app/shop?deals=1"
                    className="inline-flex min-h-[45px] items-center rounded-2xl border border-white/16 bg-white/8 px-4 text-[0.82rem] font-bold text-white no-underline backdrop-blur-md"
                  >
                    Deals
                  </Link>
                </div>
              </div>
              <button
                type="button"
                onClick={() => hero && setSelected(hero)}
                className="relative mt-1 flex items-end justify-end border-0 bg-transparent p-0"
              >
                <div className="absolute bottom-2 right-3 h-44 w-44 rounded-full bg-white/12 blur-xl" />
                {hero ? (
                  <img
                    key={hero.id}
                    src={productImage(hero.images?.[0])}
                    alt=""
                    className="animate-fadeIn relative z-[1] max-h-[205px] w-full object-contain drop-shadow-[0_26px_38px_rgba(0,0,0,0.38)]"
                  />
                ) : (
                  <i className="fa-solid fa-couch text-5xl text-white/20" />
                )}
              </button>
            </div>
            {heroProducts.length > 1 ? (
              <div className="absolute bottom-4 left-5 flex gap-1.5">
                {heroProducts.map((product, index) => (
                  <button
                    key={product.id || index}
                    type="button"
                    aria-label={`Slide ${index + 1}`}
                    onClick={() => setHeroIndex(index)}
                    className={`h-1.5 rounded-full border-0 transition-all ${
                      index === heroIndex ? 'w-7 bg-gold' : 'w-1.5 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="pt-6">
          <div className="mb-3 flex items-center justify-between px-4">
            <h2 className="m-0 text-[1.05rem] font-extrabold text-[#19231F]">Shop by room</h2>
            <Link to="/app/shop" className="text-[0.76rem] font-extrabold text-deepGreen no-underline">
              View all
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {CATEGORY_OPTIONS.map((category, index) => {
              const meta = roomMeta[category.value] || roomMeta['living-room'];
              return (
                <Link
                  key={category.value}
                  to={`/app/shop?category=${encodeURIComponent(category.value)}`}
                  className="animate-railIn w-[104px] shrink-0 overflow-hidden rounded-[24px] border border-black/[0.05] bg-white text-[#19231F] no-underline shadow-[0_10px_24px_rgba(57,48,39,0.06)]"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <span className={`flex h-[74px] items-center justify-center bg-gradient-to-br ${meta.tone}`}>
                    <i className={`fa-solid ${meta.icon} text-[1.35rem] text-deepGreen`} />
                  </span>
                  <span className="block px-3 py-2 text-[0.72rem] font-extrabold leading-tight">{category.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {spotlight.length ? (
          <section className="grid grid-cols-2 gap-3 px-4 pt-6">
            {spotlight.map((product, index) => (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelected(product)}
                className={`animate-fadeUp overflow-hidden rounded-[26px] border-0 p-0 text-left shadow-[0_15px_34px_rgba(57,48,39,0.1)] ${
                  index === 0 ? 'bg-[#E7D8C7]' : 'bg-[#DDE9E2]'
                }`}
                style={{ animationDelay: `${120 + index * 80}ms` }}
              >
                <div className="h-32">
                  <ProductImageStage product={product} className="h-full bg-transparent" imageClassName="p-3" />
                </div>
                <div className="px-3 pb-3 pt-1">
                  <p className="mb-1 mt-0 text-[0.62rem] font-extrabold uppercase tracking-wide text-deepGreen/60">
                    Featured
                  </p>
                  <h3 className="m-0 line-clamp-2 text-[0.82rem] font-extrabold leading-tight text-[#19231F]">
                    {product.title}
                  </h3>
                </div>
              </button>
            ))}
          </section>
        ) : null}

        <section className="pt-7">
          <div className="mb-3 flex items-center justify-between px-4">
            <div>
              <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#A67C35]">Today only</p>
              <h2 className="m-0 text-[1.1rem] font-extrabold text-[#19231F]">Best offers</h2>
            </div>
            <Link to="/app/shop?deals=1" className="text-[0.76rem] font-extrabold text-deepGreen no-underline">
              See all
            </Link>
          </div>
          <div
            className="flex gap-3.5 overflow-x-auto px-4 pb-2 scrollbar-hide"
            style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x mandatory' }}
          >
            {(saleProducts.length ? saleProducts : active).slice(0, 10).map((product, index) => (
              <article
                key={product.id}
                className="animate-railIn w-[205px] shrink-0 overflow-hidden rounded-[26px] border border-black/[0.05] bg-white shadow-[0_16px_38px_rgba(57,48,39,0.09)]"
                style={{ scrollSnapAlign: 'start', animationDelay: `${index * 70}ms` }}
              >
                <button type="button" className="block w-full border-0 bg-transparent p-0 text-left" onClick={() => setSelected(product)}>
                  <div className="relative h-[170px]">
                    <ProductImageStage product={product} className="h-full" imageClassName="p-4" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleWish(product);
                      }}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-0 bg-white/92 text-[#7D7468] shadow-sm"
                      aria-label="Wishlist"
                    >
                      <i className={`${isWishlisted?.(product.title) ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart`} />
                    </button>
                    {discountText(product) ? (
                      <span className="absolute left-3 top-3 rounded-full bg-deepGreen px-2.5 py-1 text-[0.64rem] font-extrabold text-white">
                        {discountText(product)}
                      </span>
                    ) : null}
                  </div>
                  <div className="px-3.5 pb-4 pt-3">
                    <p className="m-0 text-[0.64rem] font-extrabold uppercase tracking-wide text-[#A67C35]">
                      {getCategoryLabel(product.category)}
                    </p>
                    <h3 className="m-0 mt-1 line-clamp-2 min-h-[2.45em] text-[0.9rem] font-extrabold leading-snug text-[#19231F]">
                      {product.title}
                    </h3>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="text-[1.05rem] font-extrabold text-deepGreen">{formatMoney(product.price)}</span>
                      {product.oldPrice ? (
                        <span className="text-[0.75rem] font-semibold text-[#A9A197] line-through">{formatMoney(product.oldPrice)}</span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pt-7">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#A67C35]">Selected for you</p>
              <h2 className="m-0 text-[1.1rem] font-extrabold text-[#19231F]">Fresh arrivals</h2>
            </div>
            <Link to="/app/shop" className="text-[0.76rem] font-extrabold text-deepGreen no-underline">
              Shop all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {recommended.map((product, index) => (
              <article
                key={product.id}
                className="animate-fadeUp overflow-hidden rounded-[24px] border border-black/[0.05] bg-white shadow-[0_12px_28px_rgba(57,48,39,0.07)]"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <button type="button" onClick={() => setSelected(product)} className="block w-full border-0 bg-transparent p-0 text-left">
                  <div className="h-[145px]">
                    <ProductImageStage product={product} className="h-full" imageClassName="p-4" />
                  </div>
                  <div className="px-3 pb-3 pt-2">
                    <h3 className="m-0 line-clamp-2 min-h-[2.35em] text-[0.78rem] font-extrabold leading-snug text-[#19231F]">
                      {product.title}
                    </h3>
                    <p className="mb-0 mt-1 text-[0.92rem] font-extrabold text-deepGreen">{formatMoney(product.price)}</p>
                  </div>
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-4 mt-7 overflow-hidden rounded-[28px] bg-[#19231F] p-5 shadow-[0_18px_40px_rgba(25,35,31,0.22)]">
          <p className="m-0 text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-gold">Delivery confidence</p>
          <h2 className="mb-1 mt-1 font-display text-[1.55rem] font-bold leading-tight text-white">Track, scan, receive.</h2>
          <p className="mb-4 text-[0.82rem] font-medium leading-relaxed text-white/62">
            Live order tracking with QR confirmation at delivery.
          </p>
          <Link to="/app/orders" className="inline-flex min-h-[44px] items-center rounded-2xl bg-white px-4 text-[0.82rem] font-extrabold text-deepGreen no-underline">
            View orders
          </Link>
        </section>
      </main>

      <AppBottomSheet
        open={Boolean(selected)}
        title={selected?.title || 'Product'}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleWish(selected)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-deepGreen/15 bg-[#F4EFE6] text-deepGreen"
                aria-label="Wishlist"
              >
                <i className={`${isWishlisted?.(selected.title) ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart`} />
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAdd(selected);
                  setSelected(null);
                }}
                className="flex h-12 flex-1 items-center justify-center rounded-2xl border-0 bg-deepGreen text-[0.92rem] font-extrabold text-white"
              >
                Add · {formatMoney(selected.price)}
              </button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <ProductImageStage product={selected} className="h-64 rounded-2xl" imageClassName="p-6" />
            <div className="flex items-baseline gap-2">
              <span className="text-[1.25rem] font-extrabold text-deepGreen">{formatMoney(selected.price)}</span>
              {selected.oldPrice ? (
                <span className="text-[0.9rem] text-[#A9A197] line-through">{formatMoney(selected.oldPrice)}</span>
              ) : null}
            </div>
            {discountText(selected) ? (
              <span className="inline-flex rounded-full bg-deepGreen/10 px-2.5 py-1 text-[0.72rem] font-extrabold text-deepGreen">
                {discountText(selected)}
              </span>
            ) : null}
            <p className="m-0 text-[0.88rem] leading-relaxed text-[#5E574F]">{selected.description || selected.category}</p>
          </div>
        ) : null}
      </AppBottomSheet>
    </div>
  );
}
