import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { productImage, formatMoney } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import { AppTopBar, AppBottomSheet } from '../MobileUi';

export default function MobileWishlist() {
  const { products } = useProducts();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [selected, setSelected] = useState(null);

  const items = useMemo(() => {
    const titles = Object.keys(wishlist || {}).filter((t) => wishlist[t]);
    return (products || []).filter((p) => titles.includes(p.title) && p.status !== 'Inactive');
  }, [products, wishlist]);

  return (
    <div className="animate-cardRise bg-white">
      <AppTopBar title="Wishlist" subtitle={`${items.length} saved`} />
      <main className="space-y-3 px-4 pb-8 pt-4">
        {items.length === 0 ? (
          <div className="rounded-[24px] bg-[#F7F4EE] px-5 py-12 text-center">
            <i className="fa-regular fa-heart mb-3 text-3xl text-[#cfc7bb]" />
            <p className="m-0 text-[1rem] font-extrabold text-deepGreen">No favorites yet</p>
            <Link
              to="/app/shop"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-2xl bg-deepGreen px-5 text-[0.86rem] font-extrabold text-white no-underline"
            >
              Browse shop
            </Link>
          </div>
        ) : (
          items.map((product) => (
            <article
              key={product.id}
              className="flex gap-3 overflow-hidden rounded-[20px] border border-black/[0.04] bg-white p-2.5 shadow-sm"
            >
              <button
                type="button"
                className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-0 bg-[#F3F1EC] p-0"
                onClick={() => setSelected(product)}
              >
                <img src={productImage(product.images?.[0])} alt="" className="h-full w-full object-contain p-2" />
              </button>
              <div className="min-w-0 flex-1 py-1 pr-1">
                <h3 className="m-0 line-clamp-2 text-[0.88rem] font-extrabold text-[#1a2e28]">{product.title}</h3>
                <p className="mb-2 mt-1 text-[0.95rem] font-black text-deepGreen">{formatMoney(product.price)}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="min-h-[36px] flex-1 rounded-xl border-0 bg-deepGreen text-[0.75rem] font-extrabold text-white"
                    onClick={() => {
                      addToCart(product, 1);
                      showTopFloatNotification('Added to cart');
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border-0 bg-[#F4EFE6] text-red-500"
                    onClick={() => toggleWishlist(product.title)}
                    aria-label="Remove"
                  >
                    <i className="fa-solid fa-heart" />
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </main>

      <AppBottomSheet
        open={Boolean(selected)}
        title={selected?.title || 'Product'}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <button
              type="button"
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl border-0 bg-gradient-to-br from-deepGreen to-teal text-[0.95rem] font-extrabold text-white"
              onClick={() => {
                addToCart(selected, 1);
                showTopFloatNotification('Added to cart');
                setSelected(null);
              }}
            >
              Add · {formatMoney(selected.price)}
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="overflow-hidden rounded-2xl bg-[#F3F1EC]">
            <img src={productImage(selected.images?.[0])} alt="" className="h-56 w-full object-contain p-4" />
          </div>
        )}
      </AppBottomSheet>
    </div>
  );
}
