import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import MobileBottomNav from '../MobileBottomNav';
import MobileHeaderIcons from '../MobileHeaderIcons';

const categories = [
  { value: 'all', label: 'All', icon: 'fa-border-all' },
  { value: 'living-room', label: 'Sofa', icon: 'fa-couch' },
  { value: 'chair', label: 'Chair', icon: 'fa-chair' },
  { value: 'dining-room', label: 'Table', icon: 'fa-utensils' },
  { value: 'bedroom', label: 'Bed', icon: 'fa-bed' },
  { value: 'office', label: 'Cabinet', icon: 'fa-box-archive' },
  { value: 'outdoor', label: 'Outdoor', icon: 'fa-tree' },
];

const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'low-price', label: 'Price: Low to High' },
  { value: 'high-price', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
];

const ratingOptions = [
  { value: 'all', label: 'All' },
  { value: '5', label: '5' },
  { value: '4', label: '4 & up' },
  { value: '3', label: '3 & up' },
  { value: '2', label: '2 & up' },
];

const colorOptions = [
  { value: 'all', label: 'All', swatch: '#fffaf3' },
  { value: 'beige', label: 'Beige', swatch: '#d7b996' },
  { value: 'brown', label: 'Brown', swatch: '#8a5a33' },
  { value: 'white', label: 'White', swatch: '#f8f4ec' },
  { value: 'black', label: 'Black', swatch: '#1f1d1a' },
  { value: 'green', label: 'Green', swatch: '#66745a' },
];

function getBrand(product) {
  return product.brand || product.brandName || product.materialLabel || product.label || 'MMF';
}

function Rating({ value }) {
  return (
    <div className="flex items-center gap-1 text-[0.68rem] font-bold text-[#8a7865]">
      <span className="text-[#f2a324]">★</span>
      <span>{Number(value || 4.8).toFixed(1)}</span>
    </div>
  );
}

