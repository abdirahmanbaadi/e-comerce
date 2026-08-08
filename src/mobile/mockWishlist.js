/** Preview wishlist titles — matched to catalog product titles when available. */
export const MOCK_WISHLIST_TITLES = [
  'Bloom Accent Chair Set',
  'Olive Curve Lounge Chair',
  'Blush Velvet Arch Bed',
  'Sage Wood Platform Bed',
  'Linen Upholstered King Bed',
  'Ivory Cloud Sofa Set',
  'Ivory Luxe Living Room Set',
  'Walnut Frame Sofa Set',
  'Emerald Luxe Dining Set',
  'Walnut Sage Dining Set',
];

/** Fallback cards if a title is not in the live products list yet. */
export const MOCK_WISHLIST_FALLBACKS = [
  {
    id: 'wish-mock-1',
    title: 'Bloom Accent Chair Set',
    category: 'chair',
    label: 'Chair',
    price: 150,
    image: 'product-images/bloom-round-accent-chair-set-main.jpeg.png',
  },
  {
    id: 'wish-mock-2',
    title: 'Olive Curve Lounge Chair',
    category: 'chair',
    label: 'Chair',
    price: 190,
    image: 'product-images/olive-curve-lounge-chair-main.jpeg.png',
  },
  {
    id: 'wish-mock-3',
    title: 'Blush Velvet Arch Bed',
    category: 'bedroom',
    label: 'Bedroom',
    price: 520,
    image: 'product-images/blush-velvet-arch-bed-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-4',
    title: 'Sage Wood Platform Bed',
    category: 'bedroom',
    label: 'Bedroom',
    price: 480,
    image: 'product-images/sage-wood-platform-bed-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-5',
    title: 'Linen Upholstered King Bed',
    category: 'bedroom',
    label: 'Bedroom',
    price: 560,
    image: 'product-images/linen-upholstered-king-bed.png',
  },
  {
    id: 'wish-mock-6',
    title: 'Ivory Cloud Sofa Set',
    category: 'living-room',
    label: 'Living Room',
    price: 610,
    image: 'product-images/ivory-cloud-sofa-set-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-7',
    title: 'Ivory Luxe Living Room Set',
    category: 'living-room',
    label: 'Living Room',
    price: 450,
    image: 'product-images/ivory-luxe-living-room-set-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-8',
    title: 'Walnut Frame Sofa Set',
    category: 'living-room',
    label: 'Living Room',
    price: 540,
    image: 'product-images/walnut-frame-sofa-set-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-9',
    title: 'Emerald Luxe Dining Set',
    category: 'dining-room',
    label: 'Dining Room',
    price: 720,
    image: 'product-images/emerald-luxe-dining-set-main.jpeg.jpeg',
  },
  {
    id: 'wish-mock-10',
    title: 'Walnut Sage Dining Set',
    category: 'dining-room',
    label: 'Dining Room',
    price: 168,
    image: 'product-images/walnut-sage-dining-set-main.jpeg.jpeg',
  },
];

export function buildMockWishlistItems(products = []) {
  const catalog = products || [];
  return MOCK_WISHLIST_TITLES.map((title, index) => {
    const fromCatalog = catalog.find((p) => p.title === title && p.status !== 'Inactive');
    if (fromCatalog) return fromCatalog;
    return MOCK_WISHLIST_FALLBACKS[index] || { id: `wish-mock-${index}`, title, price: 0 };
  }).filter(Boolean);
}
