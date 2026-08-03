import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { isDriverUser, isDashboardUser } from '../utils/roleAccess';
import { AppBottomNav } from './MobileUi';

function registerPwa() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

export default function MobileCustomerShell() {
  const { user } = useAuth();
  const { syncFromStorage } = useCart();
  const { wishlistCount } = useWishlist();
  const location = useLocation();
  const hideNav = location.pathname.startsWith('/app/checkout');

  useEffect(() => {
    registerPwa();
    syncFromStorage?.();
    document.documentElement.style.setProperty('--mmf-app', '1');
    return () => document.documentElement.style.removeProperty('--mmf-app');
  }, [syncFromStorage]);

  if (isDriverUser(user)) {
    return <Navigate to="/app/driver" replace />;
  }
  if (isDashboardUser(user)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="mmf-mobile-app min-h-[100dvh] bg-[#F6F2EA] font-sans text-[#111]">
      <div className={`mx-auto min-h-[100dvh] w-full max-w-lg ${hideNav ? '' : 'pb-[6rem]'}`}>
        <Outlet />
      </div>
      {!hideNav && <AppBottomNav wishlistCount={wishlistCount} />}
    </div>
  );
}
