import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { useWishlist } from '../../context/WishlistContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useNotifications } from '../../hooks/useNotifications';
import { formatMoney, productImage } from '../../utils/format';
import { showTopFloatNotification } from '../../utils/notifications';

// =============================================================================
// AppSearchField
// =============================================================================

export function AppSearchField({
  id,
  value,
  defaultValue,
  onChange,
  placeholder = 'Search…',
  ariaLabel,
  className = '',
  variant = 'default',
  inputClassName = '',
  disabled = false,
}) {
  const variantClass =
    variant === 'header'
      ? 'app-search-wrap--header'
      : variant === 'full'
        ? 'app-search-wrap--full'
        : '';

  return (
    <div className={`app-search-wrap ${variantClass} ${className}`.trim()}>
      <input
        id={id}
        type="search"
        className={`app-search-input ${inputClassName}`.trim()}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
      />
      <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
    </div>
  );
}

// =============================================================================
// NotificationDropdown
// =============================================================================

const NOTIF_TYPE_ICON = {
  order_confirmed: { icon: 'fa-bag-shopping', color: '#10b981' },
  payment_success: { icon: 'fa-circle-check', color: '#10b981' },
  payment_failed: { icon: 'fa-circle-xmark', color: '#ef4444' },
  order_processing: { icon: 'fa-box', color: '#f59e0b' },
  order_shipped: { icon: 'fa-truck', color: '#f59e0b' },
  order_delivered: { icon: 'fa-check-double', color: '#10b981' },
  order_cancelled: { icon: 'fa-ban', color: '#ef4444' },
  driver_assigned: { icon: 'fa-user-check', color: '#10b981' },
  support_replied: { icon: 'fa-headset', color: '#3b82f6' },
  wishlist_stock: { icon: 'fa-heart', color: '#d8a128' },
  weekend_offer: { icon: 'fa-tag', color: '#f59e0b' },
};

function iconForNotification(n) {
  return NOTIF_TYPE_ICON[n.type] || { icon: 'fa-bell', color: '#10b981' };
}

function sortNewestFirst(items) {
  return [...items].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
}

