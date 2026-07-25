# Mogadishu Modern Furniture (MMF)
## Dukumeenti Guud — Bilow ilaa Dhammaad (Af-Soomaali)

> **Ujeeddo:** Qoraalkan wuxuu si fudud u sharaxayaa waxa nidaamku yahay, sida uu u shaqeeyo, luuqadaha, API-yada, xogta, iyo sida qaybaha isugu xiran yihiin. Waxaa loo qoray si qof kasta u fahmo.

---

## 1. Waa maxay nidaamkan?

**Mogadishu Modern Furniture (MMF)** waa **nidaam ganacsi elektaroonig ah (e-commerce)** oo alaabta guriga (furniture) lagu iibiyo online.

### Waxa uu qabto:
- Macmiilku wuxuu **daawadaa alaabta**, ku darayaa **cart**, isticmaalaa **wishlist**
- Wuxuu **dalbadaa** (checkout) oo **lacag bixiyaa EVC Plus** (Waafi)
- Wuxuu **raadiyaa order-kiisa**, **cancels** haddii weli la geeyn
- **Admin** wuxuu maamulaa: alaab, orders, users, stock, payments, drivers, CMS, reviews
- **Driver** wuxuu helaa deliveries, aqbalaa/diidaa, wuxuu cusboonaysiiyaa xaaladda geeynta
- **Support chat**, **notifications**, **email** (Gmail OTP, order confirmation), **reviews**

### Sida loo ordayo (development):
| Qayb | Port | Tusaale URL |
|------|------|-------------|
| Frontend (React) | 5173 | `http://localhost:5173` |
| Backend (API) | 5000 | `http://localhost:5000` |
| Database | Cloud | MongoDB Atlas |

---

## 2. Luuqadaha & Teknoolajiyada

### Frontend (Wajiga macmiilka + Dashboard)
| Teknoolaji | Ujeeddo |
|------------|---------|
| **React 18** | UI components |
| **Vite** | Build tool & dev server |
| **React Router** | Bogag kala duwan (`/`, `/products`, `/admin`, iwm.) |
| **Tailwind CSS** | Design & styling |
| **JavaScript (JSX)** | Code-ka frontend |
| **localStorage** | Cart, wishlist, login token (ku meel gaar ah browser-ka) |

### Backend (Server & API)
| Teknoolaji | Ujeeddo |
|------------|---------|
| **Node.js** | Runtime |
| **Express.js** | API server |
| **MongoDB + Mongoose** | Database |
| **JWT** | Login token (30 maalmood) |
| **bcryptjs** | Password hashing |
| **Nodemailer** | Email (Gmail SMTP) |
| **Multer** | Upload sawirrada |
| **Helmet + CORS + Rate limit** | Amni |

### Adeegyo dibadeed (External)
| Adeeg | Ujeeddo |
|-------|---------|
| **Waafi API** | EVC Plus payment |
| **MongoDB Atlas** | Kaydinta xogta |
| **Gmail SMTP** | Email & forgot password OTP |

---

## 3. Tirada Files (qiyaas)

| Qayb | Tirada files (qiyaas) |
|------|----------------------|
| **Frontend** (`src/`) | ~83 file (`.jsx`, `.js`, `.css`) |
| **Backend** (`backend/`) | ~85 file (`.js`) |
| **Database models** | **18 model** (collections MongoDB) |
| **API route groups** | **14 kooxood** (`/api/auth`, `/api/orders`, iwm.) |

### Qaab dhismeedka folder-ka

```
frontend e-commerce desing/
├── src/                    ← FRONTEND
│   ├── pages/              ← Bogag waaweyn (Home, Products, Cart, Checkout, Admin, Delivery…)
│   ├── features/           ← Qaybo gaar ah (admin tabs, profile, driver, checkout…)
│   ├── components/         ← Qaybo la wada isticmaalo
│   ├── context/            ← Global state (Auth, Cart, Products, Wishlist)
│   ├── hooks/              ← Custom React hooks
│   └── utils/              ← Helpers (format, phone, order status…)
├── backend/                ← BACKEND
│   ├── controllers/        ← Logic-ka API (waxa dhaca marka request timaado)
│   ├── models/             ← Database schemas
│   ├── routes/             ← URL paths → controllers
│   ├── services/           ← Email, payment, notifications, stock…
│   ├── middleware/         ← Auth, security, staff shopping block
│   ├── utils/              ← Helpers
│   └── config/             ← Database, timing
└── docs/                   ← Dukumeenti
```

