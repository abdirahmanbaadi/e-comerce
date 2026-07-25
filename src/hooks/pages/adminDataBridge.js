/**
 * Slim admin bridge — tab sync, header search, deep-links.
 * React tabs own their own data fetching; this bridge only syncs UI helpers.
 */
const SEARCH_TABS = new Set(['dashboard', 'products', 'orders', 'users', 'stock', 'payments', 'support']);

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

let adminHeaderSearchQuery = '';

function dispatchTabInvalidate(tabName) {
  const eventName = TAB_INVALIDATE_EVENTS[tabName];
  if (eventName) {
    window.dispatchEvent(new CustomEvent(eventName));
  }
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

async function switchTab(tabName) {
  window.dispatchEvent(new CustomEvent('admin-tab-changed', { detail: tabName }));

  if (tabName !== 'support' && window.adminChatPollIntervalId) {
    clearInterval(window.adminChatPollIntervalId);
    window.adminChatPollIntervalId = null;
  }
}

function openAddProductModal() {
  window.dispatchEvent(new CustomEvent('admin-products-open-add'));
}

async function openOrderEditModalById(orderId) {
  window.dispatchEvent(new CustomEvent('admin-tab-changed', { detail: 'orders' }));
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
}

export function initAdminPageLogic() {
  if (window.__adminPageLogicInit) return;
  window.__adminPageLogicInit = true;
  boot();
}

export function initAdminDataBridge() {
  initAdminPageLogic();
}