function NotificationDropdown({ items, unreadCount, onItemClick, onClose }) {
  const navigate = useNavigate();

  const sorted = useMemo(() => sortNewestFirst(items), [items]);
  const unread = unreadCount ?? sorted.filter((n) => n.unread).length;

  const handleClick = async (n) => {
    if (onItemClick) await onItemClick(n);
    onClose?.();

    if (n.orderId || String(n.type || '').includes('order') || String(n.type || '').includes('payment')) {
      navigate('/track-order');
    } else {
      navigate('/profile?tab=notifications');
    }
  };

  return (
    <div
      className="absolute right-0 top-[calc(100%+10px)] z-[1060] w-[min(340px,calc(100vw-24px))] animate-navDropIn overflow-hidden rounded-2xl border border-deepGreen/[0.08] bg-white shadow-[0_20px_40px_rgba(7,61,53,0.14)] max-lg:right-[-8px]"
      role="dialog"
      aria-label="Notifications"
    >
      <div className="flex items-center justify-between border-b border-deepGreen/[0.06] bg-deepGreen/[0.02] px-4 py-3.5">
        <strong className="text-[0.95rem] text-gray-800">Notifications</strong>
        <span className="text-[0.72rem] font-bold text-emerald-500">{unread} unread</span>
      </div>

      <ul className="m-0 max-h-80 list-none overflow-y-auto p-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-deepGreen/18 [&::-webkit-scrollbar]:w-[5px]">
        {sorted.length === 0 ? (
          <li>
            <span className="block px-2 py-5 text-center text-[0.84rem] text-gray-500">
              No notifications yet.
            </span>
          </li>
        ) : (
          sorted.slice(0, 10).map((n) => {
            const meta = iconForNotification(n);
            return (
              <li key={n.id}>
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-start gap-3 rounded-xl border-0 bg-transparent p-2.5 text-left transition-colors hover:bg-deepGreen/[0.04]"
                  onClick={() => handleClick(n)}
                >
                  <span
                    className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl text-[0.9rem]"
                    style={{ background: `${meta.color}18`, color: meta.color }}
                  >
                    <i className={`fa-solid ${meta.icon}`} />
                  </span>
                  <span>
                    <strong className="mb-0.5 block text-[0.84rem] text-gray-800">{n.title}</strong>
                    <small className="block text-[0.74rem] leading-snug text-gray-500">{n.desc}</small>
                    {n.time && (
                      <small className="mt-1 block text-[0.74rem] opacity-75">{n.time}</small>
                    )}
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      {sorted.length > 0 && (
        <div className="border-t border-deepGreen/[0.06] px-3 pb-3 pt-2.5">
          <Link
            to="/profile?tab=notifications"
            className="block w-full rounded-lg px-2 py-2 text-center text-[0.82rem] font-bold text-deepGreen no-underline transition-colors hover:bg-deepGreen/[0.05]"
            onClick={onClose}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// WishlistDropdown
// =============================================================================

function WishlistDropdown({ onClose }) {
  const { products } = useProducts();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const wishlistedItems = products.filter(
    (p) => wishlist[p.title] && p.status !== 'Inactive'
  );
  const itemCount = wishlistedItems.length;

  const handleAddToCart = (product) => {
    if (product.stock === 'out-of-stock') {
      showTopFloatNotification('This product is currently out of stock!', 'danger');
      return;
    }
    addToCart(product, 1);
    removeFromWishlist(product.title);
    showTopFloatNotification('1 item added to cart & removed from wishlist!', 'success');
  };

  const handleRemove = (product) => {
    removeFromWishlist(product.title);
    showTopFloatNotification('Product removed from wishlist!', 'success');
  };

  return (
    <div
      className="absolute right-0 top-[calc(100%+10px)] z-[1060] w-[min(340px,calc(100vw-24px))] animate-navDropIn overflow-hidden rounded-2xl border border-deepGreen/[0.08] bg-white shadow-[0_20px_40px_rgba(7,61,53,0.14)] max-lg:right-[-8px]"
      role="dialog"
      aria-label="Wishlist"
    >
      <div className="flex items-center justify-between border-b border-deepGreen/[0.06] bg-deepGreen/[0.02] px-4 py-3.5">
        <strong className="text-[0.95rem] text-gray-800">Wishlist</strong>
        <span className="text-[0.72rem] font-bold text-emerald-500">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </span>
      </div>

      {itemCount === 0 ? (
        <div className="px-4 py-6 text-center text-[0.84rem] text-gray-500">
          <i className="fa-regular fa-heart mb-2 block text-2xl opacity-35" />
          Your wishlist is empty.
          <Link
            to="/products"
            className="mt-3 block rounded-lg px-2 py-2 text-center text-[0.82rem] font-bold text-deepGreen no-underline transition-colors hover:bg-deepGreen/[0.05]"
            onClick={onClose}
          >
            Browse Shop
          </Link>
        </div>
      ) : (
        <>
          <div className="max-h-80 overflow-y-auto px-2.5 py-2 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb]:bg-deepGreen/18 [&::-webkit-scrollbar]:w-[5px]">
            {wishlistedItems.map((product) => {
              const isOutOfStock = product.stock === 'out-of-stock';
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 rounded-xl p-2.5 transition-colors hover:bg-deepGreen/[0.04] [&+&]:mt-0.5"
                >
                  <img
                    src={productImage(product.images[0])}
                    alt={product.title}
                    className="h-[52px] w-[52px] shrink-0 rounded-lg bg-[#fcfbf9] object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <h4
                      className="m-0 mb-0.5 truncate text-[0.82rem] font-extrabold text-productTitle"
                      title={product.title}
                    >
                      {product.title}
                    </h4>
                    <div className="mb-0.5 text-[0.72rem] text-[#888]">
                      {product.label || product.category}
                    </div>
                    <div className="text-[0.8rem] font-extrabold text-btnBrown">
                      {formatMoney(product.price)}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-deepGreen text-[0.82rem] text-white transition hover:scale-[1.06] hover:bg-gold hover:text-deepGreen disabled:cursor-not-allowed disabled:opacity-45"
                      title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                    >
                      <i className="fa-solid fa-cart-shopping" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border-0 bg-red-500/10 text-[0.82rem] text-red-500 transition hover:scale-[1.06] hover:bg-red-500/[0.18]"
                      title="Remove from wishlist"
                      onClick={() => handleRemove(product)}
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="border-t border-deepGreen/[0.06] px-3 pb-3 pt-2.5">
            <Link
              to="/products"
              className="block w-full rounded-lg px-2 py-2 text-center text-[0.82rem] font-bold text-deepGreen no-underline transition-colors hover:bg-deepGreen/[0.05]"
              onClick={onClose}
            >
              View all products
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

// =============================================================================
// ProfileDropdown
// =============================================================================

function ProfileDropdown({ user, onClose, onLogout }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const menuItems = [
    { key: 'profile', label: 'Profile', icon: 'fa-regular fa-circle-user', to: '/profile' },
    ...(isAdmin
      ? [{ key: 'dashboard', label: 'Dashboard', icon: 'fa-solid fa-table-columns', to: '/admin' }]
      : []),
    { key: 'settings', label: 'Settings', icon: 'fa-solid fa-gear', to: '/profile?tab=settings' },
  ];

  const displayName = user?.fullName?.trim() || 'User';
  const email = user?.email || '';
  const avatar = user?.avatar;
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const goTo = (to) => {
    onClose?.();
    navigate(to);
  };

  const menuItemClass =
    'group flex w-full cursor-pointer items-center gap-3 rounded-2xl border-0 bg-transparent px-2 py-2.5 text-left text-[0.9rem] font-semibold text-[#333333] transition-all duration-200 ease-out hover:bg-[#F0F5F3] hover:pl-3';

  const iconWrapClass =
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/[0.08] bg-white text-[0.95rem] text-[#5C6B63] transition-all duration-200 group-hover:scale-105 group-hover:border-deepGreen/20 group-hover:bg-[#E8F0EC] group-hover:text-deepGreen';

  return (
    <div
      className="absolute right-0 top-[calc(100%+10px)] z-[1060] w-[min(300px,calc(100vw-24px))] animate-navDropIn overflow-hidden rounded-[22px] border border-black/[0.06] bg-white p-3 shadow-[0_24px_48px_rgba(0,0,0,0.12)] max-lg:right-[-8px]"
      role="menu"
      aria-label="Profile menu"
    >
      <div className="mb-2 flex items-center justify-between gap-3 rounded-2xl border border-black/[0.08] bg-[#FAFAFA] px-3.5 py-3">
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-[0.95rem] font-bold text-[#111111]">{displayName}</p>
          <p className="m-0 truncate text-[0.78rem] text-[#888888]">{email || '—'}</p>
        </div>
        {avatar ? (
          <img src={avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-deepGreen/10" />
        ) : (
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-deepGreen text-[0.9rem] font-bold text-white shadow-[0_4px_12px_rgba(7,61,53,0.2)]">
            {initials}
          </span>
        )}
      </div>

      <div className="py-1">
        {menuItems.map((item) => (
          <button
            key={item.key}
            type="button"
            role="menuitem"
            className={menuItemClass}
            onClick={() => goTo(item.to)}
          >
            <span className={iconWrapClass}>
              <i className={item.icon} />
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="my-1.5 border-t border-black/[0.08]" />

      <button
        type="button"
        role="menuitem"
        className={menuItemClass}
        onClick={() => {
          onClose?.();
          onLogout();
        }}
      >
        <span className={`${iconWrapClass} group-hover:border-red-200 group-hover:bg-red-50 group-hover:text-red-500`}>
          <i className="fa-solid fa-arrow-right-from-bracket" />
        </span>
        Sign out
      </button>
    </div>
  );
}

// =============================================================================
// StoreNavbar (MainNavbar)
// =============================================================================

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/track-order', label: 'Track Order' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
];

function NavIconButton({ className, active, badge, title, onClick, children }) {
  return (
    <button
      type="button"
      className={[
        'relative inline-flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[1.08rem] text-[#111111] no-underline transition-all duration-300 hover:scale-[1.18] hover:text-gold hover:[transform:translateY(-2px)_scale(1.18)]',
        active ? 'text-gold' : '',
        className || '',
      ].join(' ')}
      title={title}
      onClick={onClick}
    >
      {children}
      {badge > 0 && (
        <span className="absolute -right-2 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[5px] text-[0.65rem] font-extrabold leading-none text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

export default function StoreNavbar({ cartActive = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { items: notifications, unreadCount, markRead, refresh } = useNotifications({
    enabled: user.isLoggedIn,
    pollMs: 20000,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const wishlistRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useClickOutside(wishlistRef, () => setWishlistOpen(false), wishlistOpen);
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);
  useClickOutside(profileRef, () => setProfileOpen(false), profileOpen);

  useEffect(() => {
    if (notifOpen) refresh();
  }, [notifOpen, refresh]);

  const profileHref = user.isLoggedIn ? '/profile' : '/login';
  const profileLetter = user.fullName?.trim().charAt(0).toUpperCase() || 'U';

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/';
    if (to === '#') return false;
    return location.pathname.startsWith(to);
  };

  const profileTitle = user.isLoggedIn ? `Logged in as: ${user.fullName}` : 'Login / Register';

  const closeDropdowns = () => {
    setWishlistOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
  };

  const profileIcon = user.isLoggedIn && user.avatar ? (
    <span className="inline-flex h-[29px] w-[29px] items-center justify-center overflow-hidden rounded-full bg-deepGreen shadow-[0_4px_12px_rgba(7,61,53,0.22)]">
      <img src={user.avatar} alt="Profile" className="h-full w-full rounded-full object-cover" />
    </span>
  ) : user.isLoggedIn ? (
    <span className="inline-flex h-[29px] w-[29px] items-center justify-center rounded-full bg-gold text-[0.84rem] font-extrabold uppercase text-white shadow-[0_4px_12px_rgba(7,61,53,0.22)]">
      {profileLetter}
    </span>
  ) : (
    <i className="fa-regular fa-user" />
  );

  const navLinkClass = (active) =>
    [
      'relative cursor-pointer px-0 py-1.5 text-[0.86rem] font-bold text-[#111111] no-underline transition-colors after:absolute after:bottom-[-4px] after:left-0 after:h-0.5 after:w-0 after:bg-gold after:transition-all after:duration-300 hover:text-gold hover:after:w-full',
      active ? 'text-gold after:w-full' : '',
    ].join(' ');

  const renderWishlistDropdown = () => (
    <div className="relative inline-flex" ref={wishlistRef}>
      <NavIconButton
        title="Wishlist"
        active={wishlistOpen}
        badge={wishlistCount}
        onClick={() => {
          setWishlistOpen((open) => !open);
          setNotifOpen(false);
          setProfileOpen(false);
        }}
      >
        <i className="fa-regular fa-heart" />
      </NavIconButton>
      {wishlistOpen && <WishlistDropdown onClose={() => setWishlistOpen(false)} />}
    </div>
  );

  const renderNotificationDropdown = () => {
    if (!user.isLoggedIn) return null;

    return (
      <div className="relative inline-flex" ref={notifRef}>
        <NavIconButton
          title="Notifications"
          active={notifOpen}
          badge={unreadCount}
          onClick={() => {
            setNotifOpen((open) => !open);
            setWishlistOpen(false);
            setProfileOpen(false);
          }}
        >
          <i className="fa-regular fa-bell" />
        </NavIconButton>
        {notifOpen && (
          <NotificationDropdown
            items={notifications}
            unreadCount={unreadCount}
            onItemClick={async (n) => {
              if (n.unread) await markRead(n.id);
            }}
            onClose={() => setNotifOpen(false)}
          />
        )}
      </div>
    );
  };

  const renderProfileControl = () => {
    if (!user.isLoggedIn) {
      return (
        <Link
          to="/login"
          title={profileTitle}
          className="relative inline-flex h-8 w-8 items-center justify-center text-[1.08rem] text-[#111111] no-underline transition-all duration-300 hover:scale-[1.18] hover:text-gold hover:[transform:translateY(-2px)_scale(1.18)]"
          aria-label="Login"
          onClick={() => {
            setMenuOpen(false);
            closeDropdowns();
          }}
        >
          {profileIcon}
        </Link>
      );
    }

    return (
      <div className="relative inline-flex" ref={profileRef}>
        <button
          type="button"
          title={profileTitle}
          aria-label="Profile menu"
          aria-expanded={profileOpen}
          aria-haspopup="menu"
          className={[
            'relative inline-flex h-8 w-8 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-[1.08rem] text-[#111111] transition-all duration-300 hover:scale-[1.18] hover:text-gold hover:[transform:translateY(-2px)_scale(1.18)]',
            profileOpen ? 'text-gold' : '',
          ].join(' ')}
          onClick={() => {
            setProfileOpen((open) => !open);
            setWishlistOpen(false);
            setNotifOpen(false);
          }}
        >
          {profileIcon}
        </button>
        {profileOpen && (
          <ProfileDropdown
            user={user}
            onClose={() => setProfileOpen(false)}
            onLogout={logout}
          />
        )}
      </div>
    );
  };

  const navIcons = (variant = 'desktop') => {
    const className =
      variant === 'mobile-menu'
        ? 'mt-2 flex items-center justify-center gap-2.5 border-t border-black/[0.08] px-0 pb-1 pt-3 lg:hidden'
        : variant === 'mobile-header'
          ? 'ml-auto mr-2 flex items-center gap-2 lg:hidden'
          : 'hidden items-center gap-2.5 lg:flex';

    return (
      <div className={className}>
        {renderNotificationDropdown()}
        {renderWishlistDropdown()}
        <Link
          to="/cart"
          className="relative inline-flex h-8 w-8 items-center justify-center text-[1.08rem] text-[#111111] no-underline transition-all duration-300 hover:scale-[1.18] hover:text-gold hover:[transform:translateY(-2px)_scale(1.18)]"
          title="Shopping Cart"
          style={cartActive ? { color: 'var(--gold)' } : undefined}
          onClick={() => {
            setMenuOpen(false);
            closeDropdowns();
          }}
        >
          <i className="fa-solid fa-cart-shopping" />
          {cartCount > 0 && (
            <span className="absolute -right-2 -top-1.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-orange-500 px-[5px] text-[0.65rem] font-extrabold leading-none text-white">
              {cartCount}
            </span>
          )}
        </Link>
        {renderProfileControl()}
      </div>
    );
  };

  const profileNavLabel = user.isLoggedIn ? 'My Profile' : 'Login / Register';

  return (
    <nav className="border-b border-black/[0.07] bg-nav py-[7px] shadow-[0_3px_18px_rgba(0,0,0,0.04)]">
      <div className="container flex flex-wrap items-center gap-3 lg:flex-nowrap">
        <Link
          className="mb-0 inline-flex items-center gap-2.5 no-underline"
          to="/"
          onClick={() => {
            setMenuOpen(false);
            closeDropdowns();
          }}
        >
          <div className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center max-lg:h-[35px] max-lg:w-[35px]">
            <span className="absolute inset-0 rotate-45 rounded-[9px] border-2 border-gold bg-transparent" />
            <span className="relative z-[2] font-display text-[1.1rem] font-bold leading-none tracking-[-1px] text-gold max-lg:text-base">
              MF
            </span>
          </div>
          <div className="h-[34px] w-px shrink-0 bg-gold opacity-85 max-lg:h-[31px]" />
          <div className="flex flex-col leading-[1.05]">
            <span className="font-display text-[1.45rem] font-bold tracking-[0.2px] text-deepGreen max-lg:text-[1.35rem]">
              Mogadishu
            </span>
            <span className="mt-[3px] text-[0.52rem] font-extrabold uppercase tracking-[1.8px] text-deepGreen max-lg:text-[0.48rem] max-lg:tracking-[1.5px]">
              Modern Furniture
            </span>
          </div>
        </Link>

        {navIcons('mobile-header')}

        <button
          className="ml-auto rounded-lg border border-black/[0.12] px-2.5 py-1.5 focus:shadow-[0_0_0_0.2rem_rgba(216,161,40,0.25)] lg:hidden"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div
          className={[
            'w-full flex-col items-center pt-2 lg:flex lg:flex-1 lg:flex-row lg:justify-center lg:pt-0',
            menuOpen ? 'flex' : 'hidden lg:flex',
          ].join(' ')}
        >
          <ul className="m-0 flex list-none flex-col items-center gap-1 p-0 lg:flex-row lg:gap-2">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={label} className="nav-item">
                {to === '#' ? (
                  <a className={`mx-3 ${navLinkClass(false)}`} href="#">
                    {label}
                  </a>
                ) : (
                  <Link
                    className={`mx-3 ${navLinkClass(isActive(to))}`}
                    to={to}
                    onClick={() => {
                      setMenuOpen(false);
                      closeDropdowns();
                    }}
                  >
                    {label}
                  </Link>
                )}
              </li>
            ))}
            <li className="nav-item lg:hidden">
              <Link
                className={`mx-3 font-bold text-deepGreen ${navLinkClass(location.pathname === '/profile')}`}
                to={profileHref}
                onClick={() => {
                  setMenuOpen(false);
                  closeDropdowns();
                }}
              >
                <i className="fa-regular fa-user me-2" />
                {profileNavLabel}
              </Link>
            </li>
          </ul>
        </div>

        {navIcons('desktop')}
      </div>
    </nav>
  );
}
