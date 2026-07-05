export const CATEGORY_OPTIONS = [
  { value: 'living-room', label: 'Living Room' },
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'dining-room', label: 'Dining Room' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'chair', label: 'Chair' },
  { value: 'office', label: 'Office' },
];

export const MATERIAL_OPTIONS = [
  { value: 'wood', label: 'Wood' },
  { value: 'velvet', label: 'Velvet' },
  { value: 'linen', label: 'Linen Fabric' },
  { value: 'rattan', label: 'Rattan' },
  { value: 'marble', label: 'Marble' },
];

export const AVAILABILITY_OPTIONS = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

export const RATING_OPTIONS = [
  { value: '5', label: '5 Star', stars: '★★★★★' },
  { value: '4', label: '4 Star', stars: '★★★★', muted: '★' },
  { value: '3', label: '3 Star', stars: '★★★', muted: '★★' },
  { value: '2', label: '2 Star', stars: '★★', muted: '★★★' },
  { value: '1', label: '1 Star', stars: '★', muted: '★★★★' },
];

export const SORT_OPTIONS = [
  { value: 'default', label: 'Default Sorting' },
  { value: 'high-price', label: 'Price: High to Low' },
  { value: 'low-price', label: 'Price: Low to High' },
  { value: 'popularity', label: 'Popularity' },
  { value: 'newest', label: 'Newest Products' },
];

export const DEFAULT_MAX_PRICE = 4000;

export const EMPTY_FILTERS = {
  categories: [],
  materials: [],
  availability: [],
  ratings: [],
  minPrice: 0,
  maxPrice: DEFAULT_MAX_PRICE,
  search: '',
  sort: 'default',
  isNewest: false,
};

function parseListParam(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function hasServerSideFilters(filters) {
  return Boolean(
    filters.search?.trim() ||
    filters.categories?.length ||
    filters.materials?.length ||
    filters.availability?.length ||
    filters.ratings?.length ||
    filters.isNewest ||
    filters.minPrice > 0 ||
    filters.maxPrice < DEFAULT_MAX_PRICE ||
    (filters.sort && filters.sort !== 'default')
  );
}

const SORT_API_MAP = {
  'high-price': 'price-high',
  'low-price': 'price-low',
  popularity: 'rating',
  newest: 'newest',
};

export function buildProductApiParams(filters) {
  const params = new URLSearchParams();

  const searchText = filters.search?.trim();
  if (searchText) params.set('search', searchText);

  if (filters.categories?.length) params.set('category', filters.categories.join(','));
  if (filters.materials?.length) params.set('materialType', filters.materials.join(','));
  if (filters.availability?.length) params.set('stock', filters.availability.join(','));
  if (filters.ratings?.length) params.set('rating', filters.ratings.join(','));
  if (filters.isNewest) params.set('isNewest', 'true');
  if (filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice < DEFAULT_MAX_PRICE) params.set('maxPrice', String(filters.maxPrice));

  if (filters.sort && filters.sort !== 'default') {
    params.set('sort', SORT_API_MAP[filters.sort] || filters.sort);
  } else if (searchText) {
    params.set('sort', 'relevance');
  }

  return params;
}

export function parseFiltersFromSearchParams(searchParams) {
  const categories = parseListParam(searchParams.get('category'));
  const materials = parseListParam(searchParams.get('material'));
  const availability = parseListParam(searchParams.get('stock'));
  const ratings = parseListParam(searchParams.get('rating'));

  const minPrice = Number(searchParams.get('minPrice') || 0);
  const maxPrice = Number(searchParams.get('maxPrice') || DEFAULT_MAX_PRICE);

  const sortParam = searchParams.get('sort') || 'default';
  const sortReverseMap = {
    'price-high': 'high-price',
    'price-low': 'low-price',
    rating: 'popularity',
    newest: 'newest',
    relevance: 'default',
  };

  return {
    ...EMPTY_FILTERS,
    search: searchParams.get('search') || '',
    categories,
    materials,
    availability,
    ratings,
    minPrice: Number.isNaN(minPrice) ? 0 : minPrice,
    maxPrice: Number.isNaN(maxPrice) ? DEFAULT_MAX_PRICE : maxPrice,
    isNewest: searchParams.get('isNewest') === 'true',
    sort: sortReverseMap[sortParam] || sortParam,
  };
}

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.categories?.length) params.set('category', filters.categories.join(','));
  if (filters.materials?.length) params.set('material', filters.materials.join(','));
  if (filters.availability?.length) params.set('stock', filters.availability.join(','));
  if (filters.ratings?.length) params.set('rating', filters.ratings.join(','));
  if (filters.isNewest) params.set('isNewest', 'true');
  if (filters.minPrice > 0) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice < DEFAULT_MAX_PRICE) params.set('maxPrice', String(filters.maxPrice));

  if (filters.sort && filters.sort !== 'default') {
    params.set('sort', SORT_API_MAP[filters.sort] || filters.sort);
  }

  return params;
}

