import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wishlistStateStorage')) || {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('wishlistStateStorage', JSON.stringify(wishlist));
  }, [wishlist]);

  const wishlistCount = useMemo(() => Object.keys(wishlist).length, [wishlist]);

  const toggleWishlist = useCallback((title) => {
    setWishlist(prev => {
      const next = { ...prev };
      if (next[title]) delete next[title];
      else next[title] = true;
      return next;
    });
  }, []);

  const removeFromWishlist = useCallback((title) => {
    setWishlist(prev => {
      const next = { ...prev };
      delete next[title];
      return next;
    });
  }, []);

  const isWishlisted = useCallback((title) => !!wishlist[title], [wishlist]);

  const value = useMemo(
    () => ({ wishlist, wishlistCount, toggleWishlist, removeFromWishlist, isWishlisted, setWishlist }),
    [wishlist, wishlistCount, toggleWishlist, removeFromWishlist, isWishlisted]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
