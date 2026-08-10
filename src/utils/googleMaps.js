const SCRIPT_ID = 'mmf-google-maps-js';

export function getGoogleMapsApiKey() {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();
}

export function hasGoogleMapsKey() {
  return Boolean(getGoogleMapsApiKey());
}

/**
 * Load Google Maps JavaScript API once (Maps + Directions).
 * Requires VITE_GOOGLE_MAPS_API_KEY in .env
 */
export function loadGoogleMaps() {
  const key = getGoogleMapsApiKey();
  if (!key) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'));
  }

  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return Promise.resolve(window.google.maps);
  }

  if (typeof window !== 'undefined' && window.__mmfGoogleMapsPromise) {
    return window.__mmfGoogleMapsPromise;
  }

  window.__mmfGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener('load', () => {
        if (window.google?.maps) resolve(window.google.maps);
        else reject(new Error('Google Maps failed to load'));
      });
      existing.addEventListener('error', () => reject(new Error('Google Maps script error')));
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly`;
    script.onload = () => {
      if (window.google?.maps?.Map) resolve(window.google.maps);
      else reject(new Error('Google Maps API unavailable'));
    };
    script.onerror = () => {
      window.__mmfGoogleMapsPromise = null;
      reject(new Error('Could not load Google Maps. Check API key / billing.'));
    };
    document.head.appendChild(script);
  });

  return window.__mmfGoogleMapsPromise;
}
