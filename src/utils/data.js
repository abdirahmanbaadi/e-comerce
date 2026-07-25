export const API_BASE = import.meta.env.VITE_API_URL || '';

import {
  PRODUCT_PRICES,
  PRODUCT_OLD_PRICES,
  DELIVERY_FEES,
  DELIVERY_FEE,
  DELIVERY_FEE_ALT,
  priceForProductId,
  oldPriceForProductId,
  getDistrictFee,
} from './pricing';

export {
  PRODUCT_PRICES,
  PRODUCT_OLD_PRICES,
  DELIVERY_FEES,
  DELIVERY_FEE,
  DELIVERY_FEE_ALT,
  getDistrictFee,
};

export const DEMO_PRODUCT_PRICES = PRODUCT_PRICES;
export const DEMO_PRODUCT_OLD_PRICES = PRODUCT_OLD_PRICES;
export const DEMO_DELIVERY_FEE = DELIVERY_FEE;
export const DEMO_DELIVERY_FEE_ALT = DELIVERY_FEE_ALT;
export const DEMO_PRODUCT_PRICE = PRODUCT_PRICES[0];
export const DEMO_PRODUCT_OLD_PRICE = PRODUCT_OLD_PRICES[0];

const DEFAULT_FETCH_TIMEOUT_MS = 8000;

