import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminTheme } from '../hooks/useAdminTheme';
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
  AdminSettingsTab,
} from '../features/admin/AdminOpsTabs';
import {
  CmsAdminTab,
  CategoriesAdminTab,
  ReviewsAdminTab,
  DriverApplicationsTab,
} from '../features/admin/AdminManageTabs';

const ADMIN_PAGE_BG =
  'min-h-screen overflow-x-hidden font-sans text-gray-900 bg-[radial-gradient(circle_at_top_right,rgba(216,161,40,0.08),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(7,61,53,0.06),transparent_32%),#FAF8F2] [.admin-dark_&]:bg-[radial-gradient(circle_at_top_right,rgba(216,161,40,0.06),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(15,111,100,0.08),transparent_32%),#0b1412] [.admin-dark_&]:text-[#e8eeec]';

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
  'categories',
  'reviews',
]);

export default function Admin() {
  const { user, logout, syncFromStorage } = useAuth();
  useAdminPage();
  const { isDark } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
    syncFromStorage();
  }, [syncFromStorage]);

  useEffect(() => {
    const onTabChanged = (e) => {
      const tab = e.detail;
      if (typeof tab === 'string') setActiveTab(tab);
    };
    window.addEventListener('admin-tab-changed', onTabChanged);
    return () => window.removeEventListener('admin-tab-changed', onTabChanged);
  }, []);

  const isAdmin = user?.isLoggedIn && user?.role === 'admin';

  const { items: adminNotifications, markRead, refresh: refreshNotifications } = useNotifications({
    enabled: isAdmin,
    pollMs: 30000,
  });

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

  const handleTabChange = useCallback((tab) => {
    setSidebarMobile(false);
    setActiveTab(tab);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (window.innerWidth <= 768) {
      setSidebarMobile((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  }, []);

  if (!isAdmin) {
    return <AdminAccessDenied />;
  }

  return (
    <div
      className={[ADMIN_PAGE_BG, isDark ? 'admin-dark' : ''].filter(Boolean).join(' ')}
      data-theme={isDark ? 'dark' : 'light'}
    >
      <div className="flex min-h-screen" id="adminAppContent">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          collapsed={sidebarCollapsed}
          mobileOpen={sidebarMobile}
          onCloseMobile={() => setSidebarMobile(false)}
          badgeCounts={badgeCounts}
        />

        <main
          className={[
            'min-h-screen flex-1 p-[22px_28px] max-md:ml-0 max-md:p-4 transition-[margin-left] duration-300',
            sidebarCollapsed ? 'ml-[72px]' : 'ml-[220px]',
            activeTab === 'support'
              ? 'flex h-screen max-h-screen flex-col overflow-hidden pb-5 max-md:h-auto max-md:max-h-none max-md:overflow-visible'
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
            onRefreshNotifications={refreshNotifications}
          />

          {activeTab === 'dashboard' && (
            <DashboardAdminTab
              adminName={adminName}
              headerSearch={headerSearch}
              onTabChange={handleTabChange}
            />
          )}
          {activeTab === 'products' && <AdminProductsTab headerSearch={headerSearch} />}
          {activeTab === 'orders' && <AdminOrdersTab headerSearch={headerSearch} />}
          {activeTab === 'users' && <AdminUsersTab headerSearch={headerSearch} />}
          {activeTab === 'stock' && <AdminStockTab headerSearch={headerSearch} />}
          {activeTab === 'payments' && <AdminPaymentsTab />}
          {activeTab === 'delivery' && <AdminDeliveryTab />}
          {activeTab === 'support' && <AdminSupportTab headerSearch={headerSearch} />}
          {activeTab === 'settings' && <AdminSettingsTab />}
          {activeTab === 'driver-applications' && <DriverApplicationsTab />}
          {activeTab === 'reviews' && <ReviewsAdminTab />}
          {activeTab === 'cms' && <CmsAdminTab />}
          {activeTab === 'categories' && <CategoriesAdminTab />}
        </main>
      </div>
    </div>
  );
}