---

## 4. Database — 18 Collections (Models)

| Model | Waxa kaydisa |
|-------|--------------|
| **User** | Macaamiisha, admin, driver — magac, email, phone, password, role |
| **Product** | Alaabta (title, price, images, stock, category) |
| **Category** | Qaybaha alaabta (Chair, Bedroom, iwm.) |
| **Order** | Dalabaadka — items, lacag, status, driver, delivery fee |
| **Cart** | Cart server-side (user walba) |
| **Wishlist** | Liiska jeclaysiga |
| **PaymentTransaction** | Taariikhda lacag bixinta Waafi |
| **Notification** | Ogeysiisyada (in-app) |
| **Review** | Review alaabta |
| **SupportTicket** | Tikidhada taageerada |
| **SupportMessage** | Farriimaha chat-ka |
| **CmsContent** | Bogagga About/Contact (admin wuu beddeli karaa) |
| **StockBatch** | Batch stock (FIFO) |
| **StockHistory** | Taariikhda stock changes |
| **StockConsumption** | Alaab la iibiyay / order-ka laga jaray |
| **UserActivity** | Waxqabadka user (login, order, iwm.) |
| **OrderActivity** | Log order changes |

### Lambarka taleefanka (phone)
Dhammaan lambarrada Soomaaliya waxaa loo kaydiyaa qaab **canonical**: `+25261xxxxxxx`  
`+252`, `061`, `61` — **isku mid** backend iyo database.

---

## 5. Roles (Doorka isticmaalaha)

| Role | Waxa uu sameeyo | Bogga uu galayo |
|------|-----------------|-----------------|
| **user** (customer) | Iibsado, profile, track order | Store + Profile |
| **admin** | Maamulo dukaanka | `/admin` dashboard |
| **delivery** (driver) | Geeyo alaabta | `/delivery` kaliya |

### Xeerarka role-ka (hadda):
- **Admin** login → toos **Dashboard**. Wuxuu arki karaa store **preview** (View Store) laakiin **cart/wishlist/checkout waa xiran**
- **Driver** → **kaliya** delivery page, ma geli karo store

---

## 6. Bogagga Frontend (Pages)

### Macmiilka (Customer Store)
| Bog | URL | Sharaxaad |
|-----|-----|-----------|
| Home | `/` | Bogga hore, alaab featured |
| Products | `/products` | Dhammaan alaabta + filter |
| Cart | `/cart` | Gaadhifure |
| Checkout | `/checkout` | Dalab + EVC Plus |
| Login/Register | `/login`, `/register` | Account |
| Profile | `/profile` | Macluumaad, orders, notifications, support |
| Track Order | `/track-order` | Raadinta order |
| About / Contact | `/about`, `/contact` | CMS content |
| Apply Delivery | `/apply-delivery` | Codsi driver noqoshada |

### Admin Dashboard (`/admin`)
| Tab | Waxa uu qabto |
|-----|---------------|
| **Dashboard** | Stats, revenue, top products, charts |
| **Orders** | Maamul orders, assign driver, edit |
| **Users** | Macaamiisha & staff |
| **Products** | CRUD alaab + sawirro |
| **Stock** | Batches, history, consumption |
| **Payments** | Waafi transactions |
| **Delivery** | Drivers & assignments |
| **Driver Applications** | Ogolaanshaha drivers |
| **Support** | Chat macaamiisha |
| **Reviews** | Moderate reviews |
| **CMS** | About/Contact content |
| **Settings** | Admin theme, preferences |

### Driver (`/delivery`)
- Liiska deliveries (pending, active, done)
- Accept / Reject assignment
- Cusboonaysii status (out for delivery → delivered)
- **Delivery revenue** stat card (delivery fee kaliya)

