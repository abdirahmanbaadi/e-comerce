# MOGADISHU MODERN FURNITURE (MMF)
## Defense Presentation — Af-Soomaali
### E-Commerce Platform | Full-Stack Web Application

> **Muddo lagu taliyay:** 15–20 daqiiqo  
> **Qaab:** Slide kasta = 1 bog PowerPoint / Google Slides  
> **Demo:** `npm run dev` → localhost:5173

---

# SLIDE 1 — TITLE

## Mogadishu Modern Furniture
### Nidaam Ganacsi Elektaroonig ah (E-Commerce)

**Magaca ardayga:** _________________________  
**Jaamacadda / Kuliyadda:** _________________________  
**Sanadka:** 2026

**Kooban hal jumlad:**  
Waxaan dhisay website + dashboard oo alaabta guriga lagu iibiyo online, lacag EVC Plus lagu bixiyo, admin iyo driver ay maamulaan.

---

# SLIDE 2 — AGENDA (Waxa aan soo bandhigi doono)

1. Dhibaatada & Ujeeddada
2. Xalka — Overview nidaamka
3. Qaab dhismeedka (Architecture)
4. Luuqadaha & Teknoolajiyada
5. 3 Roles: Customer, Admin, Driver
6. Muuqaalada muhiimka ah (Features)
7. Socodka Order-ka (Order Flow)
8. Lacag bixinta (EVC Plus / Waafi)
9. Database & API
10. Amniga (Security)
11. Tirakoobka mashruuca
12. Demo toos ah
13. Mustaqbalka (PWA + Internet)
14. Gabagabo & Su'aalo

---

# SLIDE 3 — DHIIBAATADA (Problem Statement)

## Dhibaatooyinka ganacsiga furniture-ka ee caadiga ah:

| # | Dhibaato | Saamaynta |
|---|----------|-----------|
| 1 | Macmiilku waa inuu imanayaa dukaanka | Waqti & masaafo |
| 2 | Ma jiro hab online ah oo lacag ammaan ah | Kalsooni yar |
| 3 | Ma jiro raadinta dalabka (tracking) | Macmiil ma oga xaaladda |
| 4 | Ma jiro maamul digital ah (stock, orders) | Khalad & daahitaan |
| 5 | Geeynta alaabta ma laha nidaam la socdo | Isku xirnaan la'aan |

**Hadafka:** Samee nidaam **hal meel ah** oo online ah oo xaliya dhibaatooyinkan.

---

# SLIDE 4 — UJEEDDADA (Objectives)

## Ujeeddooyinka mashruuca:

✅ In macmiilku **online u arko** alaabta oo **dalbado**  
✅ In lacag **EVC Plus** lagu bixiyo (Waafi API)  
✅ In macmiilku **raadiyo** dalabkiisa (track order)  
✅ In **admin** uu maamulo: alaab, orders, users, stock, CMS  
✅ In **driver** uu helo geeyn, aqbalo/diido, cusboonaysiiyo status  
✅ In **notifications & email** la diro marka wax isbeddelo  
✅ In xogta **MongoDB** cloud lagu kaydiyo  

---

# SLIDE 5 — XALKA (Solution Overview)

## Mogadishu Modern Furniture — Waa maxay?

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   MACMIILKA   │     │    ADMIN     │     │    DRIVER    │
│  (Website)   │     │  (Dashboard) │     │  (Delivery)  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            ▼
                   ┌─────────────────┐
                   │  BACKEND API    │
                   │  Node + Express │
                   └────────┬────────┘
                            ▼
              ┌─────────────┴─────────────┐
              ▼                           ▼
       ┌─────────────┐            ┌─────────────┐
       │  MongoDB    │            │  Waafi EVC  │
       │   Atlas     │            │   + Gmail   │
       └─────────────┘            └─────────────┘
