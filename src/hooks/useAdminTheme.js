import { useCallback, useEffect, useSyncExternalStore } from 'react';

export const ADMIN_THEME_STORAGE_KEY = 'admin-dark-mode';
export const ADMIN_THEME_EVENT = 'admin-theme-changed';

function readIsDark() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(ADMIN_THEME_STORAGE_KEY) === 'true';
}

/** Apply theme classes on html for portaled modals. Avoid polluting body store pages. */
export function applyAdminThemeToDom(isDark) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  if (isDark) {
    root.classList.add('admin-dark', 'dark');
    root.setAttribute('data-admin-theme', 'dark');
    root.setAttribute('data-theme', 'dark');
  } else {
    root.classList.remove('admin-dark', 'dark');
    root.setAttribute('data-admin-theme', 'light');
    root.setAttribute('data-theme', 'light');
  }
}

export function clearAdminThemeFromDom() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('admin-dark', 'dark', 'admin-page');
  root.removeAttribute('data-admin-theme');
  root.removeAttribute('data-theme');
  document.body.classList.remove('admin-dark', 'dark', 'admin-page');
  document.body.removeAttribute('data-admin-theme');
  document.body.removeAttribute('data-theme');
}

const themeListeners = new Set();

function subscribeTheme(onStoreChange) {
  themeListeners.add(onStoreChange);
  return () => themeListeners.delete(onStoreChange);
}

function notifyThemeListeners() {
  themeListeners.forEach((listener) => listener());
}

function getThemeSnapshot() {
  return readIsDark();
}

function setStoredAdminTheme(isDark) {
  const next = Boolean(isDark);
  localStorage.setItem(ADMIN_THEME_STORAGE_KEY, String(next));
  applyAdminThemeToDom(next);
  window.dispatchEvent(new CustomEvent(ADMIN_THEME_EVENT, { detail: { isDark: next } }));
  notifyThemeListeners();
}

export function useAdminTheme() {
  const isDark = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => false);

  useEffect(() => {
    applyAdminThemeToDom(readIsDark());

    const onStorage = (event) => {
      if (event.key === ADMIN_THEME_STORAGE_KEY) {
        applyAdminThemeToDom(readIsDark());
        notifyThemeListeners();
      }
    };

    const onThemeEvent = (event) => {
      applyAdminThemeToDom(Boolean(event.detail?.isDark));
      notifyThemeListeners();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(ADMIN_THEME_EVENT, onThemeEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ADMIN_THEME_EVENT, onThemeEvent);
    };
  }, []);

  const setIsDark = useCallback((value) => {
    const next = typeof value === 'function' ? value(readIsDark()) : value;
    setStoredAdminTheme(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setStoredAdminTheme(!readIsDark());
  }, []);

  return { isDark, toggleTheme, setIsDark };
}
