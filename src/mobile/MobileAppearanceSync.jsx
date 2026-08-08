import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncAppAppearance } from './mmfPreferences';

/** Keeps html.mmf-dark in sync with Appearance mode + scope + current route. */
export default function MobileAppearanceSync() {
  const { pathname } = useLocation();

  useEffect(() => {
    syncAppAppearance(pathname);
  }, [pathname]);

  useEffect(() => {
    const onChange = () => syncAppAppearance(window.location.pathname);
    window.addEventListener('mmf-app-appearance', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('mmf-app-appearance', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  return null;
}
