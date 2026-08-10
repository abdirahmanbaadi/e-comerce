import { createContext, useContext, useMemo } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import DriverBottomNav from './DriverBottomNav';
import useDriverData from './useDriverData';

const DriverDataContext = createContext(null);

export function useDriverContext() {
  const ctx = useContext(DriverDataContext);
  if (!ctx) throw new Error('useDriverContext must be used inside DriverShell');
  return ctx;
}

export default function DriverShell() {
  const { user } = useAuth();
  const location = useLocation();
  const data = useDriverData();

  const loggedIn = user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true';
  const role = user?.role || localStorage.getItem('userRole');

  const hideNav = useMemo(() => {
    const path = location.pathname;
    return (
      path.includes('/active') ||
      path.includes('/scan') ||
      path.includes('/notifications') ||
      /\/profile\/.+/.test(path) ||
      /\/jobs\/[^/]+$/.test(path)
    );
  }, [location.pathname]);

  if (!loggedIn) {
    return <Navigate to="/app/login" replace state={{ from: '/app/driver' }} />;
  }
  if (role !== 'delivery') {
    return <Navigate to="/app/home" replace />;
  }

  return (
    <DriverDataContext.Provider value={data}>
      <div className="mmf-pwa mmf-driver min-h-[100dvh] bg-[#f7f4ef] font-sans text-[#1a1a1a]">
        <div className={`mx-auto w-full max-w-md ${hideNav ? 'min-h-[100dvh]' : ''}`}>
          <Outlet />
        </div>
        {hideNav ? null : <DriverBottomNav badgeJobs={data.counts.pending} />}
      </div>
    </DriverDataContext.Provider>
  );
}
