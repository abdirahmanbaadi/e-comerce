import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl, fetchWithTimeout, getProductsList } from '../utils/data';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(getProductsList);
  const [loading, setLoading] = useState(false);

  const syncProducts = useCallback(async () => {
    const cached = getProductsList();
    if (cached.length) setProducts(cached);

    setLoading(true);
    try {
      const response = await fetchWithTimeout(apiUrl('/api/products'));
      const data = await response.json();
      if (data.success && data.products) {
        localStorage.setItem('products', JSON.stringify(data.products));
        setProducts(data.products);
      }
    } catch {
      setProducts(getProductsList());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncProducts();
  }, [syncProducts]);

  const value = useMemo(
    () => ({ products, setProducts, syncProducts, loading }),
    [products, syncProducts, loading]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
