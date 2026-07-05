import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import MainNavbar from '../components/MainNavbar';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductsContext';
import {
  AVAILABILITY_OPTIONS,
  CATEGORY_OPTIONS,
  DEFAULT_MAX_PRICE,
  EMPTY_FILTERS,
  MATERIAL_OPTIONS,
  RATING_OPTIONS,
  SORT_OPTIONS,
  buildActiveFilterChips,
  buildProductApiParams,
  filterAndSortProducts,
  filtersToSearchParams,
  hasServerSideFilters,
  parseFiltersFromSearchParams,
} from '../utils/productFilters';
import { apiUrl, normalizeProductPrices } from '../utils/data';
import { showTopFloatNotification } from '../utils/notifications';
import '../styles/pages/Products.css';
import '../styles/product-modal.css';

function toggleArrayValue(list, value) {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function Products() {
  const { syncFromStorage: syncAuth } = useAuth();
  const { addToCart, syncFromStorage: syncCart } = useCart();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => parseFiltersFromSearchParams(searchParams));
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryOptions, setCategoryOptions] = useState(CATEGORY_OPTIONS);
  const [apiProducts, setApiProducts] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const isInternalUrlUpdate = useRef(false);

  useEffect(() => {
    if (isInternalUrlUpdate.current) {
      isInternalUrlUpdate.current = false;
      return;
    }
    setFilters(parseFiltersFromSearchParams(searchParams));
  }, [searchParams]);

  useEffect(() => {
    const next = filtersToSearchParams(filters).toString();
    if (next === searchParams.toString()) return;
    isInternalUrlUpdate.current = true;
    setSearchParams(filtersToSearchParams(filters), { replace: true });
  }, [filters, searchParams, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (!hasServerSideFilters(filters)) {
        setApiProducts(null);
        setSearchLoading(false);
        return;
      }

      setSearchLoading(true);
      try {
        const params = buildProductApiParams(filters);
        const response = await fetch(apiUrl(`/api/products?${params.toString()}`), {
          signal: controller.signal,
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.products)) {
          setApiProducts(normalizeProductPrices(data.products));
        } else {
          setApiProducts([]);
        }
      } catch (err) {
        if (err.name !== 'AbortError') setApiProducts(null);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters]);

  useEffect(() => {
    fetch(apiUrl('/api/categories'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.categories?.length) {
          setCategoryOptions(
            data.categories.map((c) => ({ value: c.slug, label: c.name }))
          );
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    syncAuth();
    syncCart();
  }, [syncAuth, syncCart]);

  const filteredProducts = useMemo(() => {
    const activeCatalog = products.filter((p) => p.status !== 'Inactive');
    if (apiProducts !== null) return apiProducts;
    return filterAndSortProducts(activeCatalog, filters);
  }, [apiProducts, products, filters]);

  const activeChips = useMemo(() => buildActiveFilterChips(filters), [filters]);

  const hasActiveFilters = activeChips.length > 0;

  const openProduct = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const closeProduct = () => {
    setModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddToCart = (product, event) => {
    event?.stopPropagation();
    if (product.stock === 'out-of-stock') {
      showTopFloatNotification('This product is out of stock!', 'danger');
      return;
    }
    const added = addToCart(product, 1);
    if (added) {
      showTopFloatNotification('1 item added to cart!');
    }
  };

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: toggleArrayValue(prev[key], value),
    }));
  };

  const removeChip = (chip) => {
    if (chip.type === 'search') {
      setFilters((prev) => ({ ...prev, search: '' }));
      return;
    }
    if (chip.type === 'newest') {
      setFilters((prev) => ({ ...prev, isNewest: false }));
      return;
    }
    if (chip.type === 'price') {
      setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: DEFAULT_MAX_PRICE }));
      return;
    }

    const keyMap = {
      category: 'categories',
      material: 'materials',
      availability: 'availability',
      rating: 'ratings',
    };
    const stateKey = keyMap[chip.type];
    if (!stateKey) return;

    setFilters((prev) => ({
      ...prev,
      [stateKey]: prev[stateKey].filter((v) => v !== chip.value),
    }));
  };

  const clearFilters = () => setFilters(EMPTY_FILTERS);

  const resultsText = searchLoading
    ? 'Searching products...'
    : filteredProducts.length === 0
      ? 'No products match your filters'
      : `Showing ${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`;

  return (
    <div className="products-page-wrapper">
      <MainNavbar />

      <main className="products-page">
        <div className="container">
          <div className="shop-top">
            <div>
              <h1 className="shop-title">All Products</h1>
              <p className="results-text">{resultsText}</p>
            </div>

            <div className="shop-controls-right">
              <div className="sort-box" style={{ margin: 0 }}>
                <span>Sort by:</span>
                <select
                  className="sort-select"
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="search-wrapper page-search-wrapper">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search title, material, color..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                />
                <i className="fa-solid fa-magnifying-glass" />
              </div>
            </div>
          </div>

          <div className="products-layout">
            <aside className="filter-sidebar">
              <div className="filter-main-title">Filter Options</div>

              <div className="filter-group">
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={filters.isNewest}
                    onChange={(e) => updateFilter('isNewest', e.target.checked)}
                  />
                  New Arrivals Only
                </label>
              </div>

              <div className="filter-group">
                <div className="filter-group-title">By Categories</div>
                {categoryOptions.map((opt) => (
                  <label key={opt.value} className="check-row">
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(opt.value)}
                      onChange={() => toggleFilter('categories', opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <div className="filter-group-title">By Material</div>
                {MATERIAL_OPTIONS.map((opt) => (
                  <label key={opt.value} className="check-row">
                    <input
                      type="checkbox"
                      checked={filters.materials.includes(opt.value)}
                      onChange={() => toggleFilter('materials', opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <div className="filter-group-title">Price Range</div>
                <div className="price-input-row">
                  <div className="price-input-box">
                    <label htmlFor="minPriceInput">Min Price</label>
                    <input
                      type="number"
                      id="minPriceInput"
                      min="0"
                      value={filters.minPrice}
                      onChange={(e) => updateFilter('minPrice', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="price-input-box">
                    <label htmlFor="maxPriceInput">Max Price</label>
                    <input
                      type="number"
                      id="maxPriceInput"
                      min="0"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        updateFilter('maxPrice', Number(e.target.value) || DEFAULT_MAX_PRICE)
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="filter-group">
                <div className="filter-group-title">Popularity</div>
                {RATING_OPTIONS.map((opt) => (
                  <label key={opt.value} className="check-row">
                    <input
                      type="checkbox"
                      checked={filters.ratings.includes(opt.value)}
                      onChange={() => toggleFilter('ratings', opt.value)}
                    />
                    <span className="review-stars">
                      {opt.stars}
                      {opt.muted ? <span className="review-muted">{opt.muted}</span> : null}
                    </span>{' '}
                    {opt.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <div className="filter-group-title">Availability</div>
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <label key={opt.value} className="check-row">
                    <input
                      type="checkbox"
                      checked={filters.availability.includes(opt.value)}
                      onChange={() => toggleFilter('availability', opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </aside>

            <section>
              <div className="active-filter-row">
                <span className="active-filter-label">Active Filter</span>
                <div id="activeFiltersContainer">
                  {!hasActiveFilters && (
                    <span style={{ color: '#999', fontSize: '0.85rem', fontWeight: 700 }}>
                      No active filter
                    </span>
                  )}
                  {activeChips.map((chip) => (
                    <span key={`${chip.type}-${chip.value}`} className="active-chip">
                      {chip.label}
                      <button
                        type="button"
                        className="active-chip-remove"
                        onClick={() => removeChip(chip)}
                        aria-label={`Remove ${chip.label}`}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </span>
                  ))}
                </div>
                <button type="button" className="clear-all" onClick={clearFilters}>
                  Clear All
                </button>
              </div>

              {!searchLoading && filteredProducts.length === 0 ? (
                <div className="products-empty-state text-center py-5">
                  <i className="fa-solid fa-magnifying-glass fa-2x mb-3 text-muted" />
                  <h3 className="fw-bold mb-2">No products found</h3>
                  <p className="text-muted mb-3">
                    Try different keywords or remove some filters to see more results.
                  </p>
                  <button type="button" className="btn btn-success px-4" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-3 g-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      className="col product-item"
                      categoryFormat="dot"
                      onOpen={openProduct}
                      onAddToCart={handleAddToCart}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <ProductModal isOpen={modalOpen} product={selectedProduct} onClose={closeProduct} />
    </div>
  );
}
