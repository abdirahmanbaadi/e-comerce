const LANGUAGE_KEY = 'mmf-app-language';
const APPEARANCE_KEY = 'mmf-app-appearance';
const APPEARANCE_SCOPE_KEY = 'mmf-app-appearance-scope';

/** @typedef {'light' | 'dark'} AppearanceMode */
/** @typedef {'profile' | 'customer' | 'all'} AppearanceScope */

export function getAppLanguage() {
  const value = localStorage.getItem(LANGUAGE_KEY);
  return value === 'so' ? 'so' : 'en';
}

export function setAppLanguage(lang) {
  const next = lang === 'so' ? 'so' : 'en';
  localStorage.setItem(LANGUAGE_KEY, next);
  window.dispatchEvent(new Event('mmf-app-language'));
  return next;
}

/** @returns {AppearanceMode} */
export function getAppAppearance() {
  const value = localStorage.getItem(APPEARANCE_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

/** @returns {AppearanceScope} */
export function getAppAppearanceScope() {
  const value = localStorage.getItem(APPEARANCE_SCOPE_KEY);
  if (value === 'profile' || value === 'customer') return value;
  return 'all';
}

function isProfilePath(pathname = '') {
  return (
    pathname === '/app/profile' ||
    pathname.startsWith('/app/profile/') ||
    pathname === '/profile' ||
    pathname.startsWith('/profile/')
  );
}

function isCustomerAppPath(pathname = '') {
  return pathname === '/app' || pathname.startsWith('/app/');
}

/**
 * Whether dark theme class should be active for the current route.
 * @param {string} [pathname]
 * @param {AppearanceMode} [mode]
 * @param {AppearanceScope} [scope]
 */
export function shouldApplyDarkMode(
  pathname = typeof window !== 'undefined' ? window.location.pathname : '',
  mode = getAppAppearance(),
  scope = getAppAppearanceScope()
) {
  if (mode !== 'dark') return false;
  if (scope === 'profile') return isProfilePath(pathname);
  if (scope === 'customer') return isCustomerAppPath(pathname);
  return true; // all
}

/** Apply html.mmf-dark based on saved mode + scope + current path. */
export function syncAppAppearance(pathname = typeof window !== 'undefined' ? window.location.pathname : '') {
  const mode = getAppAppearance();
  const scope = getAppAppearanceScope();
  const on = shouldApplyDarkMode(pathname, mode, scope);
  document.documentElement.classList.toggle('mmf-dark', on);
  document.documentElement.dataset.mmfTheme = on ? 'dark' : 'light';
  document.documentElement.dataset.mmfThemeScope = scope;
  return { mode, scope, applied: on };
}

/**
 * @param {AppearanceMode} mode
 * @param {AppearanceScope} [scope]
 */
export function applyAppAppearance(mode, scope) {
  const nextMode = mode === 'dark' ? 'dark' : 'light';
  localStorage.setItem(APPEARANCE_KEY, nextMode);

  if (scope === 'profile' || scope === 'customer' || scope === 'all') {
    localStorage.setItem(APPEARANCE_SCOPE_KEY, scope);
  } else if (nextMode === 'light') {
    // keep existing scope when switching back to light
  } else if (!localStorage.getItem(APPEARANCE_SCOPE_KEY)) {
    localStorage.setItem(APPEARANCE_SCOPE_KEY, 'all');
  }

  const result = syncAppAppearance();
  window.dispatchEvent(new Event('mmf-app-appearance'));
  return result;
}

/** @param {AppearanceScope} scope */
export function setAppAppearanceScope(scope) {
  const next = scope === 'profile' || scope === 'customer' ? scope : 'all';
  localStorage.setItem(APPEARANCE_SCOPE_KEY, next);
  const result = syncAppAppearance();
  window.dispatchEvent(new Event('mmf-app-appearance'));
  return result;
}

export function initAppAppearance() {
  syncAppAppearance();
}

export function appearanceScopeLabel(scope = getAppAppearanceScope()) {
  if (scope === 'profile') return 'Profile';
  if (scope === 'customer') return 'Customer';
  return 'All';
}
