# Defense Demo Guide — Mogadishu Modern Furniture

## Before Presentation (Critical Checklist)

### 1. MongoDB Atlas (MUST DO)
- Go to https://cloud.mongodb.com → Network Access
- Add your current IP or `0.0.0.0/0` (Allow from anywhere) for demo day
- Without this, **backend will NOT start**

### 2. Start System
```powershell
cd "c:\Users\hp\Videos\frontend e-commerce desing"
npm run dev
```
- Frontend: http://localhost:5173/
- Backend: http://localhost:5000/
- Wait for: `MongoDB Atlas Connected` + `Backend server is running on port 5000`

### 3. Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | admin123 |
| Customer | abdifatah@gmail.com | customer123 |
| Driver | driver@gmail.com | driver123 |

### 4. Rehearse Once
Run the full demo script below on the **same laptop** you will use for defense.
Test **EVC Plus (Waafi)** once with the checkout phone number before the panel.

---

## Supervisor Panel — 6 Points (Prepared Answers)

| # | Issue | What we fixed | What to say |
|---|-------|---------------|-------------|
| 1 | **Payment** | Waafi API → checkout phone → EVC prompt → PIN on SIM | "Lacagta waxaa toos loogu diraa telefoonka checkout-ka; qofka wuxuu ogolaadaa oo PIN geliyaa." |
| 2 | **MongoDB slow** | Tab-scoped admin fetch, indexes, loading overlay | "Data waa MongoDB Atlas; admin wuxuu soo raraa kaliya tab la furay." |
| 3 | **Driver busy** | Availability (available/busy/offline), max 3 active, reassign | "Haddii driver mashquul yahay, admin wuxuu dooran karaa driver kale." |
| 4 | **Admin boring** | React CMS/Reviews/Categories tabs + visual polish | "Admin wuxuu maamulaa orders, CMS, drivers — dhammaan MongoDB." |
| 5 | **Forgot password SMS** | Phone → SMS OTP first, email fallback | "OTP wuxuu u socdaa SMS; Gmail waa backup haddii SMS aan configured ahayn." |
| 6 | **Too many files** | Removed legacy `public/js/*`; MVC structure | "Separation of concerns — components, controllers, routes; ma aha duplication." |

---

## Demo Script (15 minutes)

### Part 1: Customer Website (5 min)
1. Open `/` — homepage with CMS hero content, products
2. Go to `/products` — filter, search, open product modal, add to cart
3. Login as **abdifatah@gmail.com** / **customer123**
4. Go to `/cart` → `/checkout`
   - Phone: `0612345678` (same format as account)
   - Payment: **EVC Plus** (same phone as checkout) **or** Cash on Delivery as backup
5. Copy order ID → `/track-order` — track status
6. Profile → Orders tab — show order appears

### Part 2: Admin Dashboard (5 min)
1. Logout → Login as **admin@gmail.com** / **admin123**
2. Auto-redirect to `/admin`
3. **Dashboard** — live stats from MongoDB
4. **Orders** — find new order, update status, assign driver to **driver@gmail.com**
5. **Products** — show product list from API
6. **CMS / Content** — edit hero text, save
7. **Support** — reply to customer ticket
8. **Notifications** — bell shows real alerts from backend

### Part 3: Driver (3 min)
1. Login as **driver@gmail.com** / **driver123** → `/delivery`
2. Show assigned order (admin must assign first!)
3. Update status to Delivered
4. Customer track order — status updated

### Part 4: Architecture (2 min)
- React (Vite) frontend → `/api` proxy → Express backend → MongoDB Atlas
- JWT authentication + role-based access (admin, user, delivery)
- Notifications, orders, reviews, CMS stored in MongoDB

---

## Payment — What To Say

| Method | Demo recommendation |
|--------|----------------------|
| **Cash on Delivery** | ✅ Use this in live demo — always works |
| **EVC Plus (Waafi)** | Integrated via `POST /api/payments/waafi` — requires Waafi credentials in `backend/.env` and real wallet test |

**If asked about Waafi:** "We integrated the Waafi API for EVC Plus. The payment is deducted from the phone number entered at checkout. We validate that the EVC account matches the order phone before charging."

---

## Forgot Password Demo

1. Login page → **Forgot Password**
2. Enter registered phone (e.g. `0612345678`)
3. SMS code sent (or email fallback if Twilio not configured)
4. Enter 6-digit code → set new password

---

## Features Implemented

| Feature | Status |
|---------|--------|
| React SPA (Home, Products, Cart, Checkout, Profile, Admin) | ✅ |
| MongoDB backend (orders, products, users, notifications) | ✅ |
| JWT auth — email or phone login | ✅ |
| Guest checkout | ✅ |
| Admin dashboard + real API data | ✅ |
| Driver assignment + delivery dashboard | ✅ |
| Support chat (SSE) | ✅ |
| Notifications (MongoDB + polling) | ✅ |
| CMS (hero, banners, FAQ) | ✅ |
| Reviews API + admin moderation | ✅ |
| Server-side wishlist (logged in) | ✅ |
| PDF invoice download | ✅ |
| Waafi EVC Plus integration | ✅ (charges checkout phone via Waafi) |
| SMS OTP forgot password | ✅ (SMS first, email fallback) |
| Real product prices from MongoDB | ✅ (demo test prices $0.001 for Waafi rehearsal) |
| Delivery fees from CMS | ✅ (test fees for demo) |

---

## Known Limitations (Be Honest If Asked)

| Item | Explanation |
|------|-------------|
| Cart | Browser localStorage (fast UX; orders saved to MongoDB on checkout) |
| SMS OTP | Requires Twilio in `.env`; email fallback when SMS unavailable |
| Netlify URL alone | Frontend only — demo must run locally with `npm run dev` |

---

## If Something Breaks During Demo

| Problem | Fix |
|---------|-----|
| Backend won't start | Check MongoDB Atlas IP whitelist + `backend/.env` |
| Login fails | Ensure backend on port 5000 |
| Products show wrong prices | Hard refresh (Ctrl+Shift+R) — prices come from MongoDB |
| Profile orders empty | Use same phone format as account (e.g. `0612345678`) |
| Driver sees no orders | Admin → Orders → assign driver first |
| Waafi payment fails | Switch to Cash on Delivery |

---

## Supervisor Questions — Prepared Answers

**Q: How does customer data reach admin?**
A: Same MongoDB. Checkout POSTs to `/api/orders`. Admin GETs `/api/orders` with JWT admin role.

**Q: How is security handled?**
A: JWT tokens, bcrypt passwords, role middleware on backend, ProtectedRoute on frontend. Payment validates phone matches order.

**Q: What database?**
A: MongoDB Atlas — cloud-hosted, Mongoose ODM.

**Q: Payment integration?**
A: Waafi API for EVC Plus (`backend/services/waafiService.js`). Cash on Delivery also supported.

**Q: Notifications?**
A: Stored in MongoDB, created on order/support events, polled by frontend every 15 seconds.
