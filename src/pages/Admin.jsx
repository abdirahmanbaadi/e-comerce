import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { clearAdminThemeFromDom, useAdminTheme } from '../hooks/useAdminTheme';
import { getSidebarCompactDefault, getCompactTablesEnabled } from '../features/admin/adminShared.js';
import { useAdminPage } from '../hooks/pages/useAdminPage';
import { useNotifications } from '../hooks/useNotifications';
import { AdminAccessDenied, AdminHeader, AdminSidebar } from '../features/admin/AdminLayout';
import DashboardAdminTab from '../features/admin/AdminDashboard';
import AdminProductsTab from '../features/admin/AdminProductsTab';
import AdminOrdersTab from '../features/admin/AdminOrdersTab';
import AdminUsersTab from '../features/admin/AdminUsersTab';
import AdminSupportTab from '../features/admin/AdminSupportTab';
import {
  AdminStockTab,
  AdminPaymentsTab,
  AdminDeliveryTab,
} from '../features/admin/AdminOpsTabs';
import AdminSettingsTab from '../features/admin/AdminSettingsTab';
import {
  CmsAdminTab,
  DriverApplicationsTab,
} from '../features/admin/AdminManageTabs';
import AdminReviewsTab from '../features/admin/AdminReviewsTab';
import { showTopFloatNotification } from '../utils/notifications';
import { canAccessAdminTab, isDashboardUser } from '../utils/roleAccess';

const ADMIN_PAGE_BG =
  'min-h-screen overflow-x-hidden bg-[#FDFBF8] font-sans text-gray-900 dark:bg-[#0b1412] dark:text-[#e8eeec] [.admin-dark_&]:bg-[#0b1412] [.admin-dark_&]:text-[#e8eeec]';

const REACT_MANAGED_TABS = new Set([
  'dashboard',
  'products',
  'orders',
  'users',
  'stock',
  'payments',
  'delivery',
  'support',
  'settings',
  'driver-applications',
  'cms',
  'reviews',
]);

