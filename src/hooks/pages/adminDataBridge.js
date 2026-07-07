/**
 * Slim admin bridge — tab sync, header search, deep-links.
 * Replaces legacy adminPageLogic.js (innerHTML renderers removed).
 */
import { apiUrl, fetchWithTimeout } from '../../utils/data';

const ADMIN_FETCH_TIMEOUT = 8000;

const SEARCH_TABS = new Set(['dashboard', 'products', 'orders', 'users', 'stock', 'support']);

const TAB_INVALIDATE_EVENTS = {
  dashboard: 'admin-dashboard-invalidate',
  products: 'admin-products-invalidate',
  orders: 'admin-orders-invalidate',
  users: 'admin-users-invalidate',
  stock: 'admin-stock-invalidate',
  payments: 'admin-payments-invalidate',
  delivery: 'admin-delivery-invalidate',
  support: 'admin-support-invalidate',
  settings: 'admin-settings-invalidate',
};

const TAB_SCOPES = {
  dashboard: ['recentOrders', 'support'],
  products: ['products'],
  orders: ['orders'],
  users: ['users'],
  stock: ['products'],
  payments: ['orders'],
  delivery: ['orders'],
  support: ['support'],
  settings: [],
  reviews: [],
};

let adminHeaderSearchQuery = '';
let prefetchPromise = null;
let lastPrefetchAt = 0;
const PREFETCH_TTL_MS = 60_000;

function token() {
  return localStorage.getItem('token');
}

function authHeaders() {
  return {
    Authorization: `Bearer ${token()}`,
    'Content-Type': 'application/json',
  };
}

function dispatchTabInvalidate(tabName) {
  const eventName = TAB_INVALIDATE_EVENTS[tabName];
  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName));
  }
}

function showDataLoading(active) {
  const el = document.getElementById('adminDataLoading');
  if (!el) return;
  el.classList.toggle('hidden', !active);
  el.classList.toggle('flex', active);
}

function dispatchHeaderSearchSync(tab) {
  window.dispatchEvent(
    new CustomEvent('admin-header-search-sync', {
      detail: { tab, query: getAdminTabSearchValue(tab) },
    })
  );
}

function adminTabHasSearch(tab) {
  return SEARCH_TABS.has(tab);
}

function getAdminTabSearchValue(tab) {
  if (tab === 'dashboard' || SEARCH_TABS.has(tab)) {
    return adminHeaderSearchQuery;
  }
  return '';
}

function applyAdminHeaderSearch(query, tab) {
  adminHeaderSearchQuery = query ?? '';
  if (tab === 'dashboard' || TAB_INVALIDATE_EVENTS[tab]) {
    dispatchTabInvalidate(tab);
  }
  dispatchHeaderSearchSync(tab);
}

async function prefetchScopedData(scopes = []) {
  if (!token() || !scopes.length) return;

  if (Date.now() - lastPrefetchAt < PREFETCH_TTL_MS) return;

  if (prefetchPromise) {
    await prefetchPromise;
    return;
  }

  prefetchPromise = (async () => {
    const headers = authHeaders();
    const tasks = [];

    if (scopes.includes('products')) {
      tasks.push(
        fetchWithTimeout(apiUrl('/api/products'), {}, ADMIN_FETCH_TIMEOUT)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.products)) {
              localStorage.setItem('products', JSON.stringify(d.products));
            }
          })
      );
    }

    if (scopes.includes('orders') || scopes.includes('recentOrders')) {
      const limit = scopes.includes('recentOrders') ? 8 : 500;
      tasks.push(
        fetchWithTimeout(apiUrl(`/api/orders?limit=${limit}`), { headers }, ADMIN_FETCH_TIMEOUT)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.orders)) {
              localStorage.setItem('adminOrders', JSON.stringify(d.orders));
            }
          })
      );
    }

    if (scopes.includes('users')) {
      tasks.push(
        fetchWithTimeout(apiUrl('/api/auth/users'), { headers }, ADMIN_FETCH_TIMEOUT)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.users)) {
              localStorage.setItem('adminUsers', JSON.stringify(d.users));
            }
          })
      );
    }

    if (scopes.includes('support')) {
      tasks.push(
        fetchWithTimeout(apiUrl('/api/support/admin/chats'), { headers }, ADMIN_FETCH_TIMEOUT)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && Array.isArray(d.tickets)) {
              localStorage.setItem('adminSupportTickets', JSON.stringify(d.tickets));
            }
          })
      );
    }

    try {
      await Promise.all(tasks);
      lastPrefetchAt = Date.now();
    } catch (err) {
      console.warn('Admin prefetch failed:', err);
    }
  })();

  try {
    await prefetchPromise;
  } finally {
    prefetchPromise = null;
  }
}

async function switchTab(tabName) {
  window.dispatchEvent(new CustomEvent('admin-tab-changed', { detail: tabName }));

  if (tabName !== 'support' && window.adminChatPollIntervalId) {
    clearInterval(window.adminChatPollIntervalId);
    window.adminChatPollIntervalId = null;
  }

  dispatchTabInvalidate(tabName);

  const scopes = TAB_SCOPES[tabName] || [];
  if (!scopes.length) return;

  showDataLoading(true);
  try {
    const tasks = [prefetchScopedData(scopes)];
    if (tabName === 'dashboard') {
      tasks.push(
        fetchWithTimeout(apiUrl('/api/admin/dashboard-stats'), { headers: authHeaders() }, ADMIN_FETCH_TIMEOUT)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.stats) {
              localStorage.setItem('adminDashboardStats', JSON.stringify(d.stats));
            }
          })
          .catch(() => {})
      );
    }
    await Promise.all(tasks);
    dispatchTabInvalidate(tabName);
  } finally {
    showDataLoading(false);
  }
}

function openAddProductModal() {
  window.dispatchEvent(new CustomEvent('admin-products-open-add'));
}

async function openOrderEditModalById(orderId) {
  await switchTab('orders');
  await new Promise((resolve) => setTimeout(resolve, 50));
  window.dispatchEvent(new CustomEvent('admin-orders-open', { detail: { orderId } }));
}

function mountBridge() {
  const exports = {
    switchTab,
    openAddProductModal,
    openOrderEditModalById,
    getAdminTabSearchValue,
    applyAdminHeaderSearch,
    adminTabHasSearch,
  };

  Object.assign(window, exports);
  window.switchTab = switchTab;
}

function boot() {
  if (window.__adminDataBridgeBooted) return;
  window.__adminDataBridgeBooted = true;

  const adminAppContent = document.getElementById('adminAppContent');
  if (adminAppContent) adminAppContent.style.display = 'flex';

  mountBridge();
  switchTab('dashboard');
}

export function initAdminPageLogic() {
  if (window.__adminPageLogicInit) return;
  window.__adminPageLogicInit = true;
  boot();
}

export function initAdminDataBridge() {
  initAdminPageLogic();
}
