import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useClickOutside } from '../hooks/useClickOutside';
import { useNotifications } from '../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';
import WishlistDropdown from './WishlistModal';
import '../styles/navbar-dropdown.css';

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Shop' },
  { to: '/track-order', label: 'Track Order' },
  { to: '#', label: 'About Us' },
  { to: '#', label: 'Contact' },
];

function NavIconButton({ className, active, badge, title, onClick, children }) {
  return (
    <button
      type="button"
      className={`nav-icon-link${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
      title={title}
      onClick={onClick}
      style={{ position: 'relative' }}
    >
      {children}
      {badge > 0 && <span className="nav-icon-badge">{badge}</span>}
    </button>
  );
}

export default function MainNavbar({ cartActive = false }) {
  const location = useLocation();
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { items: notifications, unreadCount, markRead, refresh } = useNotifications({
    enabled: user.isLoggedIn,
    pollMs: 20000,
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const wishlistRef = useRef(null);
  const notifRef = useRef(null);

  useClickOutside(wishlistRef, () => setWishlistOpen(false), wishlistOpen);
  useClickOutside(notifRef, () => setNotifOpen(false), notifOpen);

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
  };

  const profileIcon = user.isLoggedIn && user.avatar ? (
    <span className="profile-letter profile-letter--avatar">
      <img src={user.avatar} alt="Profile" />
    </span>
  ) : user.isLoggedIn ? (
    <span className="profile-letter profile-letter--logged">{profileLetter}</span>
  ) : (
    <i className="fa-regular fa-user" />
  );

  const renderWishlistDropdown = () => (
    <div className="nav-dropdown-wrap" ref={wishlistRef}>
      <NavIconButton
        title="Wishlist"
        active={wishlistOpen}
        badge={wishlistCount}
        onClick={() => {
          setWishlistOpen((open) => !open);
          setNotifOpen(false);
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
      <div className="nav-dropdown-wrap" ref={notifRef}>
        <NavIconButton
          title="Notifications"
          active={notifOpen}
          badge={unreadCount}
          onClick={() => {
            setNotifOpen((open) => !open);
            setWishlistOpen(false);
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

  const navIcons = (variant = 'desktop') => {
    const className =
      variant === 'mobile-menu'
        ? 'nav-icons nav-icons-mobile d-lg-none'
        : variant === 'mobile-header'
          ? 'nav-icons nav-icons-header d-flex d-lg-none'
          : 'nav-icons d-none d-lg-flex';

    return (
      <div className={className}>
        {renderWishlistDropdown()}
        <Link
          to="/cart"
          className="nav-icon-link"
          title="Shopping Cart"
          style={cartActive ? { color: 'var(--gold)' } : undefined}
          onClick={() => {
            setMenuOpen(false);
            closeDropdowns();
          }}
        >
          <i className="fa-solid fa-cart-shopping" />
          <span className="cart-count">{cartCount}</span>
        </Link>
        {renderNotificationDropdown()}
        <Link
          to={profileHref}
          title={profileTitle}
          className="profile-icon-link"
          aria-label={user.isLoggedIn ? 'My Profile' : 'Login'}
          onClick={() => {
            setMenuOpen(false);
            closeDropdowns();
          }}
        >
          {profileIcon}
        </Link>
      </div>
    );
  };

  const profileNavLabel = user.isLoggedIn ? 'My Profile' : 'Login / Register';

  return (
    <nav className="navbar navbar-expand-lg main-navbar">
      <div className="container main-navbar-inner">
        <Link className="brand-logo" to="/" onClick={() => { setMenuOpen(false); closeDropdowns(); }}>
          <div className="brand-logo-mark">
            <span className="brand-logo-frame" />
            <span className="brand-logo-inner">MF</span>
          </div>
          <div className="brand-logo-divider" />
          <div className="brand-logo-text">
            <span className="brand-logo-title">Mogadishu</span>
            <span className="brand-logo-subtitle">Modern Furniture</span>
          </div>
        </Link>

        {navIcons('mobile-header')}

        <button
          className="navbar-toggler main-navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`main-nav-menu${menuOpen ? ' is-open' : ''}`}>
          <ul className="navbar-nav align-items-center">
            {NAV_LINKS.map(({ to, label }) => (
              <li key={label} className="nav-item">
                {to === '#' ? (
                  <a className="nav-link" href="#">
                    {label}
                  </a>
                ) : (
                  <Link
                    className={`nav-link${isActive(to) ? ' active' : ''}`}
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
            <li className="nav-item d-lg-none">
              <Link
                className={`nav-link nav-link-profile${location.pathname === '/profile' ? ' active' : ''}`}
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
