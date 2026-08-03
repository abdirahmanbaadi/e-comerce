/**
 * MMF Mobile App UI — clean Shopmore-style layout, MMF green brand
 */
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, NavLink } from 'react-router-dom';
import { formatMoney, productImage } from '../utils/format';

export function AppStoreHeader({ cartCount = 0, notifyCount = 0, onMenu }) {
  return (
    <header className="sticky top-0 z-40 bg-white px-4 pb-1 pt-[max(0.55rem,env(safe-area-inset-top))]">
      <div className="flex h-11 items-center">
        <button
          type="button"
          onClick={onMenu}
          className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-transparent text-[1.2rem] text-[#1A1A1A]"
          aria-label="Menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
        <p className="m-0 flex-1 text-center font-display text-[1.5rem] font-bold tracking-tight text-deepGreen">MMF</p>
        <Link to="/app/orders" className="relative flex h-10 w-10 items-center justify-center text-[1.15rem] text-[#1A1A1A] no-underline" aria-label="Notifications">
          <i className="fa-regular fa-bell" />
          {notifyCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-deepGreen px-0.5 text-[0.55rem] font-bold text-white">
              {notifyCount > 9 ? '9+' : notifyCount}
            </span>
          ) : null}
        </Link>
        <Link to="/app/cart" className="relative flex h-10 w-10 items-center justify-center text-[1.1rem] text-[#1A1A1A] no-underline" aria-label="Cart">
          <i className="fa-solid fa-bag-shopping" />
          {cartCount > 0 ? (
            <span className="absolute right-1.5 top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-deepGreen px-0.5 text-[0.55rem] font-bold text-white">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

export function AppTopBar({ title, subtitle, right, onBack }) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#F0F0F0] bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-full border-0 bg-[#F5F5F5] text-deepGreen" aria-label="Back">
            <i className="fa-solid fa-arrow-left text-[0.85rem]" />
          </button>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[1.15rem] font-extrabold text-[#1A1A1A]">{title}</p>
          {subtitle ? <p className="mb-0 mt-0.5 truncate text-[0.72rem] font-medium text-[#888]">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </header>
  );
}

export function AppBottomNav({ wishlistCount = 0 }) {
  const tabs = [
    { to: '/app', end: true, label: 'Home', icon: 'fa-house' },
    { to: '/app/shop', label: 'Shop', icon: 'fa-couch' },
    { to: '/app/wishlist', label: 'Saved', icon: 'fa-heart', badge: wishlistCount, outline: true },
    { to: '/app/orders', label: 'Orders', icon: 'fa-box' },
    { to: '/app/profile', label: 'Profile', icon: 'fa-user' },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-1"
      aria-label="App navigation"
    >
      <ul className="mx-auto flex max-w-lg items-stretch rounded-[24px] border border-black/[0.06] bg-white/92 px-1 py-1.5 shadow-[0_-10px_35px_rgba(7,61,53,0.12)] backdrop-blur-2xl">
        {tabs.map((tab) => (
          <li key={tab.to} className="min-w-0 flex-1">
            <NavLink to={tab.to} end={tab.end} className="flex flex-col items-center gap-0.5 rounded-2xl px-0.5 py-1.5 no-underline">
              {({ isActive }) => (
                <>
                  <span
                    className={`relative flex h-8 w-8 items-center justify-center rounded-xl text-[1.05rem] transition ${
                      isActive ? 'bg-deepGreen text-white shadow-[0_8px_16px_rgba(7,61,53,0.18)]' : 'text-[#9A958C]'
                    }`}
                  >
                    <i className={`${tab.outline && !isActive ? 'fa-regular' : 'fa-solid'} ${tab.icon}`} />
                    {tab.badge > 0 ? (
                      <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gold px-0.5 text-[0.5rem] font-bold text-deepGreen">
                        {tab.badge > 9 ? '9+' : tab.badge}
                      </span>
                    ) : null}
                  </span>
                  <span className={`text-[0.58rem] font-bold ${isActive ? 'text-deepGreen' : 'text-[#9A958C]'}`}>{tab.label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function WishHeart({ active, onClick }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className="absolute right-2.5 top-2.5 z-[1] flex h-7 w-7 items-center justify-center rounded-full border-0 bg-white text-[0.78rem] shadow-[0_1px_6px_rgba(0,0,0,0.1)]"
      aria-label="Wishlist"
    >
      <i className={`${active ? 'fa-solid text-[#E25563]' : 'fa-regular text-[#999]'} fa-heart`} />
    </button>
  );
}

/** Deals card — wide, tall image, clear product */
export function AppSlideCard({ product, onOpen, wishlisted, onToggleWish }) {
  const img = productImage(product?.images?.[0] || product?.image);

  return (
    <article className="w-[166px] shrink-0 rounded-[16px] border border-[#EFEFEF] bg-white">
      <button type="button" className="block w-full border-0 bg-transparent p-0 text-left" onClick={() => onOpen?.(product)}>
        <div className="relative h-[150px] overflow-hidden rounded-t-[16px] bg-[#F6F6F6]">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-contain p-3.5" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#DDD]">
              <i className="fa-solid fa-couch text-2xl" />
            </div>
          )}
          <WishHeart active={wishlisted} onClick={() => onToggleWish?.(product)} />
        </div>
        <div className="px-3 pb-3 pt-2.5">
          <h3 className="m-0 line-clamp-2 min-h-[2.4em] text-[0.8rem] font-semibold leading-snug text-[#222]">{product.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5">
            <span className="text-[0.95rem] font-extrabold text-deepGreen">{formatMoney(product.price)}</span>
            {product.oldPrice ? (
              <span className="text-[0.72rem] font-medium text-[#B8B8B8] line-through">{formatMoney(product.oldPrice)}</span>
            ) : null}
          </div>
          {product.discount ? (
            <span className="mt-1.5 inline-block rounded-[5px] bg-[#FCE8E8] px-1.5 py-0.5 text-[0.62rem] font-extrabold text-[#D64545]">
              {String(product.discount).replace(/\s*off/i, ' OFF').toUpperCase()}
            </span>
          ) : null}
        </div>
      </button>
    </article>
  );
}

/** Popular — fills grid cell */
export function AppPopularCard({ product, onOpen, wishlisted, onToggleWish }) {
  const img = productImage(product?.images?.[0] || product?.image);

  return (
    <article className="overflow-hidden rounded-[16px] border border-[#EFEFEF] bg-white">
      <button type="button" className="block w-full border-0 bg-transparent p-0 text-left" onClick={() => onOpen?.(product)}>
        <div className="relative aspect-square bg-[#F6F6F6]">
          {img ? (
            <img src={img} alt="" className="h-full w-full object-contain p-4" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#DDD]">
              <i className="fa-solid fa-couch text-2xl" />
            </div>
          )}
          <WishHeart active={wishlisted} onClick={() => onToggleWish?.(product)} />
        </div>
        <div className="px-2.5 pb-2.5 pt-2">
          <h3 className="m-0 line-clamp-2 text-[0.78rem] font-semibold leading-snug text-[#222]">{product.title}</h3>
          <p className="mb-0 mt-1 text-[0.9rem] font-extrabold text-deepGreen">{formatMoney(product.price)}</p>
        </div>
      </button>
    </article>
  );
}

export function AppProductCard({ product, onOpen, onAdd }) {
  const img = productImage(product?.images?.[0] || product?.image);
  return (
    <article className="overflow-hidden rounded-[16px] border border-[#EFEFEF] bg-white">
      <button type="button" className="block w-full border-0 bg-transparent p-0 text-left" onClick={() => onOpen?.(product)}>
        <div className="relative aspect-[4/3] bg-[#F6F6F6]">
          {img ? <img src={img} alt="" className="h-full w-full object-contain p-5" /> : null}
          {product.discount ? (
            <span className="absolute left-2.5 top-2.5 rounded-[5px] bg-[#FCE8E8] px-1.5 py-0.5 text-[0.62rem] font-extrabold text-[#D64545]">
              {String(product.discount).replace(/\s*off/i, ' OFF').toUpperCase()}
            </span>
          ) : null}
        </div>
        <div className="space-y-1 px-3.5 py-3">
          <h3 className="m-0 line-clamp-2 text-[0.9rem] font-semibold text-[#222]">{product.title}</h3>
          <div className="flex items-baseline gap-2">
            <p className="m-0 text-[1.05rem] font-extrabold text-deepGreen">{formatMoney(product.price)}</p>
            {product.oldPrice ? <span className="text-[0.78rem] text-[#B8B8B8] line-through">{formatMoney(product.oldPrice)}</span> : null}
          </div>
        </div>
      </button>
      <div className="px-3.5 pb-3.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(product, e);
          }}
          className="flex min-h-[42px] w-full items-center justify-center rounded-xl border-0 bg-deepGreen text-[0.84rem] font-extrabold text-white"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}

export function AppHScroll({ children, className = '' }) {
  return (
    <div
      className={`-mx-4 flex gap-3 overflow-x-auto px-4 pb-0.5 scrollbar-hide ${className}`}
      style={{ WebkitOverflowScrolling: 'touch', scrollSnapType: 'x proximity' }}
    >
      {children}
    </div>
  );
}

export function AppBottomSheet({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    const prev = document.body.style.overflow;
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === 'undefined' || !document.body) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-black/40 sm:items-center sm:p-4" role="presentation" onClick={onClose}>
      <div
        className="animate-sheetUp flex max-h-[90dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white sm:rounded-[24px]"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-4">
          <div className="min-w-0 flex-1">
            <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-[#E0E0E0] sm:hidden" />
            <h3 className="m-0 truncate text-[1rem] font-extrabold text-[#1A1A1A]">{title}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border-0 bg-[#F5F5F5] text-[#666]" aria-label="Close">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="border-t border-[#F0F0F0] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
