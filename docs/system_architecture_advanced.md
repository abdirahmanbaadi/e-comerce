# Advanced System Architecture Diagram

Halkan waxaa ku qoran jaantus ka sii casrisan oo aad u faahfaahsan (Advanced System Architecture Diagram) kaas oo si buuxda u muujinaya lakabyada amniga (Security), habaynta koodhka (React State & Routing), maamulka controllers-ka backend-ka, iyo isku-xirka database-ka iyo adeegyada dibadda. 

---

## Jaantuska Dhismaha Nidaamka ee Casriga ah (Advanced ERD/Flow)

Koodhkan hoose waa kan aad koobiyeysan karto si aad sawir ahaan ugu badasho (fiiri tilmaamaha hoose):

```mermaid
flowchart TB
    %% Actors
    subgraph Actors ["Actors (Isticmaalayaasha)"]
        direction LR
        Customer["👤 Macmiilka (Customer)"]
        Admin["👑 Maamulaha (Admin)"]
        Driver["🚗 Darawalka (Delivery Driver)"]
    end

    %% Frontend Layer
    subgraph Frontend ["1. Frontend Layer (React.js & Tailwind CSS)"]
        direction TB
        UI["React SPA Components (UI Pages)"]
        State["State Management (React Context API)"]
        Routing["Client-Side Routing (React Router DOM)"]
        Style["Styling Engine (Tailwind CSS)"]
        
        UI --> State
        State --> Routing
        Routing --> Style
    end

    %% API Gateway / Security
    subgraph Gateway ["2. API Gateway & Security Middleware"]
        direction TB
        Cors["CORS & Body Parser"]
        JWT["JWT Authentication Middleware"]
        Validator["Request Validation (Express Validator)"]
        
        Cors --> JWT
        JWT --> Validator
    end

    %% Backend Controllers (Business Logic)
    subgraph Backend ["3. Application Logic Layer (Node.js & Express.js)"]
        direction TB
        AuthCtrl["Auth Controller (User Register/Login)"]
        CatalogCtrl["Catalog & Product Search Service"]
        OrderCtrl["Order & Checkout Manager"]
        PaymentCtrl["Mobile Money Payment Service"]
        DeliveryCtrl["Driver Dispatcher Service"]
        SupportCtrl["Support Ticket Manager"]
    end

    %% Database Storage
    subgraph Storage ["4. Database Layer (MongoDB & Mongoose)"]
        direction LR
        Mongoose["Mongoose ODM (Data Validation)"]
        MongoDB[("MongoDB Database (NoSQL BSON)")]
        
        Mongoose <--> MongoDB
    end

    %% External Services
    subgraph External ["5. External Services & APIs"]
        direction TB
        PaymentAPI["Mobile Money Payment Gateway (EVC Plus / Zaad API)"]
        SmsAPI["Dashboard Notification Engine"]
    end

    %% Connections between Layers
    Actors <-->|Web Interface / HTTPS| UI
    Routing <-->|HTTP REST APIs / JSON| Cors
    
    Validator --> AuthCtrl
    Validator --> CatalogCtrl
    Validator --> OrderCtrl
    Validator --> PaymentCtrl
    Validator --> DeliveryCtrl
    Validator --> SupportCtrl

    AuthCtrl <--> Mongoose
    CatalogCtrl <--> Mongoose
    OrderCtrl <--> Mongoose
    PaymentCtrl <--> Mongoose
    DeliveryCtrl <--> Mongoose
    SupportCtrl <--> Mongoose

    PaymentCtrl <-->|Secure API Integrations| PaymentAPI
    OrderCtrl --> SmsAPI

    %% Styling
    style Actors fill:#f5eef8,stroke:#8e44ad,stroke-width:2px
    style Frontend fill:#ebf5fb,stroke:#2980b9,stroke-width:2px
    style Gateway fill:#fef9e7,stroke:#d4ac0d,stroke-width:2px
    style Backend fill:#eaf2f8,stroke:#2471a3,stroke-width:2px
    style Storage fill:#e8f8f5,stroke:#117864,stroke-width:2px
    style External fill:#fdf2e9,stroke:#e67e22,stroke-width:2px

    style Customer fill:#fff,stroke:#333
    style Admin fill:#fff,stroke:#333
    style Driver fill:#fff,stroke:#333
```

---

## Sidee Guddiga loogu sharxaa (How to explain to the Panel)?

Jaantuskan wuxuu u qaybsan yahay **5 Lakab (Layers)** oo mid kasta uu leeyahay hawl gaar ah:

1. **Actors (Isticmaalayaasha):** Nidaamka waxaa isticmaala 3 qof oo kala ah: Macmiilka (adeeganaya), Maamulaha (maamulaya alaabta iyo dalabaadka), iyo Darawalka (geynaya alaabta).
2. **Frontend Layer (React & Tailwind):** Waa qaybta uu user-ku arko. React wuxuu maamulaa state-ka iyo isu-gudubka bogagga (Routing), halka Tailwind CSS uu maamulo bilicda.
3. **API Gateway & Security:** Kahor inta aan la gaarin backend-ka, koodhku wuxuu maraa amniga:
   * **CORS:** Si loo hubiyo amniga domains-ka soo xiriiraya.
   * **JWT Authentication:** Si loo hubiyo in qofka soo galaya uu yahay qof sax ah oo nidaamka ka diiwaangashan.
   * **Request Validation:** Si loo xaqiijiyo in xogta la soo diray ay sax tahay (Codsiyada khaldan halkaas ayaa lagu reebaa).
4. **Application Logic Layer (Node/Express):** Waa maskaxda nidaamka (Controllers) oo maamusha isdiiwaangalinta, raadinta alaabta, dalabaadka, lacag-bixinta, darawal-u-xilsaarista, iyo tigidada caawinta.
5. **Database Layer (MongoDB/Mongoose):** Waa halka ay xogtu ku kaydsan tahay qaab NoSQL ah.
6. **External Services (Payment & SMS):** Isku-xirka APIs-ka shirkadaha isgaarsiinta ee lacagaha (sida EVC Plus) iyo dirista ogeysiisyada dashboard-ka.

---

## Sida loo soo dejisto Sawirka Jaantuska

Si aad ugu darto buuggaaga (Word/PDF):
1. Nuqul ka qaad (Copy) koodka sare ee ku dhex jira sanduuqa **`mermaid`**.
2. Tag mareegta: **[mermaid.live](https://mermaid.live)**.
3. Dhinaca bidix ku dheji (Paste) koodhka aad koobiyaysay.
4. Jaantuska wuxuu si toos ah sawir ahaan ugu soo baxayaa dhinaca midig.
5. Guji badhanka **"Actions"** ee hoose, dabadeed dooro **"Download PNG"** si aad u soo dejisato.
6. Sawirkaas ku dhex dheji **Chapter 3**-kaaga.