export default function Admin() {
  const { user, logout, syncFromStorage } = useAuth();
  const location = useLocation();
  useAdminPage();
  const { isDark } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => getSidebarCompactDefault());
  const [compactTables, setCompactTables] = useState(() => getCompactTablesEnabled());
  const [sidebarMobile, setSidebarMobile] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');

  useEffect(() => {
    const syncHeaderSearch = () => {
      if (window.getAdminTabSearchValue) {
        setHeaderSearch(window.getAdminTabSearchValue(activeTab) || '');
      }
    };
    syncHeaderSearch();
    const timer = window.setTimeout(syncHeaderSearch, 50);
    window.addEventListener('admin-header-search-sync', syncHeaderSearch);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('admin-header-search-sync', syncHeaderSearch);
    };
  }, [activeTab]);

  const handleHeaderSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setHeaderSearch(value);
      window.applyAdminHeaderSearch?.(value, activeTab);
    },
    [activeTab]
  );

  useEffect(() => {
    if (location.state?.storePreviewBlocked) {
      showTopFloatNotification('Cart, wishlist, and checkout are disabled in admin preview mode.');
      window.history.replaceState({}, document.title);
    }
  }, [location.state?.storePreviewBlocked]);

  useEffect(() => {
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    return () => clearAdminThemeFromDom();
  }, []);

  useEffect(() => {
    const onSettingsChanged = () => {
      setSidebarCollapsed(getSidebarCompactDefault());
      setCompactTables(getCompactTablesEnabled());
    };
    window.addEventListener('admin-settings-invalidate', onSettingsChanged);
    return () => window.removeEventListener('admin-settings-invalidate', onSettingsChanged);
  }, []);

  useEffect(() => {
    const onTabChanged = (e) => {
      const tab = e.detail;
      if (typeof tab === 'string') setActiveTab(tab);
    };
    window.addEventListener('admin-tab-changed', onTabChanged);
    return () => window.removeEventListener('admin-tab-changed', onTabChanged);
  }, []);

  const canAccessDashboard = isDashboardUser(user);

  const { items: adminNotificationsRaw, markRead, markAllRead, refresh: refreshNotifications } = useNotifications({
    enabled: canAccessDashboard,
    pollMs: 30000,
  });

  const adminNotifications = useMemo(() => {
    if (user?.role !== 'staff') return adminNotificationsRaw;
    const blocked = new Set([
      'driver_application',
      'driver_rejected',
      'delivery_accepted',
      'delivery_unassigned',
    ]);
    return adminNotificationsRaw.filter((n) => !blocked.has(n.type));
  }, [adminNotificationsRaw, user?.role]);

  const badgeCounts = useMemo(
    () => ({
      support: adminNotifications.filter(
        (n) => ['new_support_ticket', 'support_message'].includes(n.type) && n.unread
      ).length,
      drivers: adminNotifications.filter((n) => n.type === 'driver_application' && n.unread).length,
      delivery: adminNotifications.filter(
        (n) => ['driver_rejected', 'delivery_accepted'].includes(n.type) && n.unread
      ).length,
    }),
    [adminNotifications]
  );

  const adminName = useMemo(() => {
    const name = user?.fullName?.trim() || localStorage.getItem('userFullName') || 'Admin';
    return name === 'Admin User' ? 'Abdirahman' : name.split(' ')[0] || name;
  }, [user?.fullName]);

  const adminAvatar = useMemo(
    () =>
      user?.avatar ||
      localStorage.getItem('userAvatar') ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(adminName)}&background=073D35&color=ffffff&bold=true&size=128`,
    [user?.avatar, adminName]
  );

  const adminEmail = user?.email || localStorage.getItem('userEmail') || '';

  const handleTabChange = useCallback(
    (tab) => {
      if (!canAccessAdminTab(user, tab)) return;
      setSidebarMobile(false);
      setActiveTab(tab);
    },
    [user]
  );

  useEffect(() => {
    if (!canAccessAdminTab(user, activeTab)) {
      setActiveTab('dashboard');
    }
  }, [user, activeTab]);

  const handleToggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setSidebarMobile((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  }, []);

  if (!canAccessDashboard) {
    return <AdminAccessDenied />;
  }

  return (
    <div
      className={[ADMIN_PAGE_BG, 'admin-page', isDark ? 'admin-dark' : ''].filter(Boolean).join(' ')}
      data-theme={isDark ? 'dark' : 'light'}
      data-admin-theme={isDark ? 'dark' : 'light'}
    >
      <div className="flex min-h-screen" id="adminAppContent">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarMobile}
          onCloseMobile={() => setSidebarMobile(false)}
          badgeCounts={badgeCounts}
          userRole={user?.role}
        />

        <main
          className={[
            'min-h-screen flex-1 transition-[margin-left] duration-300 max-md:ml-0',
            activeTab === 'dashboard' ? 'p-4 pt-3 max-md:p-3' : activeTab === 'orders' || activeTab === 'payments' ? 'p-4 pt-3 max-md:p-3' : 'p-[22px_28px] max-md:p-4',
            sidebarCollapsed ? 'ml-[72px]' : 'ml-[220px]',
            compactTables ? 'admin-compact-tables' : '',
            activeTab === 'support'
              ? 'flex h-screen max-h-screen flex-col overflow-hidden p-2 max-md:p-2'
              : activeTab === 'payments'
                ? 'flex h-screen max-h-screen flex-col overflow-hidden'
                : '',
          ].join(' ')}
        >
          <div
            id="adminDataLoading"
            className="pointer-events-none absolute inset-0 z-40 hidden items-center justify-center bg-white/70 backdrop-blur-[2px] dark:bg-[#0b1412]/70"
            aria-live="polite"
            aria-hidden="true"
          >
            <div className="flex items-center gap-3 rounded-2xl border border-deepGreen/10 bg-white px-5 py-3.5 text-[0.88rem] font-bold text-deepGreen shadow-[0_8px_24px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#1a2421] dark:text-[#d7e2de]">
              <i className="fa-solid fa-spinner fa-spin" aria-hidden="true" />
              <span>Syncing latest data…</span>
            </div>
          </div>

          {activeTab !== 'support' && (
            <AdminHeader
              activeTab={activeTab}
              adminName={adminName}
              adminEmail={adminEmail}
              adminAvatar={adminAvatar}
              onToggleSidebar={handleToggleSidebar}
              onTabChange={handleTabChange}
              onLogout={logout}
              headerSearch={headerSearch}
              onHeaderSearchChange={handleHeaderSearchChange}
              notifications={adminNotifications}
              onMarkNotificationRead={markRead}
              onMarkAllNotificationsRead={markAllRead}
              onRefreshNotifications={refreshNotifications}
              compact={activeTab === 'dashboard' || activeTab === 'orders' || activeTab === 'payments'}
              showSettings={user?.role === 'admin'}
              showViewStore={user?.role === 'admin'}
            />
          )}

          <div className={activeTab === 'products' ? '' : 'hidden'} aria-hidden={activeTab !== 'products'}>
            <AdminProductsTab headerSearch={headerSearch} />
          </div>

          <div
            key={activeTab}
            className={
              activeTab === 'support' || activeTab === 'payments'
                ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
                : 'animate-profileTabIn'
            }
          >
          {activeTab === 'dashboard' && (
            <DashboardAdminTab
              headerSearch={headerSearch}
              onTabChange={handleTabChange}
              userRole={user?.role}
            />
          )}
          {activeTab === 'orders' && <AdminOrdersTab headerSearch={headerSearch} />}
          {activeTab === 'users' && <AdminUsersTab headerSearch={headerSearch} />}
          {activeTab === 'stock' && <AdminStockTab headerSearch={headerSearch} />}
          {activeTab === 'payments' && <AdminPaymentsTab headerSearch={headerSearch} />}
          {activeTab === 'delivery' && <AdminDeliveryTab headerSearch={headerSearch} />}
          {activeTab === 'support' && (
            <AdminSupportTab headerSearch={headerSearch} onToggleSidebar={handleToggleSidebar} />
          )}
          {activeTab === 'settings' && <AdminSettingsTab />}
          {activeTab === 'driver-applications' && <DriverApplicationsTab />}
          {activeTab === 'reviews' && <AdminReviewsTab />}
          {activeTab === 'cms' && <CmsAdminTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