---

## 7. Dhammaan API-yada

Base URL: `http://localhost:5000/api`

### `/api/auth` — Authentication & Users
| Method | Path | Sharaxaad |
|--------|------|-----------|
| POST | `/register` | Diiwaangelin |
| POST | `/login` | Galitaan |
| POST | `/verify-phone` | Forgot password — phone verify |
| POST | `/verify-otp` | OTP verify |
| POST | `/reset-password` | Password cusub |
| GET | `/profile` | Profile user-ka |
| PUT | `/profile` | Update profile |
| PUT | `/change-password` | Beddel password |
| GET | `/users` | Admin: dhammaan users |
| PUT | `/users/:id` | Admin: edit user |
| DELETE | `/users/:id` | Admin: delete user |

### `/api/products` — Alaabta
| Method | Path | Sharaxaad |
|--------|------|-----------|
| GET | `/` | Dhammaan alaabta (public) |
| GET | `/:id` | Hal alaab |
| POST | `/` | Admin: abuur alaab |
| PUT | `/:id` | Admin: update |
| DELETE | `/:id` | Admin: delete |
| GET | `/:id/stock-inventory` | Admin: stock detail |

### `/api/orders` — Dalabaadka
| Method | Path | Sharaxaad |
|--------|------|-----------|
| POST | `/` | Place order (checkout) |
| GET | `/` | Orders (user/admin/driver) |
| GET | `/track/:orderId` | Track order (public + phone verify) |
| PATCH | `/cancel/:orderId` | Cancel order |
| GET | `/:orderId/details` | Faahfaahin order |
| PATCH | `/:id/assign` | Admin: assign driver |
| PUT | `/:id` | Admin/Driver: update step/status |

### `/api/payments` — Lacag bixinta
| Method | Path | Sharaxaad |
|--------|------|-----------|
| GET | `/config` | Waafi configured? |
| POST | `/waafi` | EVC Plus charge |
| GET | `/order/:orderId/status` | Payment status |
| GET | `/transactions` | Admin: dhammaan transactions |

### `/api/cart` & `/api/wishlist`
| Method | Path | Sharaxaad |
|--------|------|-----------|
| GET/PUT | `/cart` | Sync cart |
| POST | `/cart/validate` | Validate cart items |
| GET/PUT/POST | `/wishlist` | Wishlist sync/toggle |

### `/api/coupons`
| POST | `/validate` | Hubi coupon code |

### `/api/drivers`
| Method | Path | Sharaxaad |
|--------|------|-----------|
| POST | `/apply` | Codsi driver |
| GET | `/my-earnings` | Driver delivery revenue |
| GET | `/my-status` | Available/offline |
| POST | `/assignments/:orderId/accept` | Aqbal delivery |
| POST | `/assignments/:orderId/reject` | Diid delivery |
| GET | `/applications` | Admin: codsiyada |

### `/api/notifications`
| GET | `/` | Liiska notifications |
| PATCH | `/read-all`, `/:id/read` | Akhri |

### `/api/reviews`
| GET | `/prompt` | Review prompt kadib delivery |
| POST | `/` | Qor review |
| GET | `/product/:productId` | Reviews alaab |

### `/api/support`
| POST/GET | `/chats` | Support chat |
| GET | `/admin/chats` | Admin inbox |

### `/api/cms`
| GET | `/` | Public content (About, Contact) |
| PUT | `/` | Admin: beddel CMS |

### `/api/categories`
| CRUD | `/` | Qaybaha alaabta |

### `/api/admin`
| GET | `/dashboard-stats` | Revenue, orders, top products |

### `/api/health`
| GET | `/health` | Server + database status |

---

