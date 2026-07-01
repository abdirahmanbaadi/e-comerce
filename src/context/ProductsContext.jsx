import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiUrl, getProductsList, normalizeProductPrices } from '../utils/data';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(getProductsList);

  const syncProducts = useCallback(async () => {
    try {
      const response = await fetch(apiUrl('/api/products'));
      const data = await response.json();
      if (data.success && data.products) {
        const normalized = normalizeProductPrices(data.products);
        localStorage.setItem('products', JSON.stringify(normalized));
        setProducts(normalized);
      }
    } catch {
      setProducts(getProductsList());
    }
  }, []);

  useEffect(() => {
    syncProducts();
  }, [syncProducts]);

  const value = useMemo(() => ({ products, setProducts, syncProducts }), [products, syncProducts]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used within ProductsProvider');
  return ctx;
}
