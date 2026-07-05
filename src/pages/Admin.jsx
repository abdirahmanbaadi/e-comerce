import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAdminTheme } from '../hooks/useAdminTheme';
import { useAdminPage } from '../hooks/pages/useAdminPage';
import { useNotifications } from '../hooks/useNotifications';
import AdminAccessDenied from '../components/admin/AdminAccessDenied';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import DriverApplicationsTab from '../components/admin/DriverApplicationsTab';
import ReviewsAdminTab from '../components/admin/ReviewsAdminTab';
import CmsAdminTab from '../components/admin/CmsAdminTab';
import CategoriesAdminTab from '../components/admin/CategoriesAdminTab';
import '../styles/pages/Admin.css';

export default function Admin() {
  const { user, logout, syncFromStorage } = useAuth();
  useAdminPage();
  const { isDark } = useAdminTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMobile, setSidebarMobile] = useState(false);

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

  const { items: adminNotifications } = useNotifications({ enabled: isAdmin, pollMs: 15000 });

  const badgeCounts = useMemo(
    () => ({
      support: adminNotifications.filter((n) => n.type === 'new_support_ticket' && n.unread).length,
      drivers: adminNotifications.filter((n) => n.type === 'driver_application' && n.unread).length,
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
    if (tab === 'driver-applications' || tab === 'cms' || tab === 'categories' || tab === 'reviews') {
      return;
    }
    if (window.switchTab) {
      window.switchTab(tab);
    }
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
    <div className={`admin-page ${isDark ? 'admin-dark' : ''}`} data-theme={isDark ? 'dark' : 'light'}>
          {/* Main Dashboard Application Wrapper */}
          <div className={`admin-wrapper ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} id="adminAppContent">
      
              <AdminSidebar
                activeTab={activeTab}
                onTabChange={handleTabChange}
                collapsed={sidebarCollapsed}
                mobileOpen={sidebarMobile}
                onCloseMobile={() => setSidebarMobile(false)}
                badgeCounts={badgeCounts}
              />
      
              {/* Main Panel Content */}
              <main className={`admin-main ${activeTab === 'support' ? 'support-mode' : ''}`}>

                  <div id="adminDataLoading" className="admin-data-loading" style={{ display: 'none' }} aria-live="polite">
                    <div className="admin-data-loading-inner">
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
                  />

                  {activeTab === 'driver-applications' && <DriverApplicationsTab />}
                  {activeTab === 'reviews' && <ReviewsAdminTab />}
                  {activeTab === 'cms' && <CmsAdminTab />}
                  {activeTab === 'categories' && <CategoriesAdminTab />}

                  <div className={activeTab === 'driver-applications' || activeTab === 'cms' || activeTab === 'categories' || activeTab === 'reviews' ? 'd-none' : ''}>
      
                  {/* ==================== TAB 1: OVERVIEW ==================== */}
                  <div id="tab-dashboard" className="tab-pane active">

                      <div className="admin-welcome-strip mb-3">
                        <div>
                          <p className="admin-welcome-eyebrow">Dashboard Overview</p>
                          <h2 className="admin-welcome-title">
                            Welcome back, <span id="adminGreetingName">{adminName}</span>
                          </h2>
                          <p className="admin-welcome-sub" id="currentDateDisplay">—</p>
                        </div>
                        <span className="admin-live-badge" id="apiConnectionBadge">
                          MongoDB · syncing…
                        </span>
                      </div>
      
                      {/* Stats Grid */}
                      <div className="stats-grid stats-grid--compact mb-3">
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Total Orders</span>
                                  <span className="stat-value" id="statTotalOrders">—</span>
                                  <span className="stat-trend up" id="statTrendOrders" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>—</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(8, 116, 67, 0.1)', color: 'var(--success)' }}>
                                  <i className="fa-solid fa-bag-shopping"></i>
                              </div>
                          </div>
      
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Total Users</span>
                                  <span className="stat-value" id="statTotalCustomers">—</span>
                                  <span className="stat-trend up" id="statTrendUsers" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>—</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                  <i className="fa-solid fa-user-group"></i>
                              </div>
                          </div>
      
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Total Revenue</span>
                                  <span className="stat-value" id="statTotalSales">—</span>
                                  <span className="stat-trend down" id="statTrendRevenue" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>—</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(216, 161, 40, 0.1)', color: 'var(--gold)' }}>
                                  <i className="fa-solid fa-dollar-sign"></i>
                              </div>
                          </div>
      
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Total Products</span>
                                  <span className="stat-value" id="statActiveProducts">—</span>
                                  <span className="stat-trend up" id="statTrendProducts" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Live</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                  <i className="fa-solid fa-couch"></i>
                              </div>
                          </div>
                      </div>
      
                      {/* Row 1: Sales Overview (Chart) & Support Requests */}
                      <div className="row g-3 mb-3">
                          <div className="col-lg-8">
                              <div className="table-card h-100" style={{ padding: '16px 20px' }}>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                      <h3 className="card-title mb-0" style={{ fontSize: '0.9rem' }}>Sales Overview</h3>
                                  </div>
                                  <div className="chart-container" style={{ position: 'relative', height: '260px', width: '100%' }}>
                                      <canvas id="salesLineChart"></canvas>
                                  </div>
                              </div>
                          </div>
                          <div className="col-lg-4">
                              <div className="table-card h-100" style={{ padding: '16px 20px' }}>
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h3 className="card-title mb-0" style={{ fontSize: '0.9rem' }}>Support Requests</h3>
                                      <button className="btn btn-sm btn-link text-decoration-none fw-bold p-0" onClick={() => window.switchTab?.('support')} style={{ fontSize: '0.78rem', color: '#3b82f6' }}>View all</button>
                                  </div>
                                  <div id="recentSupportListContainer" className="dashboard-list">
                                      {/* Loaded dynamically */}
                                  </div>
                              </div>
                          </div>
                      </div>
      
                      {/* Row 2: Recent Orders Row */}
                      <div className="row g-3 mb-3">
                          <div className="col-12">
                              <div className="table-card" style={{ padding: '16px 20px' }}>
                                  <div className="d-flex justify-content-between align-items-center mb-3">
                                      <h3 className="card-title mb-0" style={{ fontSize: '0.9rem' }}>Recent Orders</h3>
                                      <button className="btn btn-sm btn-link text-decoration-none fw-semibold p-0" onClick={() => window.switchTab?.('orders')} style={{ fontSize: '0.78rem', color: '#3b82f6' }}>View all orders</button>
                                  </div>
                                  <div className="table-responsive">
                                      <table className="table admin-table align-middle" style={{ marginBottom: '0' }}>
                                          <thead>
                                              <tr>
                                                  <th>Order ID</th>
                                                  <th>Customer</th>
                                                  <th>Status</th>
                                                  <th>Amount</th>
                                                  <th>Date</th>
                                                  <th>Actions</th>
                                              </tr>
                                          </thead>
                                          <tbody id="recentOrdersListContainer">
                                              {/* Loaded dynamically */}
                                          </tbody>
                                      </table>
                                  </div>
                              </div>
                          </div>
                      </div>
      
                  </div>
      
                  {/* ==================== TAB 2: PRODUCTS ==================== */}
                  <div id="tab-products" className="tab-pane">
                      <div className="table-card" style={{ padding: '24px' }}>
                          {/* Row 1: Search and Add Button */}
                          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-3">
                              <div className="search-box-wrapper" style={{ maxWidth: '320px', marginBottom: '0' }}>
                                  <i className="fa-solid fa-magnifying-glass"></i>
                                  <input type="text" id="productSearchQuery" placeholder="Search products..."
                                      oninput="filterProductsTable()" />
                              </div>
                              <button className="btn-add-action" onClick={() => window.openAddProductModal?.()}>
                                  <i className="fa-solid fa-plus"></i> Add Product
                              </button>
                          </div>
      
                          {/* Row 2: Categories, Status, Stock dropdown filters */}
                          <div className="d-flex gap-3 flex-wrap align-items-center mb-4">
                              <select id="productFilterCategory" className="admin-select" onchange="filterProductsTable()">
                                  <option value="all">All Categories</option>
                                  <option value="chair">Chairs</option>
                                  <option value="bedroom">Bedroom</option>
                                  <option value="living-room">Living Room</option>
                                  <option value="dining-room">Dining Room</option>
                                  <option value="outdoor">Outdoor</option>
                                  <option value="office">Office</option>
                              </select>
      
                              <select id="productFilterStatus" className="admin-select" onchange="filterProductsTable()">
                                  <option value="all">All Status</option>
                                  <option value="Active">Active</option>
                                  <option value="Inactive">Inactive</option>
                              </select>
      
                              <select id="productFilterStock" className="admin-select" onchange="filterProductsTable()">
                                  <option value="all">All Stock</option>
                                  <option value="in-stock">In Stock</option>
                                  <option value="out-of-stock">Out of Stock</option>
                              </select>
                          </div>
      
                          <div className="table-responsive">
                              <table className="admin-table">
                                  <thead>
                                      <tr>
                                          <th>Product</th>
                                          <th>Category</th>
                                          <th>Price</th>
                                          <th>Stock</th>
                                          <th>Status</th>
                                          <th>Action</th>
                                      </tr>
                                  </thead>
                                  <tbody id="productsTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 3: ORDERS ==================== */}
                  <div id="tab-orders" className="tab-pane">
                      {/* Filter Row */}
                      <div className="table-card mb-3" style={{ padding: '16px 20px' }}>
                          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                              {/* Left filters */}
                              <div className="d-flex align-items-center flex-wrap gap-2" style={{ flex: '1', maxWidth: '800px' }}>
                                  {/* Search box */}
                                  <div className="search-box-wrapper" style={{ maxWidth: '250px', marginBottom: '0' }}>
                                      <i className="fa-solid fa-magnifying-glass"></i>
                                      <input type="text" id="orderSearchQuery" placeholder="Search orders..." oninput="onOrderFilterChange()" />
                                  </div>
                                  
                                  {/* Status filter */}
                                  <select id="orderFilterStatus" className="admin-select" onchange="onOrderFilterChange()">
                                      <option value="all">All Status</option>
                                      <option value="Delivered">Delivered</option>
                                      <option value="Pending">Pending</option>
                                      <option value="Shipped">Shipped</option>
                                      <option value="Cancelled">Cancelled</option>
                                      <option value="Processing">Processing</option>
                                  </select>
      
                                  {/* Payment filter */}
                                  <select id="orderFilterPayment" className="admin-select" onchange="onOrderFilterChange()">
                                      <option value="all">All Payment</option>
                                      <option value="Paid">Paid</option>
                                      <option value="Pending">Pending</option>
                                      <option value="Failed">Failed</option>
                                  </select>
      
                                  {/* Date filter */}
                                  <select id="orderFilterDate" className="admin-select" onchange="onOrderFilterChange()">
                                      <option value="all">All Date</option>
                                      <option value="today">Today</option>
                                      <option value="yesterday">Yesterday</option>
                                      <option value="week">This Week</option>
                                  </select>
                              </div>
      
                              {/* Right Actions */}
                              <div>
                                  <button className="btn btn-success rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-2" onClick={() => window.exportOrdersToCSV?.()} style={{ backgroundColor: '#10b981', border: 'none', fontSize: '0.82rem' }}>
                                      <i className="fa-solid fa-download"></i> Export
                                  </button>
                              </div>
                          </div>
                      </div>
      
                      {/* Table Card */}
                      <div className="table-card mb-4" style={{ padding: '16px 20px' }}>
                          <div className="table-responsive">
                              <table className="table admin-table align-middle" style={{ marginBottom: '0' }}>
                                  <thead>
                                      <tr>
                                          <th>Order ID</th>
                                          <th>Customer</th>
                                          <th>Status</th>
                                          <th>Payment</th>
                                          <th>Amount</th>
                                          <th>Date</th>
                                          <th>Action</th>
                                      </tr>
                                  </thead>
                                  <tbody id="ordersTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
      
                          {/* Pagination Footer */}
                          <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top flex-wrap gap-2">
                              <div className="text-secondary fw-semibold" id="orderPaginationInfo" style={{ fontSize: '0.8rem' }}>
                                  Showing 1 to 7 of 45 orders
                              </div>
                              <nav aria-label="Order pagination">
                                  <ul className="pagination pagination-sm mb-0 gap-1" id="orderPaginationButtons">
                                      {/* Loaded dynamically */}
                                  </ul>
                              </nav>
                          </div>
                      </div>
      
                      {/* Order Statistics Section */}
                      <div className="order-stats-section mt-4">
                          <h3 className="card-title mb-3" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--deep-green)' }}>Order Statistics</h3>
                          <div className="stats-grid">
                              <div className="stat-card" style={{ padding: '14px 18px' }}>
                                  <div className="stat-info">
                                      <span className="stat-label" style={{ fontSize: '0.72rem' }}>Total Orders</span>
                                      <span className="stat-value" id="statsTotalOrdersCount" style={{ fontSize: '1.55rem', margin: '4px 0' }}>—</span>
                                      <span className="stat-trend up" id="statsTotalOrdersTrend" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-fit' }}>—</span>
                                  </div>
                                  <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', width: '44px', height: '44px', borderRadius: '50%' }}>
                                      <i className="fa-solid fa-bag-shopping" style={{ fontSize: '1.10rem' }}></i>
                                  </div>
                              </div>
      
                              <div className="stat-card" style={{ padding: '14px 18px' }}>
                                  <div className="stat-info">
                                      <span className="stat-label" style={{ fontSize: '0.72rem' }}>Pending Orders</span>
                                      <span className="stat-value" id="statsPendingOrdersCount" style={{ fontSize: '1.55rem', margin: '4px 0' }}>—</span>
                                      <span className="stat-trend up" id="statsPendingOrdersTrend" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-fit' }}>Active</span>
                                  </div>
                                  <div className="stat-icon-wrapper" style={{ background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', width: '44px', height: '44px', borderRadius: '50%' }}>
                                      <i className="fa-solid fa-clock" style={{ fontSize: '1.10rem' }}></i>
                                  </div>
                              </div>
      
                              <div className="stat-card" style={{ padding: '14px 18px' }}>
                                  <div className="stat-info">
                                      <span className="stat-label" style={{ fontSize: '0.72rem' }}>Delivered Orders</span>
                                      <span className="stat-value" id="statsDeliveredOrdersCount" style={{ fontSize: '1.55rem', margin: '4px 0' }}>—</span>
                                      <span className="stat-trend up" id="statsDeliveredOrdersTrend" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-fit' }}>—</span>
                                  </div>
                                  <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '44px', height: '44px', borderRadius: '50%' }}>
                                      <i className="fa-solid fa-circle-check" style={{ fontSize: '1.10rem' }}></i>
                                  </div>
                              </div>
      
                              <div className="stat-card" style={{ padding: '14px 18px' }}>
                                  <div className="stat-info">
                                      <span className="stat-label" style={{ fontSize: '0.72rem' }}>Cancelled Orders</span>
                                      <span className="stat-value" id="statsCancelledOrdersCount" style={{ fontSize: '1.55rem', margin: '4px 0' }}>—</span>
                                      <span className="stat-trend down" id="statsCancelledOrdersTrend" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', display: 'inline-fit' }}>—</span>
                                  </div>
                                  <div className="stat-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '44px', height: '44px', borderRadius: '50%' }}>
                                      <i className="fa-solid fa-circle-xmark" style={{ fontSize: '1.10rem' }}></i>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 4: CUSTOMERS ==================== */}
                  <div id="tab-users" className="tab-pane">
                      <div className="table-card" style={{ padding: '24px' }}>
                          <div className="search-filter-row mb-3">
                              <div className="search-box-wrapper" style={{ maxWidth: '320px', marginBottom: '0' }}>
                                  <i className="fa-solid fa-magnifying-glass"></i>
                                  <input type="text" id="customerSearchQuery" placeholder="Search customer accounts..."
                                      oninput="filterCustomersTable()" />
                              </div>
                          </div>
      
                          <div className="table-responsive" style={{ maxHeight: '480px', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '12px' }}>
                              <table className="table admin-table align-middle" style={{ marginBottom: '0' }}>
                                  <thead style={{ position: 'sticky', top: '0', backgroundColor: '#ffffff', zIndex: 5, borderBottom: '2px solid var(--light-gray)' }}>
                                      <tr>
                                          <th>User</th>
                                          <th>Email / Phone</th>
                                          <th>Role</th>
                                          <th>Status</th>
                                          <th>Orders</th>
                                          <th>Last Login</th>
                                          <th>Joined</th>
                                          <th>Action</th>
                                      </tr>
                                  </thead>
                                  <tbody id="customersTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 5: SETTINGS ==================== */}
                  <div id="tab-settings" className="tab-pane">
                      <div className="row">
                          <div className="col-md-6 mb-4">
                              <div className="table-card">
                                  <h3 className="card-title mb-4"><i className="fa-solid fa-truck-fast me-2"></i> Delivery Settings
                                  </h3>
      
                                  <div className="mb-3">
                                      <label className="admin-form-label">Toggle Store Status</label>
                                      <div className="form-check form-switch pt-1">
                                          <input className="form-check-input" type="checkbox" id="settingStoreActive" checked
                                              style={{ cursor: 'pointer', width: '44px', height: '22px' }} />
                                          <label className="form-check-label ms-2 fw-bold text-success"
                                              id="storeStatusLabel">Store Open & Accepting Orders</label>
                                      </div>
                                  </div>
      
                                  <hr className="my-4" style={{ opacity: 0.08 }} />
      
                                  <h5 className="fw-bold mb-3" style={{ fontSize: '0.95rem', color: 'var(--deep-green)' }}>District
                                      Delivery Fees</h5>
                                  <div className="row g-3 mb-3">
                                      <div className="col-6">
                                          <label className="admin-form-label">Hodan Delivery Fee ($)</label>
                                          <input type="number" step="0.001" className="admin-form-control" id="deliveryFeeHodan" defaultValue="0.001" />
                                      </div>
                                      <div className="col-6">
                                          <label className="admin-form-label">Wadajir Delivery Fee ($)</label>
                                          <input type="number" step="0.001" className="admin-form-control" id="deliveryFeeWadajir" defaultValue="0.001" />
                                      </div>
                                      <div className="col-6">
                                          <label className="admin-form-label">Karaan Delivery Fee ($)</label>
                                          <input type="number" step="0.001" className="admin-form-control" id="deliveryFeeKaraan" defaultValue="0.002" />
                                      </div>
                                      <div className="col-6">
                                          <label className="admin-form-label">Hamarweyne Delivery Fee ($)</label>
                                          <input type="number" step="0.001" className="admin-form-control" id="deliveryFeeHamarweyne"
                                              defaultValue="0.001" />
                                      </div>
                                  </div>
      
                                  <button className="btn-admin-submit py-2" onClick={() => window.saveSettings?.()}>Save Configuration</button>
                              </div>
                          </div>
      
                          <div className="col-md-6 mb-4">
                              <div className="table-card">
                                  <h3 className="card-title mb-4"><i className="fa-solid fa-shield-halved me-2"></i> System
                                      Diagnostics</h3>
      
                                  <div className="mb-3">
                                      <span className="d-block fw-bold text-secondary mb-1" style={{ fontSize: '0.84rem' }}>DATA
                                          STORAGE ENGINE</span>
                                      <span className="d-block font-monospace fw-bold"
                                          style={{ fontSize: '0.9rem', color: 'var(--deep-green)' }}><i
                                              className="fa-solid fa-database me-2"></i> MongoDB Atlas (Cloud Database)</span>
                                  </div>

                                  <div className="mb-3">
                                      <span className="d-block fw-bold text-secondary mb-1"
                                          style={{ fontSize: '0.84rem' }}>API CONNECTION</span>
                                      <div className="d-flex align-items-center gap-2 pt-1">
                                          <span className="badge-status instock font-monospace"
                                              id="apiConnectionBadge">Connected via REST API</span>
                                      </div>
                                  </div>
      
                                  <hr className="my-4" style={{ opacity: 0.08 }} />
      
                                  <h5 className="fw-bold mb-3 text-danger" style={{ fontSize: '0.95rem' }}>Danger Zone</h5>
                                  <p style={{ fontSize: '0.82rem', color: '#666' }}>
                                      Clears browser cache only. All products, orders, and users remain stored in MongoDB.
                                  </p>
                                  <button className="btn btn-outline-danger btn-sm fw-bold border-2 rounded-3 py-2 px-3 mt-2"
                                      onClick={() => window.resetSystemData?.()}>
                                      <i className="fa-solid fa-triangle-exclamation me-1"></i> Reset Databases to Default
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
                  {/* ==================== TAB 6: STOCK MANAGEMENT ==================== */}
                  <div id="tab-stock" className="tab-pane">
                      <div className="table-card">
                          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                              <h3 className="card-title mb-0"><i className="fa-solid fa-cubes me-2"></i> Inventory & Stock Control</h3>
                              <div className="d-flex gap-2">
                                  <div className="search-box-wrapper" style={{ maxWidth: '250px', marginBottom: '0' }}>
                                      <i className="fa-solid fa-magnifying-glass" />
                                      <input type="text" id="stockSearchQuery" placeholder="Search inventory..." oninput="filterStockTable()" />
                                  </div>
                                  <button className="btn btn-outline-success btn-sm border-2 fw-bold" onClick={() => window.saveAllStockLevels?.()}><i className="fa-solid fa-save me-1"></i> Save All</button>
                              </div>
                          </div>
                          
                          <div className="table-responsive">
                              <table className="table admin-table align-middle">
                                  <thead>
                                      <tr>
                                          <th>Image</th>
                                          <th>Product Name</th>
                                          <th>Category</th>
                                          <th>Price</th>
                                          <th style={{ width: '160px' }}>Stock Level</th>
                                          <th>Status</th>
                                          <th>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody id="stockTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 7: PAYMENTS ==================== */}
                  <div id="tab-payments" className="tab-pane">
                      <div className="stats-grid mb-4">
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Total Revenue</span>
                                  <span className="stat-value" id="paymentTotalRevenue">$0.00</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(8, 116, 67, 0.1)', color: 'var(--success)' }}>
                                  <i className="fa-solid fa-sack-dollar"></i>
                              </div>
                          </div>
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">EVC Plus Share</span>
                                  <span className="stat-value" id="paymentEvcRevenue">$0.00</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(216, 161, 40, 0.1)', color: 'var(--gold)' }}>
                                  <i className="fa-solid fa-mobile-screen"></i>
                              </div>
                          </div>
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Cash on Delivery Share</span>
                                  <span className="stat-value" id="paymentSahalRevenue">$0.00</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(15, 111, 100, 0.1)', color: 'var(--teal)' }}>
                                  <i className="fa-solid fa-wallet"></i>
                              </div>
                          </div>
                      </div>
      
                      <div className="table-card">
                          <h3 className="card-title mb-4"><i className="fa-solid fa-credit-card me-2"></i> Payment Transactions History</h3>
                          <div className="table-responsive">
                              <table className="table admin-table align-middle">
                                  <thead>
                                      <tr>
                                          <th>Transaction ID</th>
                                          <th>Customer</th>
                                          <th>Phone</th>
                                          <th>Payment Method</th>
                                          <th>Amount</th>
                                          <th>Status</th>
                                          <th>Date</th>
                                          <th>Action</th>
                                      </tr>
                                  </thead>
                                  <tbody id="paymentsTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 8: DELIVERY ==================== */}
                  <div id="tab-delivery" className="tab-pane">
                      <div className="stats-grid mb-4">
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Active Shipments</span>
                                  <span className="stat-value" id="deliveryActiveCount">0</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(15, 111, 100, 0.1)', color: 'var(--teal)' }}>
                                  <i className="fa-solid fa-truck-ramp-box"></i>
                              </div>
                          </div>
                          <div className="stat-card">
                              <div className="stat-info">
                                  <span className="stat-label">Delivered Orders</span>
                                  <span className="stat-value" id="deliveryCompletedCount">0</span>
                              </div>
                              <div className="stat-icon-wrapper" style={{ background: 'rgba(8, 116, 67, 0.1)', color: 'var(--success)' }}>
                                  <i className="fa-solid fa-circle-check"></i>
                              </div>
                          </div>
                      </div>
      
                      <div className="table-card">
                          <h3 className="card-title mb-4"><i className="fa-solid fa-truck me-2"></i> Order Dispatch & Stage Tracking</h3>
                          <div className="table-responsive">
                              <table className="table admin-table align-middle">
                                  <thead>
                                      <tr>
                                          <th>Order ID</th>
                                          <th>Customer</th>
                                          <th>District</th>
                                          <th>Courier Details</th>
                                          <th>Estimated Arrival</th>
                                          <th>Tracking Stage</th>
                                          <th>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody id="deliveryTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 9: SUPPORT ==================== */}
                  <div id="tab-support" className="tab-pane">
                      <div className="support-inbox-layout">
                          {/* Left Sidebar: Inbox List */}
                          <div className="support-sidebar">
                              <div className="support-sidebar-header">
                                  <div className="support-search w-100">
                                      <i className="fa-solid fa-magnifying-glass"></i>
                                      <input type="text" id="supportSearchInput" placeholder="Search messages..." oninput="onSupportSearchOrFilter()" />
                                  </div>
                                  <select id="supportFilterStatus" className="support-filter-select" onchange="onSupportSearchOrFilter()" style={{ display: 'none' }}>
                                      <option value="all">All Status</option>
                                      <option value="Open">New / Open</option>
                                      <option value="Pending">Pending</option>
                                      <option value="Replied">Replied</option>
                                      <option value="Closed">Closed</option>
                                  </select>
                              </div>
                              <div className="support-ticket-list" id="supportInboxList">
                                  {/* Loaded dynamically */}
                              </div>
                          </div>
                          
                          {/* Right Chat Area */}
                          <div className="support-chat-window" id="supportChatWindow">
                              {/* Loaded dynamically based on active ticket */}
                          </div>
                      </div>
                  </div>
      
                  {/* ==================== TAB 10: REVIEWS ==================== */}
                  <div id="tab-reviews" className="tab-pane">
                      <div className="table-card">
                          <h3 className="card-title mb-4"><i className="fa-solid fa-star me-2"></i> Customer Ratings & Product Reviews</h3>
                          <div className="table-responsive">
                              <table className="table admin-table align-middle">
                                  <thead>
                                      <tr>
                                          <th>Product</th>
                                          <th>Customer</th>
                                          <th>Rating</th>
                                          <th>Review Comment</th>
                                          <th>Date</th>
                                          <th>Status</th>
                                          <th>Actions</th>
                                      </tr>
                                  </thead>
                                  <tbody id="reviewsTableBody">
                                      {/* Loaded dynamically */}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  </div>
      
      
              </div>
              </main>
          </div>
      
          {/* Support Ticket Reply Modal */}
          <div className="modal fade" id="supportReplyModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title">Reply to Support Ticket</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                          <div className="mb-3">
                              <label className="admin-form-label">Customer Question</label>
                              <blockquote className="blockquote font-monospace p-3 bg-light rounded-3" id="supportQuestionText" style={{ fontSize: '0.86rem', borderLeft: '4px solid var(--gold)' }}>
                                  ---
                              </blockquote>
                          </div>
                          <div className="mb-3">
                              <label className="admin-form-label" htmlFor="supportReplyMessage">Your Answer</label>
                              <textarea className="admin-form-control" id="supportReplyMessage" rows="4" placeholder="Type your answer here..."></textarea>
                          </div>
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="btn btn-secondary rounded-3" data-bs-dismiss="modal">Close</button>
                          <button type="button" className="btn btn-primary rounded-3 bg-success border-0 px-4" onClick={() => window.submitSupportReply?.()}>Send Reply</button>
                      </div>
                  </div>
              </div>
          </div>
      
          {/* Delivery Edit Modal */}
          <div className="modal fade" id="deliveryEditModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title">Edit Dispatch Details</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                          <div className="mb-3">
                              <label className="admin-form-label" htmlFor="deliveryAssignDriver">Assign Approved Driver</label>
                              <p id="deliveryDriverHint" className="admin-form-hint mb-2">
                                  Offline drivers are blocked. Busy drivers accept new orders until they reach 3 active deliveries.
                              </p>
                              <select className="admin-form-control" id="deliveryAssignDriver">
                                  <option value="">— Select driver —</option>
                              </select>
                          </div>
                          <div className="mb-3">
                              <label className="admin-form-label" htmlFor="deliveryCourier">Courier / Driver Info (manual override)</label>
                              <input type="text" className="admin-form-control" id="deliveryCourier" placeholder="e.g. Ahmed Ali - 0619988776" />
                          </div>
                          <div className="mb-3">
                              <label className="admin-form-label" htmlFor="deliveryEstimate">Estimated Arrival</label>
                              <input type="text" className="admin-form-control" id="deliveryEstimate" placeholder="e.g. Today, 4:00 PM" />
                          </div>
                          <div className="mb-3">
                              <label className="admin-form-label" htmlFor="deliveryStageSelect">Delivery Tracking Stage</label>
                              <select className="admin-form-control" id="deliveryStageSelect">
                                  <option value="1">Step 1: Order Placed</option>
                                  <option value="2">Step 2: Payment Verified</option>
                                  <option value="3">Step 3: Preparing Order</option>
                                  <option value="4">Step 4: Out for Delivery</option>
                                  <option value="5">Step 5: Delivered</option>
                              </select>
                          </div>
                      </div>
                      <div className="modal-footer">
                          <button type="button" className="btn btn-secondary rounded-3" data-bs-dismiss="modal">Cancel</button>
                          <button type="button" className="btn btn-primary rounded-3 bg-success border-0 px-4" onClick={() => window.submitDeliveryUpdate?.()}>Update Dispatch</button>
                      </div>
                  </div>
              </div>
          </div>
      
          {/* ==================== PRODUCT ADD/EDIT MODAL ==================== */}
          <div className="modal fade" id="productFormModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title" id="productModalTitle">Add New Product</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                          <form id="productForm" onsubmit="handleProductFormSubmit(event)">
                              <input type="hidden" id="formProductId" />
      
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductTitle">Product Title *</label>
                                  <input type="text" className="admin-form-control" id="formProductTitle"
                                      placeholder="e.g. Bloom Office Chair" required />
                              </div>
      
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductCategory">Category *</label>
                                      <select className="admin-select w-100" id="formProductCategory" required>
                                          <option value="chair">Chair</option>
                                          <option value="bedroom">Bedroom</option>
                                          <option value="living-room">Living Room</option>
                                          <option value="dining-room">Dining Room</option>
                                          <option value="outdoor">Outdoor</option>
                                          <option value="office">Office</option>
                                      </select>
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductMaterialType">Material Type *</label>
                                      <select className="admin-select w-100" id="formProductMaterialType" required>
                                          <option value="wood">Wood</option>
                                          <option value="velvet">Velvet</option>
                                          <option value="linen">Linen Fabric</option>
                                          <option value="rattan">Rattan</option>
                                          <option value="marble">Marble</option>
                                      </select>
                                  </div>
                              </div>
      
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductPrice">Price ($) *</label>
                                      <input type="number" className="admin-form-control" id="formProductPrice"
                                          placeholder="e.g. 150" min="1" required />
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductOldPrice">Old Price ($) Optional</label>
                                      <input type="number" className="admin-form-control" id="formProductOldPrice"
                                          placeholder="e.g. 180" min="1" />
                                  </div>
                              </div>
      
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductColor">Color Tone *</label>
                                      <input type="text" className="admin-form-control" id="formProductColor"
                                          placeholder="e.g. Charcoal Gray" required />
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductStockVal">Stock Quantity *</label>
                                      <input type="number" className="admin-form-control" id="formProductStockVal"
                                          placeholder="e.g. 12" min="0" required />
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formProductStatus">Catalog Status *</label>
                                      <select className="admin-select w-100" id="formProductStatus" required>
                                          <option value="Active">Active</option>
                                          <option value="Inactive">Inactive</option>
                                      </select>
                                  </div>
                              </div>
      
                              <div className="mb-3">
                                  <label className="admin-form-label d-flex align-items-center gap-2" htmlFor="formProductIsNewest">
                                      <input type="checkbox" id="formProductIsNewest" style={{ width: '16px', height: '16px' }} />
                                      Mark as New Arrival
                                  </label>
                              </div>
      
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductDescription">Product Description</label>
                                  <textarea className="admin-form-control" id="formProductDescription" rows={3}
                                      placeholder="Short description for customers (material, style, room fit…)" />
                              </div>
      
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductMaterialSpec">Material Details *</label>
                                  <input type="text" className="admin-form-control" id="formProductMaterialSpec"
                                      placeholder="e.g. Premium Ashwood, Solid Velvet Seating" required />
                              </div>

                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductDimensions">Dimensions (Optional)</label>
                                  <input type="text" className="admin-form-control" id="formProductDimensions"
                                      placeholder="e.g. 220cm x 95cm x 85cm" />
                              </div>
      
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductImageFile">Product Image (Upload
                                      Sawir)</label>
                                  <input type="file" className="form-control admin-form-control" id="formProductImageFile"
                                      accept="image/*" onchange="convertImageToBase64(this)" />
                                  <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px' }}>Sawirka aad doorato waxaa
                                      toos loogu badali doonaa Base64 data URL.</div>
                              </div>
      
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formProductImageUrl">Or Image URL Path</label>
                                  <input type="text" className="admin-form-control" id="formProductImageUrl"
                                      placeholder="e.g. chair/bloom-round-accent-chair-set-main.jpeg.png" />
                                  <div style={{ fontSize: '0.72rem', color: '#777', marginTop: '4px' }}>Haddii aadan kor ka soo
                                      dooran sawir, wuxuu qaadan doonaa URL koodka halkan ku qoran.</div>
                              </div>
      
                              <div className="text-end mt-4">
                                  <button type="button" className="btn-admin-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                                  <button type="submit" className="btn-admin-submit" id="btnProductFormSubmit">Save
                                      Product</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>

          {/* ==================== PRODUCT DETAILS MODAL ==================== */}
          <div className="modal fade" id="productDetailsModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title" id="productDetailsModalTitle">Product Details</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body" id="productDetailsModalBody">
                          <div className="text-center text-muted py-4">Loading product details...</div>
                      </div>
                  </div>
              </div>
          </div>
      
          {/* ==================== ORDER ACTIONS MODAL ==================== */}
          <div className="modal fade" id="orderEditModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title">Manage Order Details</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                          <div className="order-modal-details-grid">
                              <div>
                                  <div className="order-modal-section-title">Customer Information</div>
                                  <div className="order-spec-row"><span className="order-spec-label">Customer Name:</span> <span
                                          className="order-spec-value" id="orderModalName">---</span></div>
                                  <div className="order-spec-row"><span className="order-spec-label">Phone Number:</span> <span
                                          className="order-spec-value" id="orderModalPhone">---</span></div>
                                  <div className="order-spec-row"><span className="order-spec-label">Shipping Address:</span> <span
                                          className="order-spec-value" id="orderModalAddress">---</span></div>
      
                                  <div className="order-modal-section-title mt-4">Order Metadata</div>
                                  <div className="order-spec-row"><span className="order-spec-label">Order Date:</span> <span
                                          className="order-spec-value" id="orderModalDate">---</span></div>
                                  <div className="order-spec-row"><span className="order-spec-label">Preferred Delivery:</span> <span
                                          className="order-spec-value" id="orderModalDelivery">---</span></div>
                                  <div className="order-spec-row"><span className="order-spec-label">Total Amount:</span> <span
                                          className="order-spec-value" id="orderModalTotal"
                                          style={{ color: 'var(--deep-green)', fontWeight: 800 }}>---</span></div>
                                  <div className="order-spec-row"><span className="order-spec-label">Payment Reference:</span> <span
                                          className="order-spec-value" id="orderModalPaymentRef">—</span></div>
                                  <div className="order-modal-section-title mt-3">Order Breakdown</div>
                                  <div id="orderModalBreakdown" className="small"></div>
                              </div>
                              <div>
                                  <div className="order-modal-section-title">Purchased Items</div>
                                  <div className="order-items-summary-list" id="orderModalItemsList">
                                      {/* Loaded dynamically */}
                                  </div>
                                  <div className="order-modal-section-title mt-4">Order Activity</div>
                                  <div id="orderModalActivity" className="order-activity-timeline mt-2">
                                      <p className="text-muted mb-0 small">Loading activity...</p>
                                  </div>
                              </div>
                          </div>
      
                          <div className="order-modal-section-title mt-2">Manage Delivery Status & Assignments</div>
                          <form id="orderEditForm" onsubmit="handleOrderEditSubmit(event)">
                              <input type="hidden" id="formOrderId" />
      
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formOrderPayment">Payment Status</label>
                                      <select className="admin-select w-100" id="formOrderPayment" required>
                                          <option value="Paid">Paid</option>
                                          <option value="Pending">Pending</option>
                                      </select>
                                  </div>
      
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formOrderDeliveryStep">Delivery Progress
                                          Step</label>
                                      <select className="admin-select w-100" id="formOrderDeliveryStep" required>
                                          <option value="1">Step 1: Order Placed</option>
                                          <option value="2">Step 2: Payment Verified</option>
                                          <option value="3">Step 3: Preparing Order</option>
                                          <option value="4">Step 4: Out for Delivery</option>
                                          <option value="5">Step 5: Delivered</option>
                                      </select>
                                  </div>
                              </div>
      
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formOrderAssignDriver">Assign Delivery Driver</label>
                                      <select className="admin-select w-100" id="formOrderAssignDriver">
                                          <option value="">— Select approved driver —</option>
                                      </select>
                                  </div>
      
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formOrderEstimate">Estimated Delivery Time</label>
                                      <input type="text" className="admin-form-control" id="formOrderEstimate"
                                          placeholder="e.g. Today, 4:00 PM" />
                                  </div>
                              </div>
      
                              <div className="text-end mt-4">
                                  <button type="button" className="btn-admin-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                                  <button type="submit" className="btn-admin-submit">Update Order</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>

          {/* ==================== USER EDIT MODAL ==================== */}
          <div className="modal fade" id="userEditModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title" id="userModalTitle">Edit User Account</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body">
                          <form id="userEditForm">
                              <input type="hidden" id="formUserId" />
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formUserFirstName">First Name</label>
                                      <input type="text" className="admin-form-control" id="formUserFirstName" required />
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formUserLastName">Last Name</label>
                                      <input type="text" className="admin-form-control" id="formUserLastName" />
                                  </div>
                              </div>
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formUserEmail">Email</label>
                                  <input type="email" className="admin-form-control" id="formUserEmail" required />
                              </div>
                              <div className="mb-3">
                                  <label className="admin-form-label" htmlFor="formUserPhone">Phone</label>
                                  <input type="tel" className="admin-form-control" id="formUserPhone" required />
                              </div>
                              <div className="row g-3 mb-3">
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formUserRole">Role</label>
                                      <select className="admin-select w-100" id="formUserRole" required>
                                          <option value="user">Customer</option>
                                          <option value="delivery">Driver</option>
                                          <option value="admin">Admin</option>
                                      </select>
                                  </div>
                                  <div className="col-6">
                                      <label className="admin-form-label" htmlFor="formUserStatus">Account Status</label>
                                      <select className="admin-select w-100" id="formUserStatus" required>
                                          <option value="true">Active</option>
                                          <option value="false">Inactive</option>
                                      </select>
                                  </div>
                              </div>
                              <div className="text-end mt-4">
                                  <button type="button" className="btn-admin-cancel me-2" data-bs-dismiss="modal">Cancel</button>
                                  <button type="submit" className="btn-admin-submit">Save Changes</button>
                              </div>
                          </form>
                      </div>
                  </div>
              </div>
          </div>

          {/* ==================== USER DETAILS / ACTIVITY MODAL ==================== */}
          <div className="modal fade" id="userDetailsModal" tabIndex="-1" aria-hidden="true">
              <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
                  <div className="modal-content">
                      <div className="modal-header">
                          <h5 className="modal-title" id="userDetailsModalTitle">Customer Activity</h5>
                          <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                      </div>
                      <div className="modal-body" id="userDetailsModalBody">
                          <div className="text-center text-muted py-4">Loading customer details...</div>
                      </div>
                  </div>
              </div>
          </div>
      
          {/* Bootstrap JS Bundle */}
          
      
          {/* Main Logic for Admin App */}
    </div>
  );
}
``