import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { productImage } from '../../utils/format';
import MobileBottomNav from '../MobileBottomNav';
import { DEFAULT_HEADER_COLOR, getProfileHeaderColor } from '../profileHeaderColor';

function ProfileAvatar({ user }) {
  const [broken, setBroken] = useState(false);
  const avatar = user?.avatar || '';
  const src = avatar && !broken ? productImage(avatar) : '';
  const initials = (user?.fullName || user?.email || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'U';

  useEffect(() => {
    setBroken(false);
  }, [avatar]);

  return (
    <span className="relative inline-flex h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full bg-[#efe7dc] ring-[3px] ring-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[1.45rem] font-black text-[#6b4228]">
          {initials}
        </span>
      )}
    </span>
  );
}

function MenuRow({ icon, iconStyle = 'fa-regular', label, onClick, to, danger = false, last = false }) {
  const className = `flex w-full items-center gap-3.5 border-0 bg-transparent px-1 py-[15px] text-left no-underline ${
    last ? '' : 'border-b border-[#f0ebe4]'
  }`;
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center text-[1.05rem] ${
          danger ? 'text-[#c0392b]' : 'text-[#3d2a1c]'
        }`}
      >
        <i className={`${iconStyle} ${icon}`} />
      </span>
      <span className={`min-w-0 flex-1 text-[0.95rem] font-semibold ${danger ? 'text-[#c0392b]' : 'text-[#1c140e]'}`}>
        {label}
      </span>
      {!danger ? <i className="fa-solid fa-chevron-right text-[0.72rem] text-[#c4b8ab]" /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function MobileProfile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const loggedIn = Boolean(user?.isLoggedIn);
  const [headerColor, setHeaderColor] = useState(DEFAULT_HEADER_COLOR);

  useEffect(() => {
    if (loggedIn && user?.email) {
      setHeaderColor(getProfileHeaderColor(user.email));
    } else {
      setHeaderColor(DEFAULT_HEADER_COLOR);
    }
  }, [loggedIn, user?.email]);

  useEffect(() => {
    const sync = () => {
      if (user?.email) setHeaderColor(getProfileHeaderColor(user.email));
    };
    window.addEventListener('focus', sync);
    window.addEventListener('mmf-profile-header-color', sync);
    return () => {
      window.removeEventListener('focus', sync);
      window.removeEventListener('mmf-profile-header-color', sync);
    };
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    navigate('/app/home', { replace: true });
  };

  const goAuthed = (path) => {
    if (!loggedIn) {
      navigate('/app/login', { state: { from: path } });
      return;
    }
    navigate(path);
  };

  return (
    <div className="mmf-pwa flex min-h-[100dvh] flex-col font-sans text-[#111111]" style={{ backgroundColor: headerColor }}>
      <header
        className="relative shrink-0 px-4 pb-14 pt-[max(0.85rem,env(safe-area-inset-top))]"
        style={{ backgroundColor: headerColor }}
      >
        <div className="mx-auto max-w-md">
          <div className="mb-5 pt-2" />

          <div className="flex flex-col items-center text-center text-white">
            {loggedIn ? (
              <ProfileAvatar user={user} />
            ) : (
              <span className="flex h-[92px] w-[92px] items-center justify-center rounded-full bg-white/15 ring-[3px] ring-white/80">
                <i className="fa-regular fa-user text-[2rem] text-white/90" />
              </span>
            )}
            <h1 className="mb-0 mt-3.5 max-w-[90%] truncate text-[1.2rem] font-black tracking-tight">
              {loggedIn ? user.fullName || 'Customer' : 'Guest'}
            </h1>
            <p className="mb-0 mt-1 max-w-[92%] truncate text-[0.8rem] font-medium text-white/85">
              {loggedIn ? user.email : 'Sign in to manage your account'}
            </p>
          </div>
        </div>
      </header>

      <section className="relative z-[1] -mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_30px_rgba(59,40,24,0.12)]">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#eadfce]" />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">
            {!loggedIn ? (
              <div className="mb-2 grid grid-cols-2 gap-2.5 border-b border-[#f0ebe4] py-4">
                <Link
                  to="/app/login"
                  state={{ from: '/app/profile' }}
                  className="flex min-h-[46px] items-center justify-center rounded-full bg-[#6b4228] text-[0.86rem] font-black text-white no-underline"
                >
                  Sign in
                </Link>
                <Link
                  to="/app/register"
                  state={{ from: '/app/profile' }}
                  className="flex min-h-[46px] items-center justify-center rounded-full border border-[#6b4228] bg-white text-[0.86rem] font-black text-[#6b4228] no-underline"
                >
                  Sign up
                </Link>
              </div>
            ) : null}

            <nav aria-label="Profile menu">
              <MenuRow
                icon="fa-user"
                label="Personal information"
                onClick={() => goAuthed('/app/profile/personal')}
              />
              <MenuRow
                icon="fa-box"
                iconStyle="fa-solid"
                label="My Orders"
                onClick={() => goAuthed('/app/profile/orders')}
              />
              <MenuRow
                icon="fa-heart"
                label="Wishlist"
                onClick={() => goAuthed('/app/profile/wishlist')}
              />
              <MenuRow
                icon="fa-star"
                label="Reviews"
                onClick={() => goAuthed('/app/profile/reviews')}
              />
              <MenuRow
                icon="fa-headset"
                iconStyle="fa-solid"
                label="Support"
                onClick={() => goAuthed('/app/profile/support')}
              />
              <MenuRow
                icon="fa-gear"
                iconStyle="fa-solid"
                label="Settings"
                onClick={() => goAuthed('/app/profile/settings')}
                last={!loggedIn}
              />
              {loggedIn ? (
                <MenuRow
                  icon="fa-right-from-bracket"
                  iconStyle="fa-solid"
                  label="Logout"
                  danger
                  last
                  onClick={handleLogout}
                />
              ) : null}
            </nav>
          </div>
        </div>
      </section>

      <MobileBottomNav />
    </div>
  );
}
