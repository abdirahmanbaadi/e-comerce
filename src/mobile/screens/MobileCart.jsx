import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { formatMoney, productImage } from '../../utils/format';
import MobileBottomNav from '../MobileBottomNav';

const DELETE_WIDTH = 72;

function SwipeCartItem({ item, openId, setOpenId, onChangeQty, onRemove }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const startOffset = useRef(0);
  const axis = useRef(null);
  const liveX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const isOpen = openId === item.id;

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
        onClick={() => onRemove(item.id)}
        className="absolute inset-y-0 left-0 z-0 flex w-[72px] items-center justify-center border-0 bg-[#fdecec] text-[#e11d48]"
        aria-label="Delete item"
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
      >
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#f4eee7]">
          <img src={productImage(item.image || item.images?.[0])} alt="" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 line-clamp-1 text-[0.9rem] font-black text-[#111111]">{item.title}</h2>
          <p className="mb-2 mt-1 line-clamp-1 text-[0.68rem] font-semibold text-[#8b8178]">
            {item.categoryLabel || item.category || 'Furniture'}
          </p>
          <p className="m-0 text-[0.88rem] font-black">{formatMoney(item.price)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChangeQty(item.id, -1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#d9d1c8] bg-white text-[#5f5750]"
            aria-label="Decrease"
          >
            -
          </button>
          <span className="min-w-4 text-center text-[0.82rem] font-black">{item.quantity}</span>
          <button
            type="button"
            onClick={() => onChangeQty(item.id, 1)}
            className="flex h-7 w-7 items-center justify-center rounded-full border-0 bg-[#14324a] text-white"
            aria-label="Increase"
          >
            +
          </button>
        </div>
      </article>
    </div>
  );
}

export default function MobileCart() {
  const { cartItems, changeQuantity, removeFromCart } = useCart();
  const [openId, setOpenId] = useState(null);
  const [couponCode, setCouponCode] = useState(() => localStorage.getItem('mmf_mobile_coupon') || '');

  const subtotal = (cartItems || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0
  );

  const saveCoupon = () => {
    localStorage.setItem('mmf_mobile_coupon', couponCode.trim());
  };

  return (
    <div className="mmf-pwa min-h-[100dvh] bg-[#fff7ed] px-4 pt-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] font-sans text-[#111111]">
      <main className="mx-auto max-w-md">
        <header className="mb-5 pt-[max(0.6rem,env(safe-area-inset-top))]">
          <h1 className="m-0 font-display text-[2rem] font-semibold leading-none text-[#3d2a1c]">My Cart</h1>
          <p className="mb-0 mt-1.5 text-[0.82rem] font-semibold text-[#8b8178]">
            Review your items before checkout
          </p>
        </header>

        {!cartItems?.length ? (
          <section className="rounded-[26px] bg-white px-6 py-16 text-center shadow-sm ring-1 ring-[#eee7df]">
            <i className="fa-solid fa-cart-shopping mb-4 text-4xl text-[#d8c8b6]" />
            <h2 className="m-0 text-[1.25rem] font-black">Your cart is empty</h2>
            <p className="mx-auto mb-0 mt-2 max-w-xs text-[0.85rem] font-semibold leading-relaxed text-[#8b8178]">
              Browse products and add your favorite furniture here.
            </p>
            <Link
              to="/app/shop"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#111111] px-6 text-[0.86rem] font-black text-white no-underline"
            >
              Go to Shop
            </Link>
          </section>
        ) : (
          <>
            <section className="space-y-3" onClick={() => setOpenId(null)}>
              {cartItems.map((item) => (
                <div key={item.id} onClick={(event) => event.stopPropagation()}>
                  <SwipeCartItem
                    item={item}
                    openId={openId}
                    setOpenId={setOpenId}
                    onChangeQty={changeQuantity}
                    onRemove={(id) => {
                      setOpenId(null);
                      removeFromCart(id);
                    }}
                  />
                </div>
              ))}
            </section>

            <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-[#eee7df]">
              <label className="mb-4 block">
                <span className="mb-2 block text-[0.78rem] font-black text-[#111111]">Coupon Code</span>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value)}
                    placeholder="Enter coupon code"
                    className="h-11 min-w-0 flex-1 rounded-2xl border border-[#eee7df] bg-[#fffaf3] px-4 text-[0.82rem] font-semibold outline-none focus:border-[#7b4a28]"
                  />
                  <button
                    type="button"
                    onClick={saveCoupon}
                    className="rounded-2xl border-0 bg-[#111111] px-4 text-[0.78rem] font-black text-white"
                  >
                    Apply
                  </button>
                </div>
              </label>

              <div className="space-y-3 border-b border-dashed border-[#e8ded3] pb-4">
                <div className="flex items-center justify-between text-[0.82rem] font-semibold text-[#8b8178]">
                  <span>Subtotal :</span>
                  <span className="font-black text-[#111111]">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-[0.82rem] font-semibold text-[#8b8178]">
                  <span>Delivery Fee :</span>
                  <span className="text-right text-[0.72rem] font-black text-[#9b8876]">
                    Select district at checkout
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[0.9rem] font-semibold text-[#8b8178]">Total :</span>
                <span className="text-[1rem] font-black text-[#111111]">{formatMoney(subtotal)}</span>
              </div>
              <Link
                to="/app/checkout"
                className="mt-5 flex min-h-[50px] items-center justify-center rounded-full bg-[#ffd12f] text-[0.88rem] font-black text-[#111111] no-underline shadow-[0_12px_24px_rgba(255,209,47,0.25)]"
              >
                Check out
              </Link>
            </section>
          </>
        )}
      </main>
      <MobileBottomNav />
    </div>
  );
}
