# Chapter 4: System Implementation and Integration

## 4.1 Introduction

This chapter describes the implementation of the **Mogadishu Modern Furniture E-Commerce System**, including the customer-facing web application, the administrative dashboard, the backend REST API, and the MongoDB database. It explains how these components communicate, how user roles are enforced, and how data flows from the storefront through the server to persistent storage.

The system was developed using a **three-tier architecture**:

1. **Presentation tier** — React (Vite) single-page application for customers, drivers, and administrators.
2. **Application tier** — Node.js with Express.js exposing RESTful APIs and Server-Sent Events (SSE) for real-time support chat.
3. **Data tier** — MongoDB Atlas (NoSQL) storing users, products, orders, support tickets, and driver applications.

---

## 4.2 Development Environment and Tools

| Tool | Purpose |
|------|---------|
| React 18 + Vite | Frontend framework and build tool |
| React Router v6 | Client-side routing and protected routes |
| Node.js + Express | Backend API server |
| Mongoose | MongoDB object modelling and queries |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| MongoDB Atlas | Cloud database hosting |
| Netlify | Frontend deployment (production) |
| Git | Version control |

Local development runs both servers concurrently via `npm run dev`, which starts the backend on port **5000** and the frontend on port **5173**. Vite proxies `/api` requests to the backend, enabling a unified origin during development.

---

## 4.3 Database Design and Seeding

The database consists of five primary collections:

### 4.3.1 Users Collection
Stores customer, admin, and delivery driver accounts. Fields include `email`, hashed `password`, `role` (`user`, `admin`, `delivery`), profile data, and optional `driverApplication` subdocument (`none`, `pending`, `approved`, `rejected`).

### 4.3.2 Products Collection
Stores furniture catalogue items with `title`, `category`, `materialType`, `price`, `images`, `stock`, `status`, and `rating`.

### 4.3.3 Orders Collection
Stores customer orders with `orderId`, customer details, `items`, `amount`, `status`, `paymentType`, `deliveryAddress`, and optional `assignedDriverId`.

### 4.3.4 Support Tickets and Messages
Support tickets link to users; messages store chat history between customers and administrators.

### 4.3.5 Database Seeding
On first startup, `seedDatabase()` in `server.js` populates default users, ten products, twelve sample orders, and four support tickets if collections are empty. This ensures the system is demonstrable immediately after installation.

**Seed accounts for demonstration:**

| Email | Password | Role |
|-------|----------|------|
| admin@gmail.com | admin123 | Admin |
| abdifatah@gmail.com | customer123 | Customer |
| driver@gmail.com | driver123 | Delivery driver |

---

## 4.4 Backend API Implementation

The backend exposes five route groups mounted under `/api`:

### 4.4.1 Authentication (`/api/auth`)
- `POST /register` — Create new customer account
- `POST /login` — Return JWT token and user profile
- `GET /profile`, `PUT /profile` — Protected profile read/update
- `PUT /change-password` — Password change
- `POST /verify-phone`, `POST /reset-password` — Forgot-password flow
- `GET /users`, `DELETE /users/:id` — Admin-only user management

### 4.4.2 Products (`/api/products`)
- `GET /` — Public product listing
- `POST /`, `PUT /:id`, `DELETE /:id` — Admin-only CRUD with optional image upload

### 4.4.3 Orders (`/api/orders`)
- `POST /` — Place order (guest or authenticated)
- `GET /track/:orderId` — Public order tracking
- `PATCH /cancel/:orderId` — Customer cancellation
- `GET /` — Authenticated user order history (filtered by phone)
- `PUT /:id`, `PATCH /:id/assign` — Admin/driver order updates

### 4.4.4 Support (`/api/support`)
- User chat creation, message send/receive
- Admin inbox at `/admin/chats`
- SSE stream at `/stream` for real-time message delivery

### 4.4.5 Drivers (`/api/drivers`)
- `POST /apply` — Customer applies as delivery driver
- Admin approve/reject applications
- `GET /approved` — List drivers for order assignment

**Security middleware:** `protect` validates JWT from `Authorization: Bearer` header. `authorize('admin')` restricts sensitive routes to administrators.

---

## 4.5 Customer Website Implementation

### 4.5.1 Application Structure
The React application uses a context-based state architecture:

- **AuthContext** — Login, register, profile sync with backend
- **ProductsContext** — Fetches catalogue from `/api/products`, caches in localStorage
- **CartContext** — Client-side cart (localStorage) for performance
- **WishlistContext** — Client-side wishlist (localStorage)

### 4.5.2 Key Customer Pages

| Page | Route | Backend Integration |
|------|-------|---------------------|
| Home | `/` | Products from API |
| Shop | `/products` | Products + filters |
| Cart | `/cart` | Local storage |
| Checkout | `/checkout` | `POST /api/orders` |
| Track Order | `/track-order` | `GET /api/orders/track/:id` |
| Profile | `/profile` | Auth, orders, support chat |
| Apply Delivery | `/apply-delivery` | `POST /api/drivers/apply` |
| Delivery Dashboard | `/delivery` | `GET/PUT /api/orders` |

### 4.5.3 Protected Routes
`ProtectedRoute.jsx` enforces role-based access. Unauthenticated users redirect to `/login`. Users with wrong roles redirect to their appropriate dashboard.

---

## 4.6 Admin Dashboard Implementation

