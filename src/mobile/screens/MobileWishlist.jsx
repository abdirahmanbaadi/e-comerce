import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';
import MobileBottomNav from '../MobileBottomNav';
import { buildMockWishlistItems } from '../mockWishlist';

const DELETE_WIDTH = 72;

const categoryNames = {
  'living-room': 'Living Room',
  bedroom: 'Bedroom',
  'dining-room': 'Dining Room',
  outdoor: 'Outdoor',
  chair: 'Chair',
  office: 'Office',
};

function SwipeWishlistItem({ item, openId, setOpenId, onAddToCart, onRemove }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axis = useRef(null);
  const liveX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();

  const isOpen = openId === item.id;
  const typeLabel =
    item.label || item.categoryLabel || categoryNames[item.category] || item.category || 'Furniture';

  useEffect(() => {
    if (!dragging) {
      const next = isOpen ? DELETE_WIDTH : 0;
      liveX.current = next;
      setOffset(next);
    }
  }, [isOpen, dragging]);

  useEffect(() => {
    const node = rowRef.current;
    if (!node) return undefined;

    let pointerId = null;

    const onPointerDown = (event) => {
      if (event.target.closest('button')) return;
      pointerId = event.pointerId;
      node.setPointerCapture(event.pointerId);
      startX.current = event.clientX;
      startY.current = event.clientY;
      startOffset.current = openId === item.id ? DELETE_WIDTH : 0;
      axis.current = null;
      liveX.current = startOffset.current;
      setDragging(true);
    };

    const onPointerMove = (event) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX.current;
      const dy = event.clientY - startY.current;

      if (axis.current == null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (axis.current === 'y') {
          try {
            node.releasePointerCapture(event.pointerId);
          } catch {
            /* ignore */
          }
          pointerId = null;
          setDragging(false);
          return;
        }
      }

      if (axis.current !== 'x') return;
      event.preventDefault();
      const next = Math.max(0, Math.min(DELETE_WIDTH, startOffset.current + dx));
      liveX.current = next;
      setOffset(next);
    };

    const finish = (event) => {
      if (pointerId != null && event.pointerId !== pointerId) return;
      if (axis.current === 'x') {
        const shouldOpen = liveX.current > DELETE_WIDTH * 0.4;
        setOpenId(shouldOpen ? item.id : null);
        liveX.current = shouldOpen ? DELETE_WIDTH : 0;
        setOffset(liveX.current);
      }
      axis.current = null;
      pointerId = null;
      setDragging(false);
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', finish);
    node.addEventListener('pointercancel', finish);

    return () => {
      node.removeEventListener('pointerdown', onPointerDown);
      node.removeEventListener('pointermove', onPointerMove);
      node.removeEventListener('pointerup', finish);
      node.removeEventListener('pointercancel', finish);
    };
  }, [item.id, openId, setOpenId]);

  return (
    <div className="relative overflow-hidden rounded-[22px]">
      <button
        type="button"
        onClick={() => onRemove(item.title)}
        className="absolute inset-y-0 left-0 z-0 flex w-[72px] items-center justify-center border-0 bg-[#fdecec] text-[#e11d48]"
        aria-label="Remove from wishlist"
      >
        <i className="fa-solid fa-trash-can text-[1rem]" />
      </button>

      <article
        ref={rowRef}
        className="relative z-10 flex items-center gap-3 rounded-[22px] bg-white p-3 shadow-[0_10px_26px_rgba(67,45,28,0.07)] ring-1 ring-[#f0e9df]"
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          transition: dragging ? 'none' : 'transform 0.22s ease-out',
          touchAction: 'pan-y',
          userSelect: 'none',
        }}
        onClick={() => {
          if (isOpen || dragging) return;
          navigate(`/app/product/${item.id}`);
        }}
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f4eee7]">
          <img src={productImage(item.image || item.images?.[0])} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 line-clamp-1 text-[0.9rem] font-black text-[#111111]">{item.title}</h2>
          <p className="mb-2 mt-1 line-clamp-1 text-[0.68rem] font-semibold text-[#8b8178]">{typeLabel}</p>
          <p className="m-0 text-[0.88rem] font-black">{formatMoney(item.price)}</p>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onAddToCart(item);
          }}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-[#14324a] text-white shadow-sm"
          aria-label="Add to cart"
        >
          <i className="fa-solid fa-bag-shopping text-[0.82rem]" />
        </button>
      </article>
    </div>
  );
}

