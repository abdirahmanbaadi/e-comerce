const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('./config/database');

// Import Models
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
const SupportTicket = require('./models/SupportTicket');
const SupportMessage = require('./models/SupportMessage');
const Category = require('./models/Category');
const CmsContent = require('./models/CmsContent');
const { getDefaultCms } = require('./controllers/cmsController');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const supportRoutes = require('./routes/supportRoutes');
const driverRoutes = require('./routes/driverRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const cmsRoutes = require('./routes/cmsRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const couponRoutes = require('./routes/couponRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes('*') || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, corsOrigins[0]);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parser Middleware
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads in JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static Folder for Uploaded Images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbLabels = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const dbConnected = dbState === 1;
  res.status(dbConnected ? 200 : 503).json({
    success: dbConnected,
    status: dbConnected ? 'ok' : 'degraded',
    database: dbLabels[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// Simple Welcome Route
app.get('/', (req, res) => {
  res.json({ message: 'Ku soo dhawaada Mogadishu Modern Furniture API Backend!' });
});

// Database Seed Function
const seedDatabase = async () => {
  try {
    // 1. Seed Users (Hash their passwords first)
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding users table...');
      const defaultUsers = [
        {
          id: "USR-001",
          firstName: "Abdirahman",
          lastName: "Hassan",
          email: "admin@gmail.com",
          phone: "+252615000000",
          address: "Mogadishu, Somalia",
          password: "admin123",
          role: "admin",
          avatar: "https://ui-avatars.com/api/?name=Abdirahman&background=073D35&color=ffffff&bold=true&size=128"
        },
        {
          id: "USR-1001",
          firstName: "Abdifatah",
          lastName: "Hassan",
          email: "abdifatah@gmail.com",
          phone: "0612345678",
          address: "Hodan, Mogadishu",
          password: "customer123",
          role: "user",
          avatar: ""
        },
        {
          id: "USR-1002",
          firstName: "Mohamed",
          lastName: "Nur",
          email: "mohamed@gmail.com",
          phone: "0611112222",
          address: "Wadajir, Mogadishu",
          password: "customer123",
          role: "user",
          avatar: ""
        },
        {
          id: "USR-1003",
          firstName: "Amina",
          lastName: "Yusuf",
          email: "amina@gmail.com",
          phone: "0613334444",
          address: "Karaan, Mogadishu",
          password: "customer123",
          role: "user",
          avatar: ""
        },
        {
          id: "USR-2001",
          firstName: "Darawal",
          lastName: "Ali",
          email: "driver@gmail.com",
          phone: "0619988776",
          address: "Hamarweyne, Mogadishu",
          password: "driver123",
          role: "delivery",
          avatar: "",
          driverApplication: {
            status: "approved",
            district: "Hamarweyne",
            vehicleType: "van",
            experience: "2 years delivery experience in Mogadishu",
            availability: "full-time",
            appliedAt: new Date(),
            reviewedAt: new Date(),
            rejectReason: ""
          }
        }
      ];

      for (const u of defaultUsers) {
        const salt = await bcrypt.genSalt(10);
        u.password = await bcrypt.hash(u.password, salt);
        await User.create(u);
      }
      console.log('Users seeded successfully.');
    }

    // 2. Seed Products
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log('Seeding products table...');
      const defaultProducts = [
        {
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
            "chair/bloom-round-accent-chair-set-main.jpeg.png",
            "chair/bloom-round-accent-chair-set-angle-1.jpeg.png",
            "chair/bloom-round-accent-chair-set-angle-2.jpeg.png",
            "chair/bloom-round-accent-chair-set-angle-3.jpeg.png"
          ]
        },
        {
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
            "chair/olive-curve-lounge-chair-main.jpeg.png",
            "chair/olive-curve-lounge-chair-angle-1.jpeg.png",
            "chair/olive-curve-lounge-chair-angle-2.jpeg.png",
            "chair/olive-curve-lounge-chair-angle-3.jpeg.png"
          ]
        },
        {
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
            "bedroom/blush-velvet-arch-bed-main.jpeg.jpeg",
            "bedroom/blush-velvet-arch-bed-angle-1.jpeg.jpeg",
            "bedroom/blush-velvet-arch-bed-angle-2.jpeg.jpeg",
            "bedroom/blush-velvet-arch-bed-main.jpeg.jpeg"
          ]
        },
        {
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
            "bedroom/sage-wood-platform-bed-main.jpeg.jpeg",
            "bedroom/sage-wood-platform-bed-angle-1.jpeg.jpeg",
            "bedroom/sage-wood-platform-bed-angle-2.jpeg.jpeg",
            "bedroom/sage-wood-platform-bed-main.jpeg.jpeg"
          ]
        },
        {
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
            "bedroom/linen-upholstered-king-bed.png",
            "bedroom/sage-wood-platform-bed-angle-1.jpeg.jpeg",
            "bedroom/sage-wood-platform-bed-angle-2.jpeg.jpeg",
            "bedroom/linen-upholstered-king-bed.png"
          ]
        },
        {
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
            "living-room/ivory-cloud-sofa-set-main.jpeg.jpeg",
            "living-room/ivory-cloud-sofa-set-angle-1.jpeg.jpeg",
            "living-room/ivory-cloud-sofa-set-angle-2.jpeg.jpeg",
            "living-room/ivory-cloud-sofa-set-main.jpeg.jpeg"
          ]
        },
        {
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
            "living-room/ivory-luxe-living-room-set-main.jpeg.jpeg",
            "living-room/ivory-luxe-living-room-set-angle-1.jpeg.jpeg",
            "living-room/ivory-luxe-living-room-set-angle-2.jpeg.jpeg",
            "living-room/ivory-luxe-living-room-set-angle-3.jpeg.jpeg"
          ]
        },
        {
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
            "living-room/walnut-frame-sofa-set-main.jpeg.jpeg",
            "living-room/walnut-frame-sofa-set-angle-1.jpeg.jpeg",
            "living-room/walnut-frame-sofa-set-angle-2.jpeg.jpeg",
            "living-room/walnut-frame-sofa-set-angle-3.jpeg.jpeg"
          ]
        },
        {
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
            "dining-room/emerald-luxe-dining-set-main.jpeg.jpeg",
            "dining-room/emerald-luxe-dining-set-angle-1.jpeg.jpeg",
            "dining-room/emerald-luxe-dining-set-angle-2.jpeg.jpeg",
            "dining-room/emerald-luxe-dining-set-angle-3.jpeg.jpeg"
          ]
        },
        {
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
            "dining-room/walnut-sage-dining-set-main.jpeg.jpeg",
            "dining-room/walnut-sage-dining-set-angle-1.jpeg.jpeg",
            "dining-room/walnut-sage-dining-set-angle-2.jpeg.jpeg",
            "dining-room/walnut-sage-dining-set-angle-3.jpeg.jpeg"
          ]
        }
      ];

      for (const p of defaultProducts) {
        await Product.create(p);
      }
      console.log('Products seeded successfully.');
    }

    // 3. Seed Orders
    const orderCount = await Order.countDocuments();
    if (orderCount === 0) {
      console.log('Seeding orders table...');
      const defaultOrders = [
        {
          id: "#MF-250522-001",
          phone: "0612345678",
          customer: "Abdi Hassan",
          amount: "$350.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Hodan, Mogadishu",
          driver: "Ahmed Ali - 0619988776",
          estimate: "Delivered successfully",
          currentStep: 5,
          product: "Bloom Accent Chair Set Set",
          date: "May 22, 2026"
        },
        {
          id: "#MF-250522-002",
          phone: "0611112222",
          customer: "Hodan Ali",
          amount: "$350.00",
          payment: "Pending",
          paymentType: "pending",
          address: "Wadajir, Mogadishu",
          driver: "Not assigned yet",
          estimate: "Waiting for payment verification",
          currentStep: 1,
          product: "Bloom Accent Chair Set Set",
          date: "May 22, 2026"
        },
        {
          id: "#MF-250522-003",
          phone: "0613334444",
          customer: "Omar Mohamed",
          amount: "$180.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Karaan, Mogadishu",
          driver: "Hassan Omar - 0614455667",
          estimate: "Out for delivery via driver",
          currentStep: 4,
          product: "Olive Curve Lounge Chair",
          date: "May 21, 2026"
        },
        {
          id: "#MF-250522-004",
          phone: "0614445555",
          customer: "Ayan Abdullahi",
          amount: "$530.00",
          payment: "Pending",
          paymentType: "pending",
          address: "Hamarweyne, Mogadishu",
          driver: "Not assigned yet",
          estimate: "Waiting for payment verification",
          currentStep: 1,
          product: "Blush Velvet Arch Bed",
          date: "May 21, 2026"
        },
        {
          id: "#MF-250522-005",
          phone: "0615556666",
          customer: "Mohamed Yusuf",
          amount: "$760.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Wadajir, Mogadishu",
          driver: "Ahmed Ali - 0619988776",
          estimate: "Delivered successfully",
          currentStep: 5,
          product: "Ivory Cloud Sofa Set",
          date: "May 20, 2026"
        },
        {
          id: "#MF-250522-006",
          phone: "0616667777",
          customer: "Mustafa Omar",
          amount: "$340.00",
          payment: "Failed",
          paymentType: "failed",
          address: "Hodan, Mogadishu",
          driver: "Not assigned",
          estimate: "Order Cancelled",
          currentStep: 0,
          product: "Sage Wood Platform Bed",
          date: "May 20, 2026"
        },
        {
          id: "#MF-250522-007",
          phone: "0617778888",
          customer: "Fadumo Hassan",
          amount: "$230.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Karaan, Mogadishu",
          driver: "Hassan Omar - 0614455667",
          estimate: "Preparing order",
          currentStep: 3,
          product: "Bloom Accent Chair Set Set",
          date: "May 19, 2026"
        },
        {
          id: "#MF-250522-008",
          phone: "0618889999",
          customer: "Ali Warsame",
          amount: "$150.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Hodan, Mogadishu",
          driver: "Ahmed Ali - 0619988776",
          estimate: "Delivered successfully",
          currentStep: 5,
          product: "Bloom Accent Chair Set Set",
          date: "May 18, 2026"
        },
        {
          id: "#MF-250522-009",
          phone: "0619990000",
          customer: "Halima Sadia",
          amount: "$850.00",
          payment: "Pending",
          paymentType: "pending",
          address: "Wadajir, Mogadishu",
          driver: "Not assigned yet",
          estimate: "Waiting for payment verification",
          currentStep: 1,
          product: "Blush Velvet Arch Bed",
          date: "May 18, 2026"
        },
        {
          id: "#MF-250522-010",
          phone: "0611239876",
          customer: "Farhan Barre",
          amount: "$1,600.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Karaan, Mogadishu",
          driver: "Hassan Omar - 0614455667",
          estimate: "Delivered successfully",
          currentStep: 5,
          product: "Emerald Luxe Dining Set",
          date: "May 17, 2026"
        },
        {
          id: "#MF-250522-011",
          phone: "0615432109",
          customer: "Sahra Ilmi",
          amount: "$980.00",
          payment: "Paid",
          paymentType: "paid",
          address: "Hodan, Mogadishu",
          driver: "Ahmed Ali - 0619988776",
          estimate: "Delivered successfully",
          currentStep: 5,
          product: "Ivory Cloud Sofa Set",
          date: "May 17, 2026"
        },
        {
          id: "#MF-250522-012",
          phone: "0618765432",
          customer: "Warsame Duale",
          amount: "$1,450.00",
          payment: "Pending",
          paymentType: "pending",
          address: "Wadajir, Mogadishu",
          driver: "Not assigned yet",
          estimate: "Waiting for payment verification",
          currentStep: 1,
          product: "Sunhaven Patio Lounge Set",
          date: "May 16, 2026"
        }
      ];

      for (const o of defaultOrders) {
        await Order.create(o);
      }
      console.log('Orders seeded successfully.');
    }

    // 4. Seed Support Tickets & Messages
    const ticketCount = await SupportTicket.countDocuments();
    if (ticketCount === 0) {
      console.log('Seeding support tickets table...');
      const defaultTickets = [
        { id: "TKT-3021", userId: "USR-1001", name: "Abdifatah Hassan", email: "abdifatah@gmail.com", subject: "Sariirta midabka Arch Bed", status: "Open", lastMessageText: "I need help with my order", lastMessageAt: new Date(Date.now() - 3600000 * 2), date: "2026-06-22" },
        { id: "TKT-3022", userId: "USR-1001", name: "Abdifatah Hassan", email: "abdifatah@gmail.com", subject: "Cilad bixinta lacagta", status: "Open", lastMessageText: "Payment not confirmed", lastMessageAt: new Date(Date.now() - 3600000 * 4), date: "2026-06-21" },
        { id: "TKT-3023", userId: "USR-1002", name: "Mohamed Nur", email: "mohamed@gmail.com", subject: "Hagaha cabirka Kursiga", status: "Replied", lastMessageText: "Our support team has replied to your message.", lastMessageAt: new Date(Date.now() - 3600000 * 6), date: "2026-06-20" },
        { id: "TKT-3024", userId: "USR-1003", name: "Amina Yusuf", email: "amina@gmail.com", subject: "Address Change", status: "Closed", lastMessageText: "Change delivery address", lastMessageAt: new Date(Date.now() - 3600000 * 8), date: "2026-06-19" }
      ];

      const defaultMessages = [
        { ticketId: "TKT-3021", senderRole: "user", senderName: "Abdifatah Hassan", messageText: "I need help with my order" },
        { ticketId: "TKT-3022", senderRole: "user", senderName: "Abdifatah Hassan", messageText: "Payment not confirmed" },
        { ticketId: "TKT-3023", senderRole: "user", senderName: "Mohamed Nur", messageText: "Where is my delivery?" },
        { ticketId: "TKT-3023", senderRole: "admin", senderName: "Support Admin", messageText: "We reviewed your issue and found that your EVC Plus payment was not completed successfully. Please try the payment again using the same phone number you used before. If the problem continues, our support team will be happy to help you further." },
        { ticketId: "TKT-3024", senderRole: "user", senderName: "Amina Yusuf", messageText: "Change delivery address" }
      ];

      for (const t of defaultTickets) {
        await SupportTicket.create(t);
      }
      for (const m of defaultMessages) {
        await SupportMessage.create(m);
      }
      console.log('Support tickets & messages seeded successfully.');
    }

    const categoryCount = await Category.countDocuments();
    if (categoryCount === 0) {
      const defaultCategories = [
        { id: 'CAT-living', name: 'Living Room', slug: 'living-room', order: 1 },
        { id: 'CAT-bedroom', name: 'Bedroom', slug: 'bedroom', order: 2 },
        { id: 'CAT-dining', name: 'Dining Room', slug: 'dining-room', order: 3 },
        { id: 'CAT-chair', name: 'Chairs', slug: 'chair', order: 4 },
        { id: 'CAT-office', name: 'Office', slug: 'office', order: 5 },
        { id: 'CAT-outdoor', name: 'Outdoor', slug: 'outdoor', order: 6 },
      ];
      await Category.insertMany(defaultCategories);
      console.log('Categories seeded successfully.');
    }

    const cmsCount = await CmsContent.countDocuments();
    if (cmsCount === 0) {
      await CmsContent.create(getDefaultCms());
      console.log('CMS content seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding database:', err);
  }
};

// Connect to MongoDB and Start Server
const startServer = async () => {
  try {
    await connectDB();
    try {
      const { ensureIndexes } = require('./utils/ensureIndexes');
      await ensureIndexes();
      console.log('MongoDB indexes verified.');
    } catch (indexErr) {
      console.warn('Index setup skipped:', indexErr.message);
    }

    const server = app.listen(PORT, () => {
      console.log(`Backend server is running on port ${PORT}`);
    });

    seedDatabase().catch((err) => console.error('Error seeding database:', err));

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\nPort ${PORT} is already in use.`);
        console.error('Close the other backend process (Ctrl+C) or run:');
        console.error(`  netstat -ano | findstr :${PORT}`);
        console.error('  taskkill /PID <PID> /F\n');
        process.exit(1);
      }
      throw err;
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();
