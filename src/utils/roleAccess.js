/** Role-based storefront access — admin preview vs driver lock */

const ADMIN_STORE_PATHS = new Set(['/', '/products', '/about', '/contact', '/track-order']);

const ADMIN_BLOCKED_PATHS = new Set([
  '/cart',
  '/checkout',
  '/profile',
  '/apply-delivery',
  '/register',
]);

const DRIVER_ONLY_PATH = '/delivery';

export function isAdminUser(user) {
  return user?.isLoggedIn && user?.role === 'admin';
}

export function isDriverUser(user) {
  return user?.isLoggedIn && user?.role === 'delivery';
}

export function canUseCustomerShopping(user) {
  if (!user?.isLoggedIn) return true;
  return user.role === 'user' || !user.role;
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
  return path === DRIVER_ONLY_PATH;
}