export default function MobileWishlist({ fromProfile = false } = {}) {
  const navigate = useNavigate();
  const { products } = useProducts();
  const { addToCart } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();
  const [openId, setOpenId] = useState(null);
  const [mockHidden, setMockHidden] = useState(() => new Set());

  const realItems = useMemo(() => {
    const titles = Object.keys(wishlist || {}).filter((title) => wishlist[title]);
    return titles
      .map((title) => (products || []).find((product) => product.title === title && product.status !== 'Inactive'))
      .filter(Boolean);
  }, [wishlist, products]);

  const usingMock = realItems.length === 0;

  const wishlistItems = useMemo(() => {
    if (!usingMock) return realItems;
    return buildMockWishlistItems(products).filter((item) => !mockHidden.has(item.title));
  }, [usingMock, realItems, products, mockHidden]);

  const handleAddToCart = (product) => {
    const added = addToCart(product, 1);
    if (added) showTopFloatNotification('Added to cart');
    else showTopFloatNotification('Could not add this item to cart', 'danger');
  };

  const handleRemove = (title) => {
    setOpenId(null);
    if (usingMock) {
      setMockHidden((prev) => new Set(prev).add(title));
      showTopFloatNotification('Removed from preview wishlist');
      return;
    }
    removeFromWishlist(title);
    showTopFloatNotification('Removed from wishlist');
  };

  return (
    <div
      className={`mmf-pwa min-h-[100dvh] bg-[#fff7ed] font-sans text-[#111111] ${
        fromProfile
          ? 'pb-[max(2rem,env(safe-area-inset-bottom))]'
          : 'pb-[calc(8.5rem+env(safe-area-inset-bottom))]'
      }`}
    >
      <div className="mx-auto min-h-[100dvh] w-full max-w-md">
      <header className="sticky top-0 z-20 border-b border-[#f0e9df] bg-[#fff7ed] px-4 py-3 pt-[max(0.7rem,env(safe-area-inset-top))]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(fromProfile ? '/app/profile' : -1)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-0 bg-white text-[#2f241a] shadow-sm"
            aria-label={fromProfile ? 'Back to profile' : 'Back'}
          >
            <i className="fa-solid fa-chevron-left text-[0.85rem]" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="m-0 text-[1.1rem] font-black text-[#2f241a]">
              {fromProfile ? 'Wishlist' : 'My Wishlist'}
            </h1>
            <p className="mb-0 mt-0.5 text-[0.78rem] font-semibold text-[#8b8178]">
              {wishlistItems.length
                ? `${wishlistItems.length} saved item${wishlistItems.length === 1 ? '' : 's'}`
                : 'Saved furniture'}
            </p>
          </div>
          <span className="h-10 w-10 shrink-0" aria-hidden="true" />
        </div>
      </header>

      <main className="px-4 pb-4 pt-4">
        {usingMock && wishlistItems.length > 0 ? (
          <p className="mb-3 mt-0 text-[0.74rem] font-bold text-[#9a5b12]">
            Preview data — sample wishlist for UI testing
          </p>
        ) : null}

        {!wishlistItems.length ? (
          <section className="px-2 py-16 text-center">
            <i className="fa-regular fa-heart mb-4 text-4xl text-[#d8c8b6]" />
            <h2 className="m-0 text-[1.2rem] font-black text-[#1c140e]">Your wishlist is empty</h2>
            <p className="mx-auto mb-0 mt-2 max-w-xs text-[0.85rem] font-semibold leading-relaxed text-[#8b8178]">
              Save furniture you like and add it to cart anytime.
            </p>
            <Link
              to="/app/shop"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#6b4228] px-6 text-[0.86rem] font-black text-white no-underline"
            >
              Go to Shop
            </Link>
          </section>
        ) : (
          <section className="space-y-3" onClick={() => setOpenId(null)}>
            {wishlistItems.map((item) => (
              <div key={item.id || item.title} onClick={(event) => event.stopPropagation()}>
                <SwipeWishlistItem
                  item={item}
                  openId={openId}
                  setOpenId={setOpenId}
                  onAddToCart={handleAddToCart}
                  onRemove={handleRemove}
                />
              </div>
            ))}
          </section>
        )}
      </main>
      </div>
      {fromProfile ? null : <MobileBottomNav />}
    </div>
  );
}