export function getCategoryLabel(category) {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label || category;
}

export function getMaterialLabel(material) {
  return MATERIAL_OPTIONS.find((m) => m.value === material)?.label || material;
}

export function getAvailabilityLabel(value) {
  return value === 'in-stock' ? 'In Stock' : 'Out of Stock';
}

export function filterAndSortProducts(products, filters) {
  const {
    categories = [],
    materials = [],
    availability = [],
    ratings = [],
    minPrice = 0,
    maxPrice = DEFAULT_MAX_PRICE,
    search = '',
    sort = 'default',
  } = filters;

  const searchText = search.toLowerCase().trim();

  let filtered = products.filter((product) => {
    if (product.status === 'Inactive') return false;

    const matchCategory = categories.length === 0 || categories.includes(product.category);
    const matchMaterial =
      materials.length === 0 || materials.includes(product.materialType);
    const matchAvailability =
      availability.length === 0 || availability.includes(product.stock);
    const matchRating =
      ratings.length === 0 || ratings.includes(String(Math.floor(product.rating)));
    const matchPrice = product.price >= minPrice && product.price <= maxPrice;
    const matchSearch =
      !searchText ||
      product.title.toLowerCase().includes(searchText) ||
      (product.label || '').toLowerCase().includes(searchText) ||
      (product.materialType || '').toLowerCase().includes(searchText) ||
      (product.material || '').toLowerCase().includes(searchText) ||
      (product.color || '').toLowerCase().includes(searchText) ||
      (product.dimensions || '').toLowerCase().includes(searchText) ||
      (product.description || '').toLowerCase().includes(searchText);

    const matchNewest = !filters.isNewest || Boolean(product.isNewest);

    return (
      matchCategory &&
      matchMaterial &&
      matchAvailability &&
      matchRating &&
      matchPrice &&
      matchSearch &&
      matchNewest
    );
  });

  if (sort === 'high-price') filtered.sort((a, b) => b.price - a.price);
  if (sort === 'low-price') filtered.sort((a, b) => a.price - b.price);
  if (sort === 'popularity') filtered.sort((a, b) => b.popularity - a.popularity);
  if (sort === 'newest') filtered.sort((a, b) => Number(b.isNewest) - Number(a.isNewest));

  if (searchText) {
    filtered.sort((a, b) => {
      const aStarts = a.title.toLowerCase().startsWith(searchText);
      const bStarts = b.title.toLowerCase().startsWith(searchText);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });
  }

  return filtered;
}

export function buildActiveFilterChips(filters) {
  const chips = [];
  const { categories, materials, availability, ratings, minPrice, maxPrice, search, isNewest } = filters;

  if (search?.trim()) {
    chips.push({ type: 'search', value: search.trim(), label: `Search: "${search.trim()}"` });
  }
  if (isNewest) {
    chips.push({ type: 'newest', value: 'true', label: 'New Arrivals' });
  }
  categories.forEach((value) => {
    chips.push({ type: 'category', value, label: getCategoryLabel(value) });
  });
  materials.forEach((value) => {
    chips.push({ type: 'material', value, label: getMaterialLabel(value) });
  });
  availability.forEach((value) => {
    chips.push({ type: 'availability', value, label: getAvailabilityLabel(value) });
  });
  ratings.forEach((value) => {
    chips.push({ type: 'rating', value, label: `${value} Star` });
  });
  if (minPrice > 0 || maxPrice < DEFAULT_MAX_PRICE) {
    chips.push({
      type: 'price',
      value: 'price',
      label: `$${minPrice} - $${maxPrice}`,
    });
  }

  return chips;
}
