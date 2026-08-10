import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { productImage } from '../../../utils/format';
import { driverStatusMeta } from '../../../features/driver/driverShared';
import { DEFAULT_HEADER_COLOR, getProfileHeaderColor } from '../../profileHeaderColor';
import { useDriverContext } from '../DriverShell';

const DRIVER_HEADER = '#2f6b45';

function ProfileAvatar({ user }) {
  const [broken, setBroken] = useState(false);
  const avatar = user?.avatar || '';
  const src = avatar && !broken ? productImage(avatar) : '';
  const initials = (user?.fullName || user?.email || 'D')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'D';

  useEffect(() => {
    setBroken(false);
  }, [avatar]);

  return (
    <span className="relative inline-flex h-[92px] w-[92px] shrink-0 overflow-hidden rounded-full bg-[#e7f2ee] ring-[3px] ring-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[1.45rem] font-black text-[#073D35]">
          {initials}
        </span>
      )}
    </span>
  );
}

function MenuRow({ icon, iconStyle = 'fa-regular', label, onClick, to, danger = false, last = false }) {
  const className = `flex w-full items-center gap-3.5 border-0 bg-transparent px-1 py-[15px] text-left no-underline ${
    last ? '' : 'border-b border-[#eef3f1]'
  }`;
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center text-[1.05rem] ${
          danger ? 'text-[#c0392b]' : 'text-[#073D35]'
        }`}
      >
        <i className={`${iconStyle} ${icon}`} />
      </span>
      <span className={`min-w-0 flex-1 text-[0.95rem] font-semibold ${danger ? 'text-[#c0392b]' : 'text-[#10241f]'}`}>
        {label}
      </span>
      {!danger ? <i className="fa-solid fa-chevron-right text-[0.72rem] text-[#c0cbc7]" /> : null}
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

export default function DriverProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, driverStatus, activeDeliveries, setAvailability } = useDriverContext();
  const status = driverStatusMeta(driverStatus, activeDeliveries);
  const isOffline = driverStatus === 'offline';
  const [headerColor, setHeaderColor] = useState(DRIVER_HEADER);

  useEffect(() => {
    if (user?.email) {
      const stored = getProfileHeaderColor(user.email);
      setHeaderColor(stored && stored !== DEFAULT_HEADER_COLOR ? stored : DRIVER_HEADER);
    } else {
      setHeaderColor(DRIVER_HEADER);
    }
  }, [user?.email]);

  useEffect(() => {
    const sync = () => {
      if (!user?.email) return;
      const stored = getProfileHeaderColor(user.email);
      setHeaderColor(stored && stored !== DEFAULT_HEADER_COLOR ? stored : DRIVER_HEADER);
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
    navigate('/app/login', { replace: true });
  };

  return (
    <div
      className="mmf-pwa mmf-driver flex min-h-[100dvh] flex-col font-sans text-[#111111]"
      style={{ backgroundColor: headerColor }}
    >
      <header
        className="relative shrink-0 px-4 pb-14 pt-[max(0.85rem,env(safe-area-inset-top))]"
        style={{ backgroundColor: headerColor }}
      >
        <div className="mx-auto max-w-md">
          <div className="mb-5 pt-2" />
          <div className="flex flex-col items-center text-center text-white">
            <ProfileAvatar user={user} />
            <h1 className="mb-0 mt-3.5 max-w-[90%] truncate text-[1.2rem] font-black tracking-tight">
              {user?.fullName || 'Driver'}
            </h1>
            <p className="mb-0 mt-1 max-w-[92%] truncate text-[0.8rem] font-medium text-white/85">
              {user?.phone || user?.email || 'Delivery partner'}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
              <span className={`h-2 w-2 rounded-full ${isOffline ? 'bg-white/50' : 'bg-[#b8f0c8]'}`} />
              <span className="text-[0.75rem] font-bold text-white">{status.label}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="relative z-[1] -mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-t-[28px] bg-white shadow-[0_-8px_30px_rgba(7,61,53,0.12)]">
        <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col pb-[calc(5.25rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-[#dce8e3]" />

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-2">
            <div
              className={`mb-1 flex items-center justify-between gap-3 rounded-[16px] px-3 py-2.5 ${
                isOffline ? 'bg-[#f3f4f3]' : 'bg-[#e7f4ea]'
              }`}
            >
              <div className="min-w-0">
                <p className="m-0 text-[0.86rem] font-bold text-[#073D35]">
                  {isOffline ? 'You are Offline' : 'You are Online'}
                </p>
                <p className="mb-0 mt-0.5 text-[0.7rem] text-[#6b7f79]">
                  {isOffline ? 'Turn on to receive deliveries' : 'Ready to receive deliveries'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!isOffline}
                aria-label={isOffline ? 'Go online' : 'Go offline'}
                onClick={() => setAvailability(isOffline ? 'available' : 'offline')}
                className={`relative h-8 w-[54px] shrink-0 rounded-full border-0 p-0 transition-colors ${
                  isOffline ? 'bg-[#c2c7c4]' : 'bg-[#2f6b45]'
                }`}
              >
                <span
                  className={`pointer-events-none absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                    isOffline ? 'translate-x-0' : 'translate-x-[22px]'
                  }`}
                />
              </button>
            </div>

            <nav aria-label="Driver profile menu">
              <MenuRow icon="fa-user" label="Personal information" to="/app/driver/profile/personal" />
              <MenuRow
                icon="fa-wallet"
                iconStyle="fa-solid"
                label="Earnings"
                to="/app/driver/profile/earnings"
              />
              <MenuRow
                icon="fa-headset"
                iconStyle="fa-solid"
                label="Support"
                to="/app/driver/profile/support"
              />
              <MenuRow
                icon="fa-gear"
                iconStyle="fa-solid"
                label="Settings"
                to="/app/driver/profile/settings"
              />
              <MenuRow
                icon="fa-desktop"
                iconStyle="fa-solid"
                label="Classic web portal"
                onClick={() => {
                  window.location.href = '/delivery';
                }}
              />
              <MenuRow
                icon="fa-right-from-bracket"
                iconStyle="fa-solid"
                label="Logout"
                danger
                last
                onClick={handleLogout}
              />
            </nav>
          </div>
        </div>
      </section>
    </div>
  );
}
