import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiUrl } from '../utils/data';
import { canUseCustomerShopping } from '../utils/roleAccess';
import { showTopFloatNotification } from '../utils/notifications';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'wishlistStateStorage';

function titlesToMap(titles = []) {
  return titles.reduce((acc, title) => {
    if (title) acc[String(title)] = true;
    return acc;
  }, {});
}

function readLocalWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function persistWishlist(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function resolveTitle(titleOrProduct) {
  if (!titleOrProduct) return '';
  if (typeof titleOrProduct === 'string') return titleOrProduct.trim();
  return String(titleOrProduct.title || titleOrProduct.name || '').trim();
}

function canSyncWishlistFromStorage() {
  const token = localStorage.getItem('token');
  if (!token) return false;
  const role = localStorage.getItem('userRole') || 'user';
  return role === 'user' || !role;
}

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState(readLocalWishlist);
  const wishlistRef = useRef(wishlist);
  wishlistRef.current = wishlist;

  /** Bumps on every local add/remove so in-flight GET sync cannot wipe fresh taps. */
  const localWriteId = useRef(0);
  const pendingMutations = useRef(0);

  const commitWishlist = useCallback((map) => {
    wishlistRef.current = map;
    setWishlist(map);
    persistWishlist(map);
  }, []);

  const syncFromServer = useCallback(async () => {
    if (!canSyncWishlistFromStorage()) return;

    const token = localStorage.getItem('token');
    const writeAtStart = localWriteId.current;

    try {
      const response = await fetch(apiUrl('/api/wishlist'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));

      if (writeAtStart !== localWriteId.current || pendingMutations.current > 0) return;

      if (data.success && Array.isArray(data.productTitles)) {
        commitWishlist(titlesToMap(data.productTitles));
      }
    } catch {
      /* keep local wishlist */
    }
  }, [commitWishlist]);

  const mergeWithServer = useCallback(async () => {
    if (!canSyncWishlistFromStorage()) return;

    const token = localStorage.getItem('token');
    const writeAtStart = localWriteId.current;
    const localTitles = Object.keys(wishlistRef.current).filter((k) => wishlistRef.current[k]);

    try {
      const getRes = await fetch(apiUrl('/api/wishlist'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const getData = await getRes.json().catch(() => ({}));
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
      const putData = await putRes.json().catch(() => ({}));

      if (writeAtStart !== localWriteId.current || pendingMutations.current > 0) return;

      if (putData.success && Array.isArray(putData.productTitles)) {
        commitWishlist(titlesToMap(putData.productTitles));
      } else {
        commitWishlist(titlesToMap(merged));
      }
    } catch {
      /* keep local */
    }
  }, [commitWishlist]);

  useEffect(() => {
    persistWishlist(wishlist);
  }, [wishlist]);

  // Merge once per login identity — never blind-replace (that wiped local taps).
  const sessionKey = user?.isLoggedIn ? `${user.email || ''}|${user.token || ''}` : '';
  useEffect(() => {
    if (!sessionKey) return;
    mergeWithServer();
  }, [sessionKey, mergeWithServer]);

  useEffect(() => {
    const onLogin = () => {
      mergeWithServer();
    };
    window.addEventListener('user-logged-in', onLogin);
    return () => window.removeEventListener('user-logged-in', onLogin);
  }, [mergeWithServer]);

  const wishlistCount = useMemo(
    () => Object.keys(wishlist).filter((title) => wishlist[title]).length,
    [wishlist]
  );

  const toggleWishlist = useCallback(
    (titleOrProduct) => {
      const title = resolveTitle(titleOrProduct);
      if (!title) return false;

      localWriteId.current += 1;

      const prev = wishlistRef.current;
      const next = { ...prev };
      if (next[title]) delete next[title];
      else next[title] = true;
      commitWishlist(next);

      // Admin / staff / driver: local preview only (API rejects those roles).
      const token = localStorage.getItem('token');
      if (!token || !canUseCustomerShopping(user)) return true;

      pendingMutations.current += 1;
      const writeAtStart = localWriteId.current;

      void (async () => {
        try {
          const response = await fetch(apiUrl('/api/wishlist/toggle'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title }),
          });
          const data = await response.json().catch(() => ({}));

          if (writeAtStart !== localWriteId.current) return;

          if (data.success && Array.isArray(data.productTitles)) {
            commitWishlist(titlesToMap(data.productTitles));
          } else if (!data.success && response.status >= 400) {
            showTopFloatNotification(data.message || 'Could not sync wishlist to server.', 'danger');
          }
        } catch {
          /* local state already updated */
        } finally {
          pendingMutations.current = Math.max(0, pendingMutations.current - 1);
        }
      })();

      return true;
    },
    [user, commitWishlist]
  );

  const removeFromWishlist = useCallback(
    (titleOrProduct) => {
      const title = resolveTitle(titleOrProduct);
      if (!title || !wishlistRef.current[title]) return false;

      localWriteId.current += 1;

      const nextTitles = Object.keys(wishlistRef.current).filter(
        (key) => key !== title && wishlistRef.current[key]
      );
      commitWishlist(titlesToMap(nextTitles));

      const token = localStorage.getItem('token');
      if (!token || !canUseCustomerShopping(user)) return true;

      pendingMutations.current += 1;
      const writeAtStart = localWriteId.current;
      const snapshotTitles = nextTitles;

      void (async () => {
        try {
          const response = await fetch(apiUrl('/api/wishlist'), {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ productTitles: snapshotTitles }),
          });
          const data = await response.json().catch(() => ({}));
          if (writeAtStart !== localWriteId.current) return;
          if (data.success && Array.isArray(data.productTitles)) {
            commitWishlist(titlesToMap(data.productTitles));
          }
        } catch {
          /* keep local remove */
        } finally {
          pendingMutations.current = Math.max(0, pendingMutations.current - 1);
        }
      })();

      return true;
    },
    [user, commitWishlist]
  );

  const isWishlisted = useCallback(
    (titleOrProduct) => {
      const title = resolveTitle(titleOrProduct);
      return Boolean(title && wishlist[title]);
    },
    [wishlist]
  );

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
