import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '../utils/data';

const WishlistContext = createContext(null);

function titlesToMap(titles = []) {
  return titles.reduce((acc, title) => {
    if (title) acc[title] = true;
    return acc;
  }, {});
}

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlistStateStorage')) || {};
    } catch {
      return {};
    }
  });

  const syncFromServer = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(apiUrl('/api/wishlist'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        const map = titlesToMap(data.productTitles);
        setWishlist(map);
        localStorage.setItem('wishlistStateStorage', JSON.stringify(map));
      }
    } catch {
      /* keep local wishlist */
    }
  }, []);

  const mergeWithServer = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    let localTitles = [];
    try {
      const stored = JSON.parse(localStorage.getItem('wishlistStateStorage')) || {};
      localTitles = Object.keys(stored).filter((k) => stored[k]);
    } catch {
      localTitles = Object.keys(wishlist).filter((k) => wishlist[k]);
    }

    try {
      const getRes = await fetch(apiUrl('/api/wishlist'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const getData = await getRes.json();
      const serverTitles = getData.success ? getData.productTitles || [] : [];
      const merged = [...new Set([...serverTitles, ...localTitles])];

      const putRes = await fetch(apiUrl('/api/wishlist'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productTitles: merged }),
      });
      const putData = await putRes.json();
      if (putData.success) {
        const map = titlesToMap(putData.productTitles);
        setWishlist(map);
        localStorage.setItem('wishlistStateStorage', JSON.stringify(map));
      }
    } catch {
      /* keep local */
    }
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('wishlistStateStorage', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    syncFromServer();
  }, [syncFromServer]);

  useEffect(() => {
    const onLogin = () => mergeWithServer();
    window.addEventListener('user-logged-in', onLogin);
    return () => window.removeEventListener('user-logged-in', onLogin);
  }, [mergeWithServer]);

  const wishlistCount = useMemo(() => Object.keys(wishlist).length, [wishlist]);

  const toggleWishlist = useCallback(async (title) => {
    setWishlist((prev) => {
      const next = { ...prev };
      if (next[title]) delete next[title];
      else next[title] = true;
      return next;
    });

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(apiUrl('/api/wishlist/toggle'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });
      } catch {
        /* local state already updated */
      }
    }
  }, []);

  const removeFromWishlist = useCallback(async (title) => {
    setWishlist((prev) => {
      const next = { ...prev };
      delete next[title];
      return next;
    });

    const token = localStorage.getItem('token');
    if (token && wishlist[title]) {
      try {
        await fetch(apiUrl('/api/wishlist/toggle'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title }),
        });
      } catch {
        /* ignore */
      }
    }
  }, [wishlist]);

  const isWishlisted = useCallback((title) => !!wishlist[title], [wishlist]);

  const value = useMemo(
    () => ({
      wishlist,
      wishlistCount,
      toggleWishlist,
      removeFromWishlist,
      isWishlisted,
      setWishlist,
      syncFromServer,
      mergeWithServer,
    }),
    [wishlist, wishlistCount, toggleWishlist, removeFromWishlist, isWishlisted, syncFromServer, mergeWithServer]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
