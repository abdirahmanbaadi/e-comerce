import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Delivery from '../pages/Delivery';
import { useAuth } from '../context/AuthContext';
import { isDriverUser } from '../utils/roleAccess';

/**
 * Driver experience inside the installable app shell.
 */
export default function MobileDriverApp() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    document.documentElement.style.setProperty('--mmf-app', '1');
    return () => document.documentElement.style.removeProperty('--mmf-app');
  }, []);

  if (!user?.isLoggedIn) {
    return <Navigate to="/login" replace state={{ from: '/app/driver' }} />;
  }
  if (!isDriverUser(user)) {
    return <Navigate to="/app" replace />;
  }

  return (
    <div className="mmf-mobile-app min-h-[100dvh]">
      <Delivery />
    </div>
  );
}