```

**3 qaybood, 1 database, 1 API.**

---

# SLIDE 6 — ARCHITECTURE (Qaab Dhismeedka)

## Client–Server Architecture

| Lakab | Teknoolaji | Shaqada |
|-------|------------|---------|
| **Presentation** | React + Vite + Tailwind | Wajiga isticmaalaha |
| **Application** | Node.js + Express | Business logic & API |
| **Data** | MongoDB Atlas + Mongoose | Kaydinta xogta |
| **External** | Waafi, Gmail SMTP | Lacag & email |

### Data flow (tusaale):
```
Browser → fetch('/api/orders') → Controller → Service → MongoDB → JSON response → UI update
```

**Separation of Concerns:**
- `pages/` + `features/` = UI
- `controllers/` = waxa dhaca
- `models/` = qaabka xogta
- `services/` = email, payment, notifications

---

# SLIDE 7 — LUQADAHA (Tech Stack)

## Frontend
| Tool | Ujeeddo |
|------|---------|
| React 18 | UI components |
| Vite | Dev server & build |
| React Router | Navigation |
| Tailwind CSS | Design |
| Context API | Auth, Cart, Wishlist |

## Backend
| Tool | Ujeeddo |
|------|---------|
| Node.js + Express | API server |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| bcrypt | Password hash |
| Multer | Image upload |
| Nodemailer | Email |

## External
| Tool | Ujeeddo |
|------|---------|
| Waafi API | EVC Plus payment |
| MongoDB Atlas | Cloud database |
| Gmail SMTP | OTP & confirmations |

---

# SLIDE 8 — 3 ROLES (Doorka Isticmaalayaasha)

| Role | Galitaanka | Waxa uu sameeyo |
|------|------------|-----------------|
| **Customer** (`user`) | `/login` → Home | Iibsado, track, profile, support |
| **Admin** (`admin`) | `/login` → `/admin` | Maamul dhammaan dukaanka |
| **Driver** (`delivery`) | `/login` → `/delivery` | Geeyo alaabta kaliya |

### Xeerarka amniga:
- Admin → **preview** store (cart/checkout **xiran**)
- Driver → **kaliya** delivery page
- JWT token + role middleware backend-ka

---

# SLIDE 9 — CUSTOMER FEATURES

## Website-ka Macmiilka

| Feature | Sharaxaad |
|---------|-----------|
| 🏠 Home | Hero CMS, alaab featured |
| 🛋️ Products | Filter, search, modal, add cart |
| 🛒 Cart & Wishlist | Ku kaydsan browser + server |
| 💳 Checkout | District, delivery date, EVC Plus |
| 📦 Track Order | Raadi order ID + phone |
| 👤 Profile | Orders, notifications, support, settings |
| ⭐ Reviews | Kadib delivery |
| 🔐 Forgot Password | Phone → Gmail OTP → password cusub |

---

# SLIDE 10 — ADMIN DASHBOARD

## 12 Tabs — Maamul Dhammaan

| Tab | Shaqada |
|-----|---------|
| Dashboard | Revenue, stats, top products |
| Orders | Edit, assign driver, export |
| Users | Macaamiisha & staff |
| Products | CRUD + sawirro |
| Stock | Batches, FIFO, history |
| Payments | Waafi transactions |
| Delivery | Drivers live status |
| Driver Applications | Ogolaansho / diid |
| Support | Chat macaamiisha |
| Reviews | Moderate |
| CMS | About, Contact, fees |
| Settings | Theme, preferences |

**Dhammaan xogtu waxay ka timaadaa MongoDB — ma aha mock data.**

---

# SLIDE 11 — DRIVER MODULE

## Delivery Dashboard (`/delivery`)

| Feature | Sharaxaad |
|---------|-----------|
| Assignments | Pending / Active / Done |
| Accept / Reject | Driver wuu dooran karaa |
| Status update | Out for delivery → Delivered |
| Availability | Available / Busy / Offline |
| Max 3 active | Isla waqtiga 3 geeyn |
| 💰 Delivery Revenue | **Delivery fee kaliya** (tusaale $0.01) |

### Revenue kala duwan:
| Meel | Waxa lagu tiriyaa |
|------|------------------|
| Admin Dashboard | Wadarta order: alaab + delivery |
| Driver Earnings | Delivery fee kaliya |

---

# SLIDE 12 — ORDER FLOW (Socodka Dalabka)

## 13 Tallaabo — Bilow ilaa Dhammaad

```
 1. Macmiil → Products → Cart
 2. Checkout → buuxi form
 3. POST /api/orders → Order la sameeyay (Step 1)
 4. POST /api/payments/waafi → EVC PIN
 5. Paid ✅ → Notification + Email
 6. Admin → Dashboard arkaa order
 7. Admin → Preparing (Step 3)
 8. Admin → Assign driver
 9. Driver → Accept
