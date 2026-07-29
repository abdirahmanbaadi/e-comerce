import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  CART_UPDATED_EVENT,
  readCartItems,
  readSavedItems,
} from '../utils/cartStorage';
import { apiUrl } from '../utils/data';
import { canUseCustomerShopping } from '../utils/roleAccess';
import { showTopFloatNotification } from '../utils/notifications';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState(readCartItems);
  const [savedItems, setSavedItems] = useState(readSavedItems);
  const syncTimerRef = useRef(null);

  const syncFromStorage = useCallback(() => {
    setCartItems(readCartItems());
    setSavedItems(readSavedItems());
  }, []);

  const mergeCartWithServer = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !canUseCustomerShopping(user)) return;

    const localCart = readCartItems();
    const localSaved = readSavedItems();

    try {
      const response = await fetch(apiUrl('/api/cart'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItems: localCart, savedItems: localSaved }),
      });
      const data = await response.json();
      if (data.success) {
        setCartItems(data.cartItems || []);
        setSavedItems(data.savedItems || []);
        localStorage.setItem('cartItems', JSON.stringify(data.cartItems || []));
        localStorage.setItem('savedItems', JSON.stringify(data.savedItems || []));
        window.dispatchEvent(new Event(CART_UPDATED_EVENT));
      }
    } catch {
      /* keep local cart */
    }
  }, [user]);

  const pushCartToServer = useCallback(async (cart, saved) => {
    const token = localStorage.getItem('token');
    if (!token || !canUseCustomerShopping(user)) return;
    try {
      await fetch(apiUrl('/api/cart'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cartItems: cart, savedItems: saved }),
      });
    } catch {
      /* ignore sync errors */
    }
  }, [user]);

  useEffect(() => {
    syncFromStorage();

    const onCartUpdated = () => syncFromStorage();
    const onLogin = () => mergeCartWithServer();

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener('focus', onCartUpdated);
    window.addEventListener('user-logged-in', onLogin);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener('focus', onCartUpdated);
      window.removeEventListener('user-logged-in', onLogin);
    };
  }, [syncFromStorage, mergeCartWithServer]);

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      pushCartToServer(cartItems, savedItems);
    }, 800);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [cartItems, savedItems, pushCartToServer]);

  useEffect(() => {
    localStorage.setItem('savedItems', JSON.stringify(savedItems));
  }, [savedItems]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems]
  );

  const addToCart = useCallback((product, quantity = 1) => {
    if (!canUseCustomerShopping(user)) {
      showTopFloatNotification('Cart is disabled for admin preview and driver accounts.', 'danger');
      return false;
    }
    if (product.stock === 'out-of-stock') return false;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          category: (product.label || product.category) + ' / ' + (product.materialLabel || product.materialType),
          categorySlug: product.category || '',
          categoryLabel: product.label || '',
          materialType: product.materialType || '',
          price: product.price,
          quantity,
          image: product.images[0],
        },
      ];
    });
    return true;
  }, [user]);

  const updateQuantity = useCallback((id, quantity) => {
    setCartItems(prev =>
      prev.map(item => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  }, []);

  const removeFromCart = useCallback((id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const changeQuantity = useCallback((id, delta) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  }, []);

  const saveForLater = useCallback((id) => {
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;
      setSavedItems((saved) => (saved.some((s) => s.id === id) ? saved : [...saved, item]));
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const moveToCart = useCallback((id) => {
    setSavedItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (!item) return prev;

      setCartItems((cart) => {
        const existing = cart.find((c) => c.id === id);
        if (existing) {
          return cart.map((c) =>
            c.id === id ? { ...c, quantity: c.quantity + item.quantity } : c
          );
        }
        return [...cart, item];
      });
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const value = useMemo(
    () => ({
      cartItems,
      savedItems,
      cartCount,
      addToCart,
      updateQuantity,
      changeQuantity,
      removeFromCart,
      saveForLater,
      moveToCart,
      clearCart,
      setCartItems,
      setSavedItems,
      syncFromStorage,
      mergeCartWithServer,
    }),
    [
      cartItems,
      savedItems,
      cartCount,
      addToCart,
      updateQuantity,
      changeQuantity,
      removeFromCart,
      saveForLater,
      moveToCart,
      clearCart,
      syncFromStorage,
      mergeCartWithServer,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
