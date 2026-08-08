const MOCK_ADDRESS = {
  customer: 'Abdirahman Abdullahi',
  phone: '+252 61 234 5678',
  address: 'Km4, Maka Al Mukarama Road, Hodan District, Mogadishu, Somalia',
};

const P = {
  ivory: {
    title: 'Ivory Luxe Living Room Set',
    color: 'Ivory',
    price: 450,
    image: 'product-images/ivory-luxe-living-room-set-main.jpeg.jpeg',
  },
  dining: {
    title: 'Wooden Dining Table',
    color: 'Natural Wood',
    price: 399,
    image: 'product-images/dining-table.png',
  },
  olive: {
    title: 'Olive Curve Lounge Chair',
    color: 'Olive',
    price: 199,
    image: 'product-images/olive-curve-lounge-chair-main.jpeg.png',
  },
  walnut: {
    title: 'Walnut Sage Dining Set',
    color: 'Walnut Sage',
    price: 168,
    image: 'product-images/walnut-sage-dining-set-main.jpeg.jpeg',
  },
  blush: {
    title: 'Blush Velvet Arch Bed',
    color: 'Blush Pink',
    price: 520,
    image: 'product-images/blush-velvet-arch-bed-main.jpeg.jpeg',
  },
  outdoor: {
    title: 'Sunhaven Outdoor Lounge Set',
    color: 'Sand',
    price: 380,
    image: 'product-images/sunhaven-outdoor-lounge-set-main.jpeg.jpeg',
  },
  office: {
    title: 'Executive Office Chair',
    color: 'Black',
    price: 145,
    image: 'product-images/office-chair.png',
  },
  cloud: {
    title: 'Ivory Cloud Sofa Set',
    color: 'Ivory White',
    price: 610,
    image: 'product-images/ivory-cloud-sofa-set-main.jpeg.jpeg',
  },
  bloom: {
    title: 'Bloom Accent Chair Set',
    color: 'Sand Beige',
    price: 150,
    image: 'product-images/bloom-round-accent-chair-set-main.jpeg.png',
  },
};

function line(product, quantity = 1) {
  return { ...product, quantity };
}

function totalsFromItems(items, deliveryFee = 0, discount = 0) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(0, subtotal + deliveryFee - discount);
  return {
    subtotal,
    deliveryFee,
    discount,
    amount: `$${total.toFixed(2)}`,
  };
}

const items0001 = [
  line(P.ivory, 1),
  line(P.olive, 2),
  line(P.bloom, 1),
  line(P.office, 1),
  line(P.cloud, 1),
]; // 5 lines

const items0002 = [
  line(P.dining, 1),
  line(P.walnut, 1),
  line(P.blush, 1),
  line(P.outdoor, 1),
  line(P.olive, 1),
  line(P.bloom, 2),
  line(P.office, 1),
]; // 7 lines

const items0003 = [
  line(P.olive, 1),
  line(P.ivory, 1),
  line(P.dining, 1),
  line(P.walnut, 1),
  line(P.blush, 1),
  line(P.outdoor, 1),
  line(P.office, 1),
  line(P.cloud, 1),
  line(P.bloom, 1),
]; // 9 lines

const items0004 = [
  line(P.walnut, 1),
  line(P.olive, 1),
  line(P.bloom, 1),
  line(P.office, 1),
  line(P.dining, 1),
]; // 5 lines

export const MOCK_ORDERS = [
  {
    id: 'ORD-2024-0001',
    status: 'delivered',
    currentStep: 5,
    date: '2024-05-20T14:20:00',
    product: items0001[0].title,
    ...MOCK_ADDRESS,
    ...totalsFromItems(items0001, 30, 50),
    items: items0001,
  },
  {
    id: 'ORD-2024-0002',
    status: 'shipped',
    currentStep: 4,
    deliveryQrPending: true,
    deliveryConfirmStatus: 'pending',
    assignedDriverId: 'DRV-MOCK-001',
    driver: 'Mohamed Ali',
    driverInfo: {
      id: 'DRV-MOCK-001',
      name: 'Mohamed Ali',
      phone: '+252 61 987 6543',
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
      ratingAvg: 4.8,
      ratingCount: 36,
    },
    estimate: 'May 22, 2024',
    deliveryDate: 'May 22, 2024',
    date: '2024-05-18T09:30:00',
    product: items0002[0].title,
    ...MOCK_ADDRESS,
    ...totalsFromItems(items0002, 20, 0),
    items: items0002,
  },
  {
    id: 'ORD-2024-0003',
    status: 'processing',
    currentStep: 2,
    date: '2024-05-16T11:05:00',
    product: items0003[0].title,
    ...MOCK_ADDRESS,
    ...totalsFromItems(items0003, 12, 0),
    items: items0003,
  },
  {
    id: 'ORD-2024-0004',
    status: 'cancelled',
    date: '2024-05-12T16:40:00',
    product: items0004[0].title,
    ...MOCK_ADDRESS,
    ...totalsFromItems(items0004, 8, 0),
    items: items0004,
  },
];

export function findMockOrder(orderId) {
  const id = decodeURIComponent(String(orderId || '')).replace(/^#/, '');
  return MOCK_ORDERS.find((order) => String(order.id) === id) || null;
}

export function updateMockOrderAddress(orderId, address) {
  const order = findMockOrder(orderId);
  if (!order) return null;
  order.address = String(address || '').trim();
  return { ...order };
}