10. Driver → Out for Delivery (Step 4)
11. Driver → Delivered (Step 5)
12. Customer → Track order updated
13. Review prompt (2 daqiiqo kadib)
```

---

# SLIDE 13 — ORDER STATUS (Tallaabooyinka)

## `currentStep` — 0 ilaa 5

| Step | Magac | Yaa beddela |
|------|-------|-------------|
| 1 | Order Placed | System (checkout) |
| 2 | Payment | Waafi / System |
| 3 | Preparing | Admin |
| 4 | Out for Delivery | Admin / Driver |
| 5 | Delivered | Driver / Admin |
| 0 | Cancelled | Customer / Admin |

### Payment (ka duwan delivery):
`Pending` → `Paid` → (`Refunded` haddii la cancel gareeyo)

**Cancel:** Macmiil wuu joojin karaa **ka hor** step 4.

---

# SLIDE 14 — LACAG BIXINTA (Payment)

## EVC Plus — Waafi API

```
Checkout phone (+25261…) 
    → Order created (Pending)
    → Waafi API charge
    → Macmiil approve PIN phone-ka
    → Success: paymentType = paid
    → Fail: Retry payment modal
```

| Qodob | Faahfaahin |
|-------|------------|
| API | `POST /api/payments/waafi` |
| Service | `backend/services/waafiService.js` |
| Security | Phone order-ka = phone EVC |
| Refund | Kadib cancel → 1 saac → auto refund |

---

# SLIDE 15 — DATABASE

## MongoDB Atlas — 18 Collections

| Koox | Models |
|------|--------|
| **Users** | User, UserActivity |
| **Products** | Product, Category |
| **Orders** | Order, OrderActivity, PaymentTransaction |
| **Shopping** | Cart, Wishlist |
| **Stock** | StockBatch, StockHistory, StockConsumption |
| **Engagement** | Notification, Review |
| **Support** | SupportTicket, SupportMessage |
| **Content** | CmsContent |

### Phone normalization:
`+252`, `061`, `61` → **isku mid** → kayd: `+25261xxxxxxx`

---

# SLIDE 16 — API SUMMARY

## 14 API Groups — `localhost:5000/api`

| Group | Tusaale |
|-------|---------|
| `/auth` | login, register, profile, forgot password |
| `/products` | CRUD alaab |
| `/orders` | place, track, cancel, assign |
| `/payments` | waafi, transactions |
| `/cart` & `/wishlist` | sync |
| `/coupons` | validate |
| `/drivers` | apply, accept, earnings |
| `/notifications` | list, read |
| `/reviews` | create, moderate |
| `/support` | chat |
| `/cms` | content |
| `/categories` | CRUD |
| `/admin` | dashboard stats |

**Wadarta endpoints:** 50+ API endpoint

---

# SLIDE 17 — AMNIGA (Security)

| Layer | Habka |
|-------|-------|
| **Authentication** | JWT token (30 maalmood) |
| **Password** | bcrypt hash — plain text ma jiro |
| **Authorization** | Role middleware: admin, user, delivery |
| **Frontend guard** | ProtectedRoute + StaffRouteGuard |
| **Rate limiting** | Login & OTP spam ka hortag |
| **HTTP** | Helmet + CORS |
| **Payment** | Phone validation |
| **Staff block** | Admin/Driver ma iibsan karaan |

---

# SLIDE 18 — NOTIFICATIONS

## Logic-ka Ogeysiisyada

| Dhacdo | Notification | Helaha |
|--------|--------------|--------|
| Order cusub | `new_order` | Admin |
| Order placed | `order_placed` | Customer |
| Paid | `payment_success` | Customer |
| Driver assigned | `delivery_assigned` | Driver |
| Delivered | `order_delivered` | Customer |
| Support message | `support_message` | Admin/Customer |

- Kayd: **MongoDB** (`Notification` model)
- Frontend: **poll 30s** → bell icon update
- Toast: fariin degdeg ah

---

# SLIDE 19 — TIRAKOOBAHA MASHRUUCA

| Qodob | Tirada |
|-------|--------|
| Frontend files | ~83 |
| Backend files | ~85 |
| Database models | 18 |
| API route groups | 14 |
| Admin tabs | 12 |
| User roles | 3 |
| Order steps | 6 (0–5) |
| Notification types | 15+ |

### Folder structure:
```
src/          → React frontend
backend/      → Node API
docs/         → Documentation
```

---

# SLIDE 20 — DEMO (Toos ah)

## 15 Daqiiqo — Script

### A. Macmiil (5 min)
1. `/products` → filter → cart
2. Login customer → checkout → EVC
3. `/track-order` → profile orders

### B. Admin (5 min)
1. Login admin → dashboard stats
2. Orders → assign driver → CMS edit
3. Notifications bell

### C. Driver (3 min)
1. Login driver → accept → delivered
2. Delivery revenue card

### D. Architecture (2 min)
React → API → MongoDB diagram

### Test accounts:
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@gmail.com | admin123 |
| Customer | abdifatah@gmail.com | customer123 |
| Driver | driver@gmail.com | driver123 |

---

# SLIDE 21 — MUSTAQBALKA (Future Work)

## Berrito — PWA & Internet

| Qorshe | Sharaxaad |
|--------|-----------|
| 🌐 **Deploy** | Frontend (Vercel) + Backend (Railway/VPS) |
| 🔒 **HTTPS** | SSL certificate |
| 📱 **PWA** | Install on phone — app kale oo kale |
| 🌍 **Domain** | www.mmfurniture.com |
| 📧 **SMS OTP** | Twilio integration |
| ⏱️ **Production timing** | Refund 24h, review 24h |

**Hadda:** localhost development ✅  
**Berrito:** internet + PWA inshaallah

---

# SLIDE 22 — GABAGABO (Conclusion)

## Waxa aan gaarnay:

✅ Nidaam e-commerce **dhammaystiran** oo furniture ah  
✅ **3 roles** — customer, admin, driver  
✅ **Lacag online** — EVC Plus (Waafi)  
✅ **Real-time** notifications & order tracking  
✅ **Stock management** — FIFO batches  
✅ **Cloud database** — MongoDB Atlas  
✅ **Secure** — JWT, bcrypt, role-based access  

### Hal jumlad:
> "Waxaan dhisay platform online ah oo macmiilka u oggolaanaysa inuu iibsado, admin uu maamulo, driver uu geeyo — dhammaan hal nidaam, hal database."

---

# SLIDE 23 — MAHADSANIDIN
## Questions & Answers

**Waad ku mahadsan tihiin dhageysiga!**

### Su'aalaha la filayo:

| Su'aal | Jawaab kooban |
|--------|---------------|
| Database-ka waa maxay? | MongoDB Atlas (cloud NoSQL) |
| Lacag sidee baa loo bixiyaa? | Waafi API → EVC Plus → PIN phone |
| Amni sidee? | JWT + bcrypt + role middleware |
| Admin iyo customer isku account? | Maya — roles kala duwan |
| Driver revenue? | Delivery fee kaliya, delivered + paid |
| Mock data? | Maya — MongoDB real data |
| Immisa API? | 50+ endpoints, 14 groups |

---

# 📌 NOTES FOR PRESENTER (Akhriska hoose)

### Ka hor defense:
- [ ] MongoDB Atlas IP whitelist
- [ ] `npm run dev` — labada server shaqaynayaan
- [ ] Test EVC hal mar
- [ ] Admin hore u assign driver demo order

### Haddii wax jabo:
| Dhibaato | Xal |
|----------|-----|
| Backend ma bilaabmo | MongoDB IP + `.env` |
| Orders madhan | Phone format +252 |
| Driver ma arko order | Admin assign first |
| Waafi fail | Sharax integration-ka — demo order hore u paid |

### Waqti:
- Slides 1–19: ~10 min hadal
- Slide 20 demo: ~5 min
- Slides 21–23: ~3 min
- Q&A: ~5 min

---

*U beddel slides PowerPoint: Slide kasta → Copy title + bullets → Design: deep green (#073D35) + gold (#D8A128)*
