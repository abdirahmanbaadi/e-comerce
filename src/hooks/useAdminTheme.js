import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'admin-dark-mode';

export function useAdminTheme() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isDark));
    document.documentElement.setAttribute('data-admin-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => !prev);
  }, []);

  return { isDark, toggleTheme, setIsDark };
}
