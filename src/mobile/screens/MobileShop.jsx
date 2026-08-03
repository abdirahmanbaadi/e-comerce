import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { productImage, formatMoney } from '../../utils/format';
import { CATEGORY_OPTIONS, getCategoryLabel } from '../../utils/productFilters';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppTopBar, AppProductCard, AppBottomSheet, AppHScroll } from '../MobileUi';

export default function MobileShop() {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [selected, setSelected] = useState(null);
  const category = params.get('category') || '';
  const dealsOnly = params.get('deals') === '1';

  useEffect(() => {
    setQuery(params.get('q') || '');
  }, [params]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products || [])
      .filter((p) => p.status !== 'Inactive')
      .filter((p) => (category ? p.category === category : true))
      .filter((p) => (dealsOnly ? Boolean(p.discount && p.oldPrice) : true))
      .filter((p) => {
        if (!q) return true;
        return (
          String(p.title || '').toLowerCase().includes(q) ||
          String(p.category || '').toLowerCase().includes(q) ||
          String(p.label || '').toLowerCase().includes(q)
        );
      });
  }, [products, query, category, dealsOnly]);

  const handleAdd = (product) => {
    addToCart(product, 1);
    showTopFloatNotification('Added to cart');
  };

  const setCategory = (value) => {
    const next = new URLSearchParams(params);
    if (value) next.set('category', value);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  return (
    <div className="animate-cardRise bg-white">
      <AppTopBar
        title={dealsOnly ? 'Deals' : 'Categories'}
        subtitle={category ? getCategoryLabel(category) : `${list.length} pieces`}
      />
      <div className="px-4 pb-6 pt-3">
        <label className="relative mb-3 block">
          <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9a9388]" />
          <input
            value={query}
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);
              const next = new URLSearchParams(params);
              if (v.trim()) next.set('q', v.trim());
              else next.delete('q');
              setParams(next, { replace: true });
            }}
            placeholder="Search sofas, beds, chairs…"
            className="min-h-[48px] w-full rounded-2xl border-0 bg-[#F4F2ED] py-3 pl-10 pr-4 text-[0.9rem] font-semibold outline-none focus:ring-2 focus:ring-deepGreen/15"
          />
        </label>

        <div className="mb-4">
          <AppHScroll className="!mx-0 !px-0">
            <button
              type="button"
              onClick={() => setCategory('')}
              className={`shrink-0 rounded-full border-0 px-3.5 py-2 text-[0.75rem] font-extrabold ${
                !category ? 'bg-deepGreen text-white' : 'bg-[#F4F2ED] text-[#555]'
              }`}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`shrink-0 rounded-full border-0 px-3.5 py-2 text-[0.75rem] font-extrabold ${
                  category === cat.value ? 'bg-deepGreen text-white' : 'bg-[#F4F2ED] text-[#555]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </AppHScroll>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {list.map((product) => (
            <AppProductCard key={product.id} product={product} onOpen={setSelected} onAdd={handleAdd} />
          ))}
          {list.length === 0 && (
            <p className="rounded-2xl bg-[#F7F4EE] px-4 py-10 text-center text-[0.88rem] font-semibold text-[#888]">
              No products found
            </p>
          )}
        </div>
      </div>

      <AppBottomSheet
        open={Boolean(selected)}
        title={selected?.title || 'Product'}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <div className="flex gap-2">
              <button
                type="button"
                className="flex h-[52px] w-12 items-center justify-center rounded-2xl border border-deepGreen/15 bg-white text-deepGreen"
                onClick={() => {
                  toggleWishlist?.(selected.title);
                  showTopFloatNotification('Wishlist updated');
                }}
                aria-label="Wishlist"
              >
                <i className={`${isWishlisted?.(selected.title) ? 'fa-solid text-red-500' : 'fa-regular'} fa-heart`} />
              </button>
              <button
                type="button"
                className="flex min-h-[52px] flex-1 items-center justify-center rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.95rem] font-extrabold text-white"
                onClick={() => {
                  handleAdd(selected);
                  setSelected(null);
                }}
              >
                Add · {formatMoney(selected.price)}
              </button>
            </div>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-[#F3F1EC]">
              <img src={productImage(selected.images?.[0])} alt="" className="h-56 w-full object-contain p-4" />
            </div>
            <p className="m-0 text-[0.9rem] leading-relaxed text-[#555]">{selected.description || selected.category}</p>
            {selected.discount ? (
              <span className="inline-flex rounded-full bg-[#E8F3EF] px-2.5 py-1 text-[0.72rem] font-extrabold text-teal">
                {selected.discount}
              </span>
            ) : null}
          </div>
        )}
      </AppBottomSheet>
    </div>
  );
}