export function apiUrl(path) {
  const base = API_BASE || '';
  const normalized = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : `/${path}`}`;
  return `${base}${normalized}`;
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export const defaultProducts = [
  {
    id: 1,
    title: "Bloom Accent Chair Set",
    category: "chair",
    label: "Chair",
    materialType: "linen",
    materialLabel: "Linen Fabric",
    material: "Premium Oak Frame, Linen Fabric",
    price: 150,
    oldPrice: 170,
    discount: "10% off",
    rating: 3.8,
    popularity: 82,
    isNewest: true,
    stock: "in-stock",
    stockVal: 12,
    status: "Active",
    availability: "In Stock",
    color: "Sand Beige",
    images: [
      "product-images/bloom-round-accent-chair-set-main.jpeg.png",
      "product-images/bloom-round-accent-chair-set-angle-1.jpeg.png",
      "product-images/bloom-round-accent-chair-set-angle-2.jpeg.png",
      "product-images/bloom-round-accent-chair-set-angle-3.jpeg.png"
    ]
  },
  {
    id: 2,
    title: "Olive Curve Lounge Chair",
    category: "chair",
    label: "Chair",
    materialType: "velvet",
    materialLabel: "Velvet",
    material: "Velvet Luxury Fiber, Wood Frame",
    price: 190,
    oldPrice: null,
    discount: "",
    rating: 4.2,
    popularity: 72,
    isNewest: false,
    stock: "out-of-stock",
    stockVal: 0,
    status: "Active",
    availability: "Out of Stock",
    color: "Olive Green",
    images: [
      "product-images/olive-curve-lounge-chair-main.jpeg.png",
      "product-images/olive-curve-lounge-chair-angle-1.jpeg.png",
      "product-images/olive-curve-lounge-chair-angle-2.jpeg.png",
      "product-images/olive-curve-lounge-chair-angle-3.jpeg.png"
    ]
  },
  {
    id: 3,
    title: "Blush Velvet Arch Bed",
    category: "bedroom",
    label: "Bedroom",
    materialType: "velvet",
    materialLabel: "Velvet",
    material: "Premium Velvet, Solid Wood Frame",
    price: 850,
    oldPrice: 950,
    discount: "10% off",
    rating: 4.8,
    popularity: 90,
    isNewest: true,
    stock: "in-stock",
    stockVal: 8,
    status: "Active",
    availability: "In Stock",
    color: "Blush Pink",
    images: [
      "product-images/blush-velvet-arch-bed-main.jpeg.jpeg",
      "product-images/blush-velvet-arch-bed-angle-1.jpeg.jpeg",
      "product-images/blush-velvet-arch-bed-angle-2.jpeg.jpeg",
      "product-images/blush-velvet-arch-bed-main.jpeg.jpeg"
    ]
  },
  {
    id: 4,
    title: "Sage Wood Platform Bed",
    category: "bedroom",
    label: "Bedroom",
    materialType: "wood",
    materialLabel: "Wood",
    material: "Solid Wood, Sage Green Finish",
    price: 340,
    oldPrice: 400,
    discount: "15% off",
    rating: 4.5,
    popularity: 85,
    isNewest: false,
    stock: "in-stock",
    stockVal: 14,
    status: "Active",
    availability: "In Stock",
    color: "Sage Green & Natural Wood",
    images: [
      "product-images/sage-wood-platform-bed-main.jpeg.jpeg",
      "product-images/sage-wood-platform-bed-angle-1.jpeg.jpeg",
      "product-images/sage-wood-platform-bed-angle-2.jpeg.jpeg",
      "product-images/sage-wood-platform-bed-main.jpeg.jpeg"
    ]
  },
  {
    id: 5,
    title: "Linen Upholstered King Bed",
    category: "bedroom",
    label: "Bedroom",
    materialType: "linen",
    materialLabel: "Linen Fabric",
    material: "Premium Linen, Wood Frame",
    price: 820,
    oldPrice: 900,
    discount: "9% off",
    rating: 4.6,
    popularity: 78,
    isNewest: false,
    stock: "in-stock",
    stockVal: 10,
    status: "Active",
    availability: "In Stock",
    color: "Cream White",
    images: [
      "product-images/linen-upholstered-king-bed.png",
      "product-images/sage-wood-platform-bed-angle-1.jpeg.jpeg",
      "product-images/sage-wood-platform-bed-angle-2.jpeg.jpeg",
      "product-images/linen-upholstered-king-bed.png"
    ]
  },
  {
    id: 6,
    title: "Ivory Cloud Sofa Set",
    category: "living-room",
    label: "Living Room",
    materialType: "linen",
    materialLabel: "Linen Fabric",
    material: "Premium Boucle Fabric, Solid Wood",
    price: 760,
    oldPrice: 850,
    discount: "10% off",
    rating: 4.7,
    popularity: 92,
    isNewest: true,
    stock: "in-stock",
    stockVal: 15,
    status: "Active",
    availability: "In Stock",
    color: "Ivory White",
    images: [
      "product-images/ivory-cloud-sofa-set-main.jpeg.jpeg",
      "product-images/ivory-cloud-sofa-set-angle-1.jpeg.jpeg",
      "product-images/ivory-cloud-sofa-set-angle-2.jpeg.jpeg",
      "product-images/ivory-cloud-sofa-set-main.jpeg.jpeg"
    ]
  },
  {
    id: 7,
    title: "Ivory Luxe Living Room Set",
    category: "living-room",
    label: "Living Room",
    materialType: "velvet",
    materialLabel: "Velvet",
    material: "Leather upholstery, metal frame",
    price: 1450,
    oldPrice: 1600,
    discount: "9% off",
    rating: 4.9,
    popularity: 95,
    isNewest: true,
    stock: "in-stock",
    stockVal: 7,
    status: "Active",
    availability: "In Stock",
    color: "Ivory & Gold",
    images: [
      "product-images/ivory-luxe-living-room-set-main.jpeg.jpeg",
      "product-images/ivory-luxe-living-room-set-angle-1.jpeg.jpeg",
      "product-images/ivory-luxe-living-room-set-angle-2.jpeg.jpeg",
      "product-images/ivory-luxe-living-room-set-angle-3.jpeg.jpeg"
    ]
  },
  {
    id: 8,
    title: "Walnut Frame Sofa Set",
    category: "living-room",
    label: "Living Room",
    materialType: "linen",
    materialLabel: "Linen Fabric",
    material: "Solid Walnut Wood Rim, Textured Linen",
    price: 1100,
    oldPrice: null,
    discount: "",
    rating: 4.1,
    popularity: 78,
    isNewest: false,
    stock: "in-stock",
    stockVal: 12,
    status: "Active",
    availability: "In Stock",
    color: "Walnut Brown & Gray",
    images: [
      "product-images/walnut-frame-sofa-set-main.jpeg.jpeg",
      "product-images/walnut-frame-sofa-set-angle-1.jpeg.jpeg",
      "product-images/walnut-frame-sofa-set-angle-2.jpeg.jpeg",
      "product-images/walnut-frame-sofa-set-angle-3.jpeg.jpeg"
    ]
  },
  {
    id: 9,
    title: "Emerald Luxe Dining Set",
    category: "dining-room",
    label: "Dining Room",
    materialType: "marble",
    materialLabel: "Marble",
    material: "Velvet Upholstery, Marble Top Table",
    price: 1600,
    oldPrice: 1800,
    discount: "11% off",
    rating: 4.9,
    popularity: 89,
    isNewest: false,
    stock: "in-stock",
    stockVal: 6,
    status: "Active",
    availability: "In Stock",
    color: "Emerald Green & Gold",
    images: [
      "product-images/emerald-luxe-dining-set-main.jpeg.jpeg",
      "product-images/emerald-luxe-dining-set-angle-1.jpeg.jpeg",
      "product-images/emerald-luxe-dining-set-angle-2.jpeg.jpeg",
      "product-images/emerald-luxe-dining-set-angle-3.jpeg.jpeg"
    ]
  },
  {
    id: 10,
    title: "Walnut Sage Dining Set",
    category: "dining-room",
    label: "Dining Room",
    materialType: "wood",
    materialLabel: "Wood",
    material: "Natural Oak Top, Eco-Leather Chairs",
    price: 1250,
    oldPrice: 1390,
    discount: "10% off",
    rating: 5.0,
    popularity: 94,
    isNewest: true,
    stock: "in-stock",
    stockVal: 11,
    status: "Active",
    availability: "In Stock",
    color: "Sage Green & Walnut Wood",
    images: [
      "product-images/walnut-sage-dining-set-main.jpeg.jpeg",
      "product-images/walnut-sage-dining-set-angle-1.jpeg.jpeg",
      "product-images/walnut-sage-dining-set-angle-2.jpeg.jpeg",
      "product-images/walnut-sage-dining-set-angle-3.jpeg.jpeg"
    ]
  }
];

export const defaultOrders = [
  { id: "#MF-250522-001", phone: "0612345678", customer: "Abdi Hassan", amount: "$350.00", payment: "Paid", paymentType: "paid", address: "Hodan, Mogadishu", driver: "Ahmed Ali - 0619988776", estimate: "Delivered successfully", currentStep: 5, product: "Bloom Accent Chair Set Set", date: "May 22, 2026" },
  { id: "#MF-250522-002", phone: "0611112222", customer: "Hodan Ali", amount: "$350.00", payment: "Pending", paymentType: "pending", address: "Wadajir, Mogadishu", driver: "Not assigned yet", estimate: "Waiting for payment verification", currentStep: 1, product: "Bloom Accent Chair Set Set", date: "May 22, 2026" },
  { id: "#MF-250522-003", phone: "0613334444", customer: "Omar Mohamed", amount: "$180.00", payment: "Paid", paymentType: "paid", address: "Karaan, Mogadishu", driver: "Hassan Omar - 0614455667", estimate: "Out for delivery via driver", currentStep: 4, product: "Olive Curve Lounge Chair", date: "May 21, 2026" },
  { id: "#MF-250522-004", phone: "0614445555", customer: "Ayan Abdullahi", amount: "$530.00", payment: "Pending", paymentType: "pending", address: "Hamarweyne, Mogadishu", driver: "Not assigned yet", estimate: "Waiting for payment verification", currentStep: 1, product: "Blush Velvet Arch Bed", date: "May 21, 2026" },
  { id: "#MF-250522-005", phone: "0615556666", customer: "Mohamed Yusuf", amount: "$760.00", payment: "Paid", paymentType: "paid", address: "Wadajir, Mogadishu", driver: "Ahmed Ali - 0619988776", estimate: "Delivered successfully", currentStep: 5, product: "Ivory Cloud Sofa Set", date: "May 20, 2026" },
  { id: "#MF-250522-006", phone: "0616667777", customer: "Mustafa Omar", amount: "$340.00", payment: "Failed", paymentType: "failed", address: "Hodan, Mogadishu", driver: "Not assigned", estimate: "Order Cancelled", currentStep: 0, product: "Sage Wood Platform Bed", date: "May 20, 2026" },
  { id: "#MF-250522-007", phone: "0617778888", customer: "Fadumo Hassan", amount: "$230.00", payment: "Paid", paymentType: "paid", address: "Karaan, Mogadishu", driver: "Hassan Omar - 0614455667", estimate: "Preparing order", currentStep: 3, product: "Bloom Accent Chair Set Set", date: "May 19, 2026" },
  { id: "#MF-250522-008", phone: "0618889999", customer: "Ali Warsame", amount: "$150.00", payment: "Paid", paymentType: "paid", address: "Hodan, Mogadishu", driver: "Ahmed Ali - 0619988776", estimate: "Delivered successfully", currentStep: 5, product: "Bloom Accent Chair Set Set", date: "May 18, 2026" },
  { id: "#MF-250522-009", phone: "0619990000", customer: "Halima Sadia", amount: "$850.00", payment: "Pending", paymentType: "pending", address: "Wadajir, Mogadishu", driver: "Not assigned yet", estimate: "Waiting for payment verification", currentStep: 1, product: "Blush Velvet Arch Bed", date: "May 18, 2026" },
  { id: "#MF-250522-010", phone: "0611239876", customer: "Farhan Barre", amount: "$1,600.00", payment: "Paid", paymentType: "paid", address: "Karaan, Mogadishu", driver: "Hassan Omar - 0614455667", estimate: "Delivered successfully", currentStep: 5, product: "Emerald Luxe Dining Set", date: "May 17, 2026" },
  { id: "#MF-250522-011", phone: "0615432109", customer: "Sahra Ilmi", amount: "$980.00", payment: "Paid", paymentType: "paid", address: "Hodan, Mogadishu", driver: "Ahmed Ali - 0619988776", estimate: "Delivered successfully", currentStep: 5, product: "Ivory Cloud Sofa Set", date: "May 17, 2026" },
  { id: "#MF-250522-012", phone: "0618765432", customer: "Warsame Duale", amount: "$1,450.00", payment: "Pending", paymentType: "pending", address: "Wadajir, Mogadishu", driver: "Not assigned yet", estimate: "Waiting for payment verification", currentStep: 1, product: "Sunhaven Patio Lounge Set", date: "May 16, 2026"   }
];

defaultProducts.forEach((product, index) => {
  product.price = priceForProductId(product.id, index);
  if (product.oldPrice != null) {
    product.oldPrice = oldPriceForProductId(product.id, index);
  }
});

export const defaultUsers = [
  { id: "USR-001", firstName: "Abdirahman", lastName: "", email: "admin@gmail.com", phone: "+252615000000", address: "Mogadishu, Somalia", password: "admin123", avatar: "https://ui-avatars.com/api/?name=Abdirahman&background=073D35&color=ffffff&bold=true&size=128" },
  { id: "USR-1001", firstName: "Abdifatah", lastName: "Hassan", email: "abdifatah@gmail.com", phone: "0612345678", address: "Hodan, Mogadishu", password: "customer123", avatar: "" },
  { id: "USR-1002", firstName: "Mohamed", lastName: "Nur", email: "mohamed@gmail.com", phone: "0611112222", address: "Wadajir, Mogadishu", password: "customer123", avatar: "" },
  { id: "USR-1003", firstName: "Amina", lastName: "Yusuf", email: "amina@gmail.com", phone: "0613334444", address: "Karaan, Mogadishu", password: "customer123", avatar: "" }
];

export const DELIVERY_DISTRICTS = [
  { value: 'Hodan', fee: 0.01 },
  { value: 'Wadajir', fee: 0.01 },
  { value: 'Karaan', fee: 0.02 },
  { value: 'Hamarweyne', fee: 0.01 },
  { value: 'Dayniile', fee: 0.02 },
  { value: 'Yaqshid', fee: 0.01 },
];

export function findDistrictByDeliveryFee(fee) {
  const amount = Number(fee) || 0;
  if (amount <= 0) return '';
  const match = DELIVERY_DISTRICTS.find((d) => Math.abs(d.fee - amount) < 0.0001);
  return match?.value || DELIVERY_DISTRICTS[0]?.value || '';
}

let cachedDeliveryDistricts = null;

export async function fetchDeliveryDistricts(forceRefresh = false) {
  if (!forceRefresh && cachedDeliveryDistricts) return cachedDeliveryDistricts;
  try {
    const response = await fetch(apiUrl('/api/cms'));
    const data = await response.json();
    if (data.success && Array.isArray(data.cms?.deliveryFees) && data.cms.deliveryFees.length) {
      cachedDeliveryDistricts = data.cms.deliveryFees.map(({ district, fee }) => ({
        value: district,
        fee: Number(fee),
      }));
      return cachedDeliveryDistricts;
    }
  } catch {
    /* fall back to defaults */
  }
  cachedDeliveryDistricts = DELIVERY_DISTRICTS;
  return cachedDeliveryDistricts;
}

export function clearDeliveryDistrictsCache() {
  cachedDeliveryDistricts = null;
}

export function initializeLocalStorage() {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify(defaultUsers));
  }

  let localProducts = [];
  try {
    localProducts = JSON.parse(localStorage.getItem('products')) || [];
  } catch {
    /* ignore */
  }

  const hasAll10 = localProducts.length === 10 && localProducts.some(p => p.title === "Bloom Accent Chair Set");
  const hasLegacyPrices = localProducts.some((p) => Number(p.price) > 1);

  if (!localStorage.getItem('products') || !hasAll10 || hasLegacyPrices) {
    localStorage.setItem('products', JSON.stringify(defaultProducts));
  }
  if (!localStorage.getItem('orders')) {
    localStorage.setItem('orders', JSON.stringify(defaultOrders));
  }
}

export function normalizePhoneNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('252')) cleaned = cleaned.slice(3);
  if (cleaned.startsWith('0')) cleaned = cleaned.slice(1);
  return cleaned;
}

// Re-export shared phone helpers (canonical +252, 061, 61…)
export {
  buildCheckoutPhone,
  CHECKOUT_PHONE_PREFIX,
  CHECKOUT_PHONE_SUFFIX_KEY,
  formatPhoneE164,
  isValidSomaliMobile,
  parsePhoneForStorage,
  parseSomaliPhoneInput,
  phonesMatch,
  readCheckoutPhoneSuffix,
} from './phone.js';

export function normalizeOrderId(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const upper = trimmed.toUpperCase();
  if (upper.startsWith('#')) return upper;
  if (upper.startsWith('MF-')) return `#${upper}`;
  return trimmed;
}

export function getProductsList() {
  try {
    return JSON.parse(localStorage.getItem('products')) || defaultProducts;
  } catch {
    return defaultProducts;
  }
}