function ShopProductCard({ product, view, onAdd, onOpen, onToggleWish, wishlisted }) {
  const image = productImage(product?.images?.[0] || product?.image);
  const discount = product.discount || '';

  if (view === 'list') {
    return (
      <article
        className="flex cursor-pointer gap-3 rounded-[16px] bg-white p-2 shadow-[0_10px_24px_rgba(111,77,43,0.08)] ring-1 ring-[#eadfce]"
        onClick={() => onOpen(product)}
      >
        <div className="relative h-[104px] w-[112px] shrink-0 overflow-hidden rounded-[13px] bg-[#f2e7d9]">
          {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
          {discount ? (
            <span className="absolute left-1.5 top-1.5 rounded bg-[#9a6a43] px-1.5 py-0.5 text-[0.56rem] font-black text-white">
              {discount}
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 py-1">
          <div className="flex items-start gap-2">
            <h3 className="m-0 line-clamp-2 flex-1 text-[0.82rem] font-black leading-snug text-[#2f241a]">
              {product.title}
            </h3>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleWish(product);
              }}
              className="shrink-0 border-0 bg-transparent p-1 text-[#8b8178]"
              aria-label="Wishlist"
            >
              <i
                className={`fa-heart text-[1rem] ${
                  wishlisted ? 'fa-solid text-[#e11d48]' : 'fa-regular'
                }`}
              />
            </button>
          </div>
          <p className="mb-1 mt-2 text-[0.82rem] font-black text-[#2f241a]">{formatMoney(product.price)}</p>
          <Rating value={product.rating} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(product);
            }}
            className="mt-2 rounded-full border-0 bg-[#eadfce] px-3 py-1.5 text-[0.68rem] font-black text-[#7b4a28]"
          >
            Add to cart
          </button>
        </div>
      </article>
    );
  }

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-[16px] bg-white shadow-[0_10px_24px_rgba(111,77,43,0.08)] ring-1 ring-[#eadfce]"
      onClick={() => onOpen(product)}
    >
      <div className="relative h-[138px] bg-[#f2e7d9]">
        {image ? <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" /> : null}
        {discount ? (
          <span className="absolute left-2 top-2 rounded bg-[#9a6a43] px-2 py-1 text-[0.58rem] font-black text-white">
            {discount}
          </span>
        ) : null}
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleWish(product);
          }}
          className="absolute right-1.5 top-1.5 border-0 bg-transparent p-1"
          aria-label="Wishlist"
        >
          <i
            className={`fa-heart text-[1.12rem] drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] ${
              wishlisted ? 'fa-solid text-[#e11d48]' : 'fa-regular text-white'
            }`}
          />
        </button>
      </div>
      <div className="px-3 py-3">
        <h3 className="m-0 line-clamp-1 text-[0.78rem] font-black text-[#2f241a]">{product.title}</h3>
        <div className="mt-1 flex items-baseline gap-1.5">
          <p className="m-0 text-[0.8rem] font-black text-[#2f241a]">{formatMoney(product.price)}</p>
          {product.oldPrice ? (
            <span className="text-[0.64rem] font-bold text-[#a69a8d] line-through">
              {formatMoney(product.oldPrice)}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between">
          <Rating value={product.rating} />
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onAdd(product);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border-0 bg-[#eadfce] text-[#7b4a28]"
            aria-label="Add to cart"
          >
            <i className="fa-solid fa-cart-shopping text-[0.72rem]" />
          </button>
        </div>
      </div>
    </article>
  );
}

export default function MobileShop() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();

  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState(params.get('category') || 'all');
  const [sortBy, setSortBy] = useState(params.get('sort') || 'popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [ratingMin, setRatingMin] = useState('all');
  const [selectedColor, setSelectedColor] = useState('all');

  useEffect(() => {
    setQuery(params.get('q') || '');
    setCategory(params.get('category') || 'all');
    const nextSort = params.get('sort');
    if (nextSort && sortOptions.some((option) => option.value === nextSort)) {
      setSortBy(nextSort);
    }
  }, [params]);

  const activeProducts = useMemo(
    () => (products || []).filter((product) => product.status !== 'Inactive'),
    [products]
  );
  const priceCeiling = useMemo(
    () => Math.max(1000, ...activeProducts.map((product) => Number(product.price || 0))),
    [activeProducts]
  );
  const brands = useMemo(
    () => ['all', ...new Set(activeProducts.map(getBrand).filter(Boolean))].slice(0, 8),
    [activeProducts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
      const min = priceMin;
      const max = priceMax || priceCeiling;
    let list = activeProducts.filter((product) => {
      const matchesQuery =
        !q ||
        product.title?.toLowerCase().includes(q) ||
        product.label?.toLowerCase().includes(q) ||
        product.category?.toLowerCase().includes(q);
      const matchesCategory = category === 'all' || product.category === category;
      const matchesBrand = selectedBrand === 'all' || getBrand(product) === selectedBrand;
      const price = Number(product.price || 0);
      const matchesPrice = price >= min && price <= max;
      const matchesRating = ratingMin === 'all' || Number(product.rating || 4.8) >= Number(ratingMin);
      const productColor = String(product.color || '').toLowerCase();
      const matchesColor = selectedColor === 'all' || productColor.includes(selectedColor);
      return matchesQuery && matchesCategory && matchesBrand && matchesPrice && matchesRating && matchesColor;
    });

    if (params.get('deals') === '1') {
      list = list.filter((product) => product.discount || product.oldPrice);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'newest') return Number(b.isNewest) - Number(a.isNewest);
      if (sortBy === 'low-price') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'high-price') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'rating') return Number(b.rating || 4.8) - Number(a.rating || 4.8);
      return Number(b.popularity || 0) - Number(a.popularity || 0);
    });
  }, [activeProducts, category, params, priceCeiling, priceMax, priceMin, query, ratingMin, selectedBrand, selectedColor, sortBy]);

  const resetFilters = () => {
    setCategory('all');
    setSelectedBrand('all');
    setPriceMin(0);
    setPriceMax(0);
    setSortBy('popular');
    setQuery('');
    setRatingMin('all');
    setSelectedColor('all');
    navigate('/app/shop', { replace: true });
  };

  const setCategoryFilter = (value) => {
    setCategory(value);
    const next = new URLSearchParams(params);
    if (value === 'all') next.delete('category');
    else next.set('category', value);
    const search = next.toString();
    navigate({ pathname: '/app/shop', search: search ? `?${search}` : '' }, { replace: true });
  };

  const view = 'grid';
  const showCategoryClear = category !== 'all';
  const activeMaxPrice = priceMax || priceCeiling;
  const minPricePercent = priceCeiling ? Math.min(100, Math.max(0, (priceMin / priceCeiling) * 100)) : 0;
  const maxPricePercent = priceCeiling ? Math.min(100, Math.max(0, (activeMaxPrice / priceCeiling) * 100)) : 100;

  const handleAdd = (product) => {
    const added = addToCart(product, 1);
    if (added) showTopFloatNotification('Added to cart');
    else showTopFloatNotification('Could not add this item to cart', 'danger');
  };

  const openProduct = (product) => {
    navigate(`/app/product/${product.id}`);
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] pb-[calc(8.5rem+env(safe-area-inset-bottom))] font-sans text-[#2f241a]">
      <main className="mx-auto max-w-md px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="mb-3 flex items-center justify-between">
          <div>
            <h1 className="m-0 font-display text-[1.8rem] font-bold leading-none text-[#2f241a]">Shop</h1>
            <p className="mb-0 mt-1 text-[0.7rem] font-semibold text-[#9b8876]">
              Find the best furniture for your space
            </p>
          </div>
          <MobileHeaderIcons />
        </header>

        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border-0 bg-white px-3 text-[0.72rem] font-black text-[#5f4630] shadow-sm ring-1 ring-[#eadfce]"
          >
            <i className="fa-solid fa-sliders" /> Filter
          </button>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white px-3 text-[0.72rem] font-black text-[#5f4630] shadow-sm ring-1 ring-[#eadfce]">
            Sort by
            <select
              value={sortBy}
              onChange={(event) => {
                const value = event.target.value;
                setSortBy(value);
                const next = new URLSearchParams(params);
                if (value === 'popular') next.delete('sort');
                else next.set('sort', value);
                const search = next.toString();
                navigate({ pathname: '/app/shop', search: search ? `?${search}` : '' }, { replace: true });
              }}
              className="min-w-0 flex-1 border-0 bg-transparent text-[0.72rem] font-black outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="relative mb-3 block">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9b8876]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-11 w-full rounded-2xl border-0 bg-white pl-11 pr-4 text-[0.78rem] font-semibold text-[#3c2c1f] shadow-sm outline-none ring-1 ring-[#eadfce] placeholder:text-[#9b8876]"
            placeholder="Search products..."
          />
        </label>

        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
          {categories.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setCategoryFilter(item.value)}
              className={`shrink-0 rounded-xl border-0 px-3 py-2 text-[0.68rem] font-black ${
                category === item.value ? 'bg-[#7b4a28] text-white' : 'bg-white text-[#5f4630] ring-1 ring-[#eadfce]'
              }`}
            >
              {item.label === 'All' ? 'All Products' : item.label}
            </button>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between">
          <p className="m-0 text-[0.72rem] font-black text-[#5f4630]">{filtered.length} Products found</p>
          {showCategoryClear ? (
            <button type="button" onClick={() => setCategoryFilter('all')} className="border-0 bg-transparent text-[0.68rem] font-bold text-[#8a5a33]">
              Clear All x
            </button>
          ) : null}
        </div>

        {filtered.length ? (
          <section className={view === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
            {filtered.map((product) => (
              <ShopProductCard
                key={product.id || product.title}
                product={product}
                view={view}
                onAdd={handleAdd}
                onOpen={openProduct}
                onToggleWish={(item) => {
                  const wasWishlisted = isWishlisted?.(item.title);
                  toggleWishlist?.(item.title);
                  showTopFloatNotification(wasWishlisted ? 'Removed from wishlist' : 'Saved to wishlist');
                }}
                wishlisted={isWishlisted?.(product.title)}
              />
            ))}
          </section>
        ) : (
          <section className="rounded-[22px] bg-white px-5 py-12 text-center shadow-sm ring-1 ring-[#eadfce]">
            <i className="fa-solid fa-magnifying-glass mb-3 text-3xl text-[#d8c8b6]" />
            <h2 className="m-0 text-[1.05rem] font-black">No products found</h2>
            <p className="mb-0 mt-2 text-[0.8rem] font-semibold text-[#8b8178]">
              Try another search or reset your filters.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-full border-0 bg-[#111111] px-5 py-2.5 text-[0.78rem] font-black text-white"
            >
              Reset filters
            </button>
          </section>
        )}
      </main>

      {filterOpen ? (
        <div className="fixed inset-0 z-[80] bg-black/35 backdrop-blur-[2px]" role="presentation" onClick={() => setFilterOpen(false)}>
          <aside
            className="mmf-sheet absolute bottom-0 left-0 right-0 mx-auto flex max-h-[88dvh] max-w-md flex-col overflow-hidden rounded-t-[30px] bg-white shadow-[0_-24px_70px_rgba(0,0,0,0.24)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-[1] border-b border-[#f0ece7] bg-white/98 px-4 pb-3 pt-3 backdrop-blur-xl">
              <div className="mx-auto mb-3 h-1 w-11 rounded-full bg-[#d8c8b6]" />
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <span aria-hidden="true" />
                <h2 className="m-0 text-center text-[1rem] font-black text-[#111111]">Sort &amp; Filter</h2>
                <p className="mb-0 justify-self-end text-[0.66rem] font-semibold text-[#8b8178]">
                  {filtered.length} Products found
                </p>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
              <section className="border-b border-[#f0ece7] pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="m-0 text-[0.84rem] font-black text-[#2f241a]">Categories</h3>
                  <i className="fa-solid fa-chevron-up text-[0.65rem] text-[#9b8876]" />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {categories.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setCategoryFilter(item.value)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-[0.72rem] font-black ${
                        category === item.value
                          ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-[#d7d0c7] bg-white text-[#2f241a]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </section>

              <section className="border-b border-[#f0ece7] pb-4">
                <div className="relative mt-2 px-1 pb-2 pt-6">
                  <div className="absolute left-1 right-1 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#e8e2dc]" />
                  <div
                    className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[#111111]"
                    style={{
                      left: `${minPricePercent}%`,
                      width: `${Math.max(0, maxPricePercent - minPricePercent)}%`,
                    }}
                  />
                  <input
                    type="range"
                    min="0"
                    max={priceCeiling}
                    step="10"
                    value={priceMin}
                    onChange={(event) => setPriceMin(Math.min(Number(event.target.value), activeMaxPrice))}
                    className="mmf-range-input absolute inset-x-0 top-0 z-[3] h-8 w-full"
                    aria-label="Minimum price"
                  />
                  <input
                    type="range"
                    min="0"
                    max={priceCeiling}
                    step="10"
                    value={activeMaxPrice}
                    onChange={(event) => setPriceMax(Math.max(Number(event.target.value), priceMin))}
                    className="mmf-range-input absolute inset-x-0 top-0 z-[4] h-8 w-full"
                    aria-label="Maximum price"
                  />
                </div>
                <div className="mt-2 flex justify-between text-[0.66rem] font-black text-[#9b8876]">
                  <span>{formatMoney(priceMin)}</span>
                  <span>{formatMoney(activeMaxPrice)}</span>
                </div>
              </section>

              <section className="border-b border-[#f0ece7] pb-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="m-0 text-[0.84rem] font-black text-[#2f241a]">Brand</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {brands.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand(brand)}
                      className={`rounded-lg border px-3 py-1.5 text-[0.68rem] font-black ${
                        selectedBrand === brand
                        ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-[#eadfce] bg-white text-[#5f4630]'
                      }`}
                    >
                      {brand === 'all' ? 'All' : brand}
                    </button>
                  ))}
                </div>
              </section>

              <section className="border-b border-[#f0ece7] pb-4">
                <h3 className="mb-3 text-[0.84rem] font-black text-[#2f241a]">Rating</h3>
                <div className="flex flex-wrap gap-2">
                  {ratingOptions.map((rating) => (
                    <button
                      key={rating.value}
                      type="button"
                      onClick={() => setRatingMin(rating.value)}
                      className={`rounded-lg border px-3 py-1.5 text-[0.68rem] font-black ${
                        ratingMin === rating.value
                        ? 'border-[#111111] bg-[#111111] text-white'
                          : 'border-[#eadfce] bg-white text-[#5f4630]'
                      }`}
                    >
                      {rating.value === 'all' ? 'All' : `★ ${rating.label}`}
                    </button>
                  ))}
                </div>
              </section>

              <section className="pb-2">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="m-0 text-[0.84rem] font-black text-[#2f241a]">Color</h3>
                </div>
                <div className="flex items-center gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                        selectedColor === color.value ? 'border-[#7b4a28] ring-2 ring-[#7b4a28]/20' : 'border-[#eadfce]'
                      }`}
                      style={{ backgroundColor: color.swatch }}
                      aria-label={color.label}
                    >
                      {color.value === 'all' ? (
                        <span className="text-[0.65rem] font-black text-[#7b4a28]">All</span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="sticky bottom-0 border-t border-[#f0ece7] bg-white/98 px-4 py-3 pb-[max(0.85rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex min-h-[50px] items-center justify-center rounded-full border-0 bg-[#f3f0ed] text-[0.86rem] font-black text-[#5f5750]"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="flex min-h-[50px] items-center justify-center rounded-full border-0 bg-[#111111] text-[0.86rem] font-black text-white shadow-[0_10px_24px_rgba(0,0,0,0.16)]"
                >
                  Apply
                </button>
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      <MobileBottomNav />
    </div>
  );
}
