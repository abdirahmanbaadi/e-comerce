import { formatMoney } from './format';

export function getLastOrderDetails() {
  try {
    const stored = JSON.parse(localStorage.getItem('lastOrderDetails'));
    if (stored?.orderId) return stored;
  } catch {
    // ignore
  }

  return {
    orderId: 'MF-250515-001',
    total: 650,
    customerName: 'Abdullahi Hassan',
    customerPhone: '+252 61 2345678',
    paymentMethod: 'EVC Plus',
    paymentStatus: 'Paid',
    deliveryAddress: 'Hodan District, Mogadishu',
    orderStatus: 'Confirmed',
    orderDate: 'May 15, 2025',
    items: [
      {
        title: 'Luxe 3-Seater Sofa',
        image: '/living-room/ivory-cloud-sofa-set-main.jpeg.jpeg',
        quantity: 1,
        price: 650,
      },
      {
        title: 'Bloom Accent Chair Set',
        image: '/chair/bloom-round-accent-chair-set-main.jpeg.png',
        quantity: 1,
        price: 150,
      },
      {
        title: 'Blush Velvet Arch Bed',
        image: '/bedroom/blush-velvet-arch-bed-main.jpeg.jpeg',
        quantity: 1,
        price: 850,
      },
    ],
  };
}

export function getOrderTotalFormatted(order) {
  if (!order?.total) return '$650.00';
  return typeof order.total === 'string' && order.total.startsWith('$')
    ? order.total
    : formatMoney(order.total);
}
