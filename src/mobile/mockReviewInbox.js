/** Mock review inbox so Profile → Reviews UI can be previewed without backend data. */
export const MOCK_REVIEW_INBOX = {
  toRate: [
    {
      orderId: 'ORD-2024-0001',
      deliveredAt: '2024-05-20T14:20:00',
      delivery: {
        status: 'missing',
        rating: null,
        comment: '',
        ratedAt: null,
        driverName: 'Mohamed Ali',
        driverPhone: '+252 61 987 6543',
        driverAvatar: '',
      },
      products: [
        {
          productId: 101,
          title: 'Ivory Luxe Living Room Set',
          image: 'product-images/ivory-luxe-living-room-set-main.jpeg.jpeg',
          status: 'missing',
          rating: null,
          comment: '',
          reviewId: null,
        },
        {
          productId: 102,
          title: 'Walnut Frame Sofa Set',
          image: 'product-images/walnut-frame-sofa-set-main.jpeg.jpeg',
          status: 'missing',
          rating: null,
          comment: '',
          reviewId: null,
        },
      ],
      progress: { rated: 0, total: 3 },
      isComplete: false,
    },
    {
      orderId: 'ORD-2024-0004',
      deliveredAt: '2024-04-12T11:00:00',
      delivery: {
        status: 'done',
        rating: 5,
        comment: 'On time and careful with the furniture.',
        ratedAt: '2024-04-12T18:00:00',
        driverName: 'Ahmed Hassan',
        driverPhone: '+252 61 555 0199',
        driverAvatar: '',
      },
      products: [
        {
          productId: 103,
          title: 'Sage Wood Platform Bed',
          image: 'product-images/sage-wood-platform-bed-main.jpeg.jpeg',
          status: 'missing',
          rating: null,
          comment: '',
          reviewId: null,
        },
      ],
      progress: { rated: 1, total: 2 },
      isComplete: false,
    },
  ],
  history: {
    delivery: [
      {
        orderId: 'ORD-2024-0004',
        rating: 5,
        comment: 'On time and careful with the furniture.',
        ratedAt: '2024-04-12T18:00:00',
        driverName: 'Ahmed Hassan',
      },
      {
        orderId: 'ORD-2023-0088',
        rating: 4,
        comment: '',
        ratedAt: '2023-12-02T09:30:00',
        driverName: 'Delivery driver',
      },
    ],
    products: [
      {
        reviewId: 'REV-MOCK-1',
        productId: 104,
        title: 'Olive Curve Lounge Chair',
        rating: 5,
        comment: 'Looks great in the living room.',
        status: 'live',
        createdAt: '2024-03-01T10:00:00',
      },
      {
        reviewId: 'REV-MOCK-2',
        productId: 105,
        title: 'Emerald Luxe Dining Set',
        rating: 4,
        comment: 'Solid build — waiting for approval.',
        status: 'pending',
        createdAt: '2024-05-28T16:20:00',
      },
    ],
  },
};