## 8. Sida qaybaha isugu xiran yihiin (Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Macmiilka)                       │
│  React App (Vite) — pages, components, context             │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP + JWT Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express) :5000               │
│  Routes → Controllers → Services → Models                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    MongoDB Atlas    Waafi (EVC)      Gmail SMTP
```

### Tusaale: Macmiil wuxuu dalbadaa
1. **Checkout page** → data u dir `/api/orders` (POST)
2. **Backend** → sameeyo Order (`currentStep: 1`, `payment: Pending`)
3. **Stock** → la yareeyo (held)
4. **Frontend** → u dir `/api/payments/waafi` (EVC Plus)
5. **Waafi** → lacag ka jara phone-ka
6. Haddii **success** → `paymentType: paid`, notifications, email
7. **Admin** → wuu arkaa order dashboard-ka
8. **Admin** → assign driver
9. **Driver** → accept → update steps → delivered
10. **Customer** → review prompt + notification

---

## 9. Order Progress — Tallaabooyinka Dalabka

Order-ku wuxuu leeyahay **`currentStep`** (nambar 0–5):

| Step | Magac | Macnaha |
|------|-------|---------|
| **1** | Order Placed | Dalab la sameeyay, lacag wali pending |
| **2** | Payment | Paid / Pending / Failed |
| **3** | Preparing | Admin wuxuu diyaarinayaa alaabta |
| **4** | Out for Delivery | Driver wuu waday |
| **5** | Delivered | La geeyay macmiilka |
| **0** | Cancelled | La joojiyay |

### Payment status (ka duwan delivery step):
- **Pending** — EVC weli ma approve gareyn
- **Paid** — Lacag la bixiyay
- **Failed** — Waafi way fashilantay (retry waa la samayn karaa)
- **Refunded** — Lacag la celiyay (kadib cancel)

### Cancel & Refund logic:
- Macmiilku wuu **cancel** gareyn karaa **ka hor** Out for Delivery (step 4)
- Marka la cancel gareeyo order **paid** ah → refund **la qorsheeyaa** (`refundDueAt`)
- Kadib **1 saac** (testing) → refund scheduler wuxuu celiyaa EVC
- `refundStatus`: `none` → `scheduled` → `completed` / `failed`

---

## 10. Revenue Logic (Lacagta)

### Admin Dashboard Revenue
Wuxuu tiriyaa **wadarta order-ka oo dhan** (paid orders):
```
Revenue = subtotal + deliveryFee − discount
```
Tusaale: alaab `$0.02` + delivery `$0.01` = **Dashboard: $0.03**

### Driver Earnings
Driver wuxuu helaa **delivery fee kaliya** marka order-ku:
- Uu yahay **delivered** (step 5)
- Uu yahay **paid**
- Uusan **cancelled** ahayn
- `assignedDriverId` uu yahay driver-kaas

Tusaale isla order-ka kor ku xusan → **Driver: $0.01**

---

## 11. Notification Logic (Ogeysiisyada)

Notifications waxaa lagu kaydiyaa **database** (`Notification` model) oo user walba wuxuu helaa liis.

### Goorta la abuuro:
| Dhacdo | Notification type | Yaa helaya |
|--------|-------------------|------------|
| Order la sameeyay | `order_placed` | Customer |
| | `new_order` | Admin |
| Lacag bixintu guulaysatay | `payment_success` | Customer |
| Lacag way fashilantay | `payment_failed` | Customer |
| Admin wuxuu beddelay step | `order_preparing`, `order_shipped`, `order_delivered` | Customer |
| Driver la assign gareeyay | `delivery_assigned` | Driver |
| Driver wuu aqbalay | `delivery_accepted` | Admin |
| Driver wuu diiday | `driver_rejected` | Admin |
| Support message | `support_message`, `new_support_ticket` | Admin/Customer |
| Driver application | `driver_application` | Admin |
| Wishlist item back in stock | `wishlist_stock` | Customer |

### Frontend polling:
- Navbar & Profile → **30 ilbiriqsi** kasta way cusboonaysiisaa `/api/notifications`
- Marka notification cusub timaado → toast message

---

## 12. Stock Logic (Kaydka alaabta)

- Alaab kasta waxay leedahay **stock** (tirada hartay)
- Stock wuxuu ku shaqeeyaa **FIFO batches** (batch-kii hore ayaa la iibiyaa marka hore)
- Marka order la sameeyo → stock **la yareeyo** (consumption log)
- Marka order la cancel gareeyo → stock **la celiyaa**
- Admin → Stock tab: batches, history, sold per order

---

## 13. Payment Flow (EVC Plus / Waafi)

1. Customer wuxuu geliyaa phone `+25261xxxxxxx` checkout-ka
2. Order la sameeyaa → `payment: Pending`
3. Frontend wuxuu u yeedhaa `/api/payments/waafi`
4. Waafi wuxuu EVC Plus u diraa phone-ka → macmiilku PIN geliyaa
5. **Success** → order `paid`, admin dashboard revenue kor u kaca
6. **Fail** → retry payment modal, `paymentFailCount` kor u kaca

---

## 14. Security (Amniga)

- **Password** → bcrypt hash (plain text ma kaydsana)
- **JWT token** → 30 maalmood, header: `Authorization: Bearer <token>`
- **Rate limiting** → login, OTP (spam ka hortag)
- **Helmet** → HTTP security headers
- **Role middleware** → `protect` + `authorize('admin')` routes-ka xaddida
- **Staff shopping block** → admin/driver ma dalban karaan

---

## 15. PWA & Internet Deployment (Berrito — qorshe)

Hadda nidaamku wuxuu ku shaqeeyaa **localhost**. Berrito aad internetka saari doontaan:

### Deployment (guud ahaan):
1. **Frontend** → Vercel, Netlify, ama VPS (build: `npm run build`)
2. **Backend** → Railway, Render, VPS (Node + PM2)
3. **Database** → MongoDB Atlas (horey u jira)
4. **Domain** → tusaale `www.mmfurniture.com`
5. **HTTPS** → SSL certificate (lagama maarmaan PWA & payment)
6. **Environment variables** → `.env` production (WAAFI keys, MongoDB URI, SMTP)

### PWA (Progressive Web App):
- `manifest.json` — magac, icon, theme
- **Service Worker** — offline cache, "Add to Home Screen"
- Phone-ka macmiilka/driver-ka wuxuu u ekaan karaa **app** download ah
- Waxaa la samayn doonaa berrito: install prompt, icons, offline fallback

---

## 16. Kooban — Socodka Nolosha Order-ka (Step by Step)

```
1. Macmiil wuxuu galaa /products
2. Wuxuu ku darayaa cart → checkout
3. Wuxuu buuxiyaa: magac, phone, district, delivery date
4. Wuxuu dalbadaa → Order #MF-YYMMDD-XXX la sameeyaa
5. EVC Plus wuxuu ka jaraa phone-ka
6. Admin dashboard → wuu arkaa order cusub + notification
7. Admin → Preparing (step 3) → assign driver
8. Driver → notification → accept
9. Driver → Out for delivery (step 4)
10. Driver → Delivered (step 5)
11. Customer → notification + review prompt (2 daqiiqo kadib)
12. Dashboard revenue += wadarta order-ka
13. Driver earnings += delivery fee kaliya
```

---

## 17. Faylasha Muhiimka ah (Quick Reference)

| Ujeeddo | Frontend | Backend |
|---------|----------|---------|
| Routing | `src/App.jsx` | `backend/server.js` |
| Login | `src/pages/Auth.jsx` | `authController.js` |
| Checkout | `src/pages/Checkout.jsx` | `orderController.js` |
| Admin UI | `src/pages/Admin.jsx` | `adminController.js` |
| Driver UI | `src/pages/Delivery.jsx` | `driverController.js` |
| Payments | `src/utils/waafiPayment.js` | `paymentController.js` + `waafiService.js` |
| Notifications | `src/hooks/useNotifications.js` | `notificationService.js` |
| Order status | `src/utils/orderStatus.js` | `orderController.js` |
| Phone normalize | `src/utils/phone.js` | `utils/phoneUtils.js` |
| Timing (refund/review) | `usePostDeliveryReviewPrompt.js` | `config/timingConfig.js` |

---

*Dukumeentigan wuxuu ku salaysan yahay xaaladda nidaamka MMF ilaa July 2026. Haddii wax la beddelo code-ka, cusboonaysii qoraalkan.*

**Mahadsanid — Mogadishu Modern Furniture Team**
