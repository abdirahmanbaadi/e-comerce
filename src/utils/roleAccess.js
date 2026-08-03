/** Role-based storefront & dashboard access */

const ADMIN_STORE_PATHS = new Set(['/', '/products', '/about', '/contact', '/track-order']);

const ADMIN_BLOCKED_PATHS = new Set([
  '/cart',
  '/checkout',
  '/profile',
  '/apply-delivery',
  '/register',
]);

const DRIVER_ONLY_PATH = '/delivery';
const STAFF_ONLY_PATH = '/admin';

/** Tabs staff may use on /admin (operations only) */
export const STAFF_ALLOWED_TABS = new Set([
  'dashboard',
  'orders',
  'products',
  'stock',
  'reviews',
  'support',
]);

export function isAdminUser(user) {
  const role = user?.role || (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true'
    ? localStorage.getItem('userRole')
    : null);
  return (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true') && role === 'admin';
}

export function isStaffUser(user) {
  const role = user?.role || (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true'
    ? localStorage.getItem('userRole')
    : null);
  return (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true') && role === 'staff';
}

export function isDriverUser(user) {
  const role = user?.role || (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true'
    ? localStorage.getItem('userRole')
    : null);
  return (user?.isLoggedIn || localStorage.getItem('isLoggedIn') === 'true') && role === 'delivery';
}

/** Admin or staff — can open the store dashboard */
export function isDashboardUser(user) {
  return isAdminUser(user) || isStaffUser(user);
}

export function canUseCustomerShopping(user) {
  if (!user?.isLoggedIn) return true;
  return user.role === 'user' || !user.role;
}

export function canAccessAdminTab(user, tabId) {
  if (isAdminUser(user)) return true;
  if (isStaffUser(user)) return STAFF_ALLOWED_TABS.has(tabId);
  return false;
}

export function isAdminStorePreviewPath(pathname) {
  const path = pathname.split('?')[0];
  return ADMIN_STORE_PATHS.has(path);
}

export function isAdminBlockedCustomerPath(pathname) {
  const path = pathname.split('?')[0];
  return ADMIN_BLOCKED_PATHS.has(path) || path.startsWith('/profile');
}

export function isDriverAllowedPath(pathname) {
  const path = pathname.split('?')[0];
  return path === DRIVER_ONLY_PATH || path === '/app/driver' || path.startsWith('/app/driver/');
}

/** Staff may only use the operations dashboard — no customer storefront */
export function isStaffAllowedPath(pathname) {
  const path = pathname.split('?')[0];
  return path === STAFF_ONLY_PATH || path.startsWith(`${STAFF_ONLY_PATH}/`);
}