The admin panel combines React components with legacy page logic (`adminPageLogic.js`) that manages tab switching and DOM rendering for data tables.

### 4.6.1 Admin Components
- **AdminSidebar** — Navigation between eleven functional tabs
- **AdminHeader** — Page title, search, notifications, profile
- **DriverApplicationsTab** — React component for driver approval workflow

### 4.6.2 Admin Functional Tabs

| Tab | Function | API Used |
|-----|----------|----------|
| Dashboard | Statistics, charts, recent orders | GET products, orders, users, support |
| Orders | Filter, edit, export CSV | GET/PUT orders |
| Users | View/delete customers | GET/DELETE auth/users |
| Products | CRUD catalogue | GET/POST/PUT/DELETE products |
| Stock | Inventory levels | PUT products |
| Payments | Verify mobile money payments | PUT orders |
| Delivery | Assign drivers, update status | PATCH assign, PUT orders |
| Driver Applications | Approve/reject drivers | POST drivers/applications |
| Support | Live chat inbox + SSE | GET/POST support, SSE stream |
| Reviews | Moderate customer reviews | localStorage (client-side) |
| Settings | Delivery fee configuration | localStorage (client-side) |

### 4.6.3 Customer–Admin Bridge
When a customer places an order via checkout, the order is persisted to MongoDB. The admin dashboard loads the same orders collection via `GET /api/orders`. When admin verifies payment or assigns a driver, updates are written back to MongoDB and visible to the customer on Track Order and Profile pages.

Support chat uses the same ticket IDs: customers create tickets in Profile → Help; administrators respond in Admin → Support with real-time SSE updates.

---

## 4.7 Delivery Driver Module

Approved drivers log in and access `/delivery`. The dashboard shows orders assigned to them. Drivers can call customers, open map links, and update delivery status (`Processing` → `Shipped` → `Delivered`).

The application workflow:
1. Customer registers and submits driver application
2. Admin reviews in Driver Applications tab
3. Upon approval, user role becomes `delivery`
4. Admin assigns orders to approved drivers

---

## 4.8 Authentication and Authorization Flow

```
Customer Login → POST /api/auth/login → JWT stored in localStorage
              → Subsequent requests include Authorization: Bearer <token>
              → Backend middleware validates token and attaches user to request
Admin Login   → role === 'admin' → redirect to /admin
Driver Login  → role === 'delivery' → redirect to /delivery
```

Passwords are hashed with bcrypt before storage. JWT tokens expire according to server configuration.

---

## 4.9 Frontend–Backend Communication Pattern

All React API calls use `apiUrl()` from `src/utils/data.js`, which returns relative paths (`/api/...`). In development, Vite proxies these to `localhost:5000`. In production (Netlify), the API base URL can be configured via environment variable.

Admin dashboard logic uses the same `apiUrl()` helper, ensuring consistent routing across customer and admin interfaces.

---

## 4.10 User Interface Implementation

The customer interface preserves the original HTML design aesthetic migrated to React components. CSS is organized per page (`Home.css`, `Products.css`, `Admin.css`) with shared utilities in `auth.css` and `product-cards-original.css`.

The admin dashboard uses a compact sidebar (220px), transparent header, and responsive stat cards. Search inputs use pill-shaped styling with gold focus animation consistent with the shop page.

---

## 4.11 Error Handling and Fallbacks

- **ProductsContext:** Falls back to localStorage catalogue if API unavailable
- **Admin loadGlobalData:** Falls back to localStorage after API failure; caches successful responses for 30 seconds to reduce load during tab switching
- **AuthContext:** Returns user-friendly message if backend unreachable
- **Checkout:** Validates form fields client-side before API submission

---

## 4.12 Deployment Architecture

| Component | Platform |
|-----------|----------|
| Frontend (React build) | Netlify CDN |
| Backend API | Requires Node.js host or Netlify Functions (future) |
| Database | MongoDB Atlas |
| Images | `/public` folder (static) + optional `/uploads` on server |

Production deployment requires MongoDB Atlas IP whitelisting and environment variables (`MONGODB_URI`, `JWT_SECRET`) configured on the server.

---

## 4.13 Testing Performed During Implementation

Manual testing was conducted across:

1. User registration and login flows
2. Product browsing, cart, and checkout
3. Order tracking and cancellation
4. Admin product CRUD and order management
5. Support chat (customer ↔ admin) with SSE
6. Driver application and delivery workflow
7. Responsive layout on mobile and desktop viewports

---

## 4.14 Summary

Chapter 4 presented the complete implementation of the Mogadishu Modern Furniture e-commerce system. The architecture separates concerns across React frontend, Express backend, and MongoDB database while maintaining a unified data model. Customer actions on the storefront propagate to the admin dashboard through shared API endpoints, enabling end-to-end order lifecycle management from purchase to delivery.

Future enhancements identified include real-time push notifications, integration with a live mobile money payment API, and migration of remaining localStorage-only features (reviews, delivery fee settings) to the backend.

---

## 4.15 Chapter Summary (for presentation)

**What was built:**
- Full-stack e-commerce with 3 user roles (customer, admin, driver)
- 10+ customer pages in React
- 11-tab admin dashboard with live data
- REST API with 25+ endpoints
- MongoDB database with seed data
- Real-time support chat via SSE

**Technologies:** React, Node.js, Express, MongoDB, JWT, Vite, Netlify

**Integration point:** Single MongoDB database shared by customer app and admin dashboard through Express REST API.
