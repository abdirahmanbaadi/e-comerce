/** Shared role helpers for dashboard staff vs full admin */

const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  STAFF: 'staff',
  DELIVERY: 'delivery',
};

const ALL_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.STAFF, ROLES.DELIVERY];

/** Roles that can open the store dashboard (/admin) */
const DASHBOARD_ROLES = [ROLES.ADMIN, ROLES.STAFF];

/** Tabs staff may use (operations only — no money, users, or settings) */
const STAFF_ALLOWED_TABS = new Set([
  'dashboard',
  'orders',
  'products',
  'stock',
  'reviews',
  'support',
]);

function isDashboardRole(role) {
  return DASHBOARD_ROLES.includes(role);
}

function isAdminRole(role) {
  return role === ROLES.ADMIN;
}

function isStaffRole(role) {
  return role === ROLES.STAFF;
}

function canAccessAdminTab(role, tabId) {
  if (isAdminRole(role)) return true;
  if (isStaffRole(role)) return STAFF_ALLOWED_TABS.has(tabId);
  return false;
}

module.exports = {
  ROLES,
  ALL_ROLES,
  DASHBOARD_ROLES,
  STAFF_ALLOWED_TABS,
  isDashboardRole,
  isAdminRole,
  isStaffRole,
  canAccessAdminTab,
};
