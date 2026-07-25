# Figure 3.1: System Architecture Diagram

Halkan waxaa ku qoran koodhka jaantuska dhismaha nidaamkaaga (**System Architecture Diagram**) oo si sax ah u qeexaya 4-ta lakab (layers) ee uu nidaamkaagu ka kooban yahay:

---

## Jaantuska Dhismaha Nidaamka (System Architecture Diagram)

Koodhkan hoose waa kan aad koobiyeysan karto si aad sawir ahaan ugu badasho (fiiri tilmaamaha hoose):

```mermaid
flowchart TB
    subgraph ClientLayer ["1. Presentation Layer (Frontend)"]
        direction LR
        Customer["Customer (Web Browser)"]
        Admin["Admin (Dashboard Browser)"]
        ReactApp["React.js SPA & Tailwind CSS"]
        
        Customer --> ReactApp
        Admin --> ReactApp
    end

    subgraph ServerLayer ["2. Application Layer (Backend)"]
        direction TB
        ExpressServer["Node.js & Express.js API"]
        AuthService["Auth Service (JWT)"]
        OrderController["Order Management"]
        ProductController["Catalog Management"]
        DeliveryController["Driver Assignment"]
        
        ExpressServer --> AuthService
        ExpressServer --> OrderController
        ExpressServer --> ProductController
        ExpressServer --> DeliveryController
    end

    subgraph ExternalLayer ["3. Integration Layer"]
        PaymentAPI["Mobile Money Payment APIs (EVC Plus / Zaad / Premier Wallet)"]
    end

    subgraph DatabaseLayer ["4. Database Layer (Storage)"]
        MongoDB[("MongoDB Database (NoSQL)")]
        MongooseODM["Mongoose (ODM)"]
        
        MongooseODM --> MongoDB
    end

    %% Flow connections
    ReactApp <-->|HTTP Requests / JSON API| ExpressServer
    ExpressServer <-->|ODM Queries| MongooseODM
    ExpressServer <-->|API Calls| PaymentAPI
    
    %% Styling
    style ClientLayer fill:#f9f9fb,stroke:#333,stroke-width:2px
    style ServerLayer fill:#f4f6f9,stroke:#333,stroke-width:2px
    style DatabaseLayer fill:#ebf5fb,stroke:#333,stroke-width:2px
    style ExternalLayer fill:#fef9e7,stroke:#333,stroke-width:2px
    
    style ReactApp fill:#5dade2,stroke:#2e4053,stroke-width:1px,color:#fff
    style ExpressServer fill:#58d68d,stroke:#1d8348,stroke-width:1px,color:#fff
    style MongoDB fill:#f5b041,stroke:#ba4a00,stroke-width:1px,color:#fff
    style PaymentAPI fill:#ec7063,stroke:#7b241c,stroke-width:1px,color:#fff
```

---

## Sharaxaadda 4-ta Lakab (Explaining the Layers to the Panel)

Marka aad sharaxayso jaantuskan, waxaad u dhigi kartaa sidan:

1. **Presentation Layer (Lakabka Bandhiga):** Waa qaybta hore (Frontend) ee uu macmiilku ama maamuluhu (Admin) ku arko shabakada. Waxaa lagu dhisay **React.js** iyo **Tailwind CSS**.
2. **Application Layer (Lakabka Adeegga):** Waa Server-ka dhexe oo ku dhisan **Node.js** iyo **Express.js**. Wuxuu maamulaa xaqiijinta dadka soo gelaya (Auth), dalabaadka (Orders), alaabta (Catalog), iyo darawallada dalabka qaadaya (Delivery).
3. **Database Layer (Lakabka Kaydka):** Waa database-ka **MongoDB** (NoSQL) oo xogta oo dhan kaydiya, waxaana la adeegsadaa **Mongoose** si koodhka backend-ka loogu xiro database-ka.
4. **Integration Layer (Lakabka Isku-xirka):** Waa qaybta lagu xiro adeegyada dibadda sida shirkadaha lacagta (Mobile Money APIs) si macaamiishu si toos ah lacagta ugu bixiyaan taleefankooda (sida EVC Plus).

---

## Sida loo soo dejisto Sawirka Jaantuska (How to Export as PNG/SVG)

Si aad ugu darto buuggaaga (Word/PDF):
1. Nuqul ka qaad (Copy) koodka sare ee ku dhex jira sanduuqa **`mermaid`**.
2. Tag mareegta: **[mermaid.live](https://mermaid.live)**.
3. Dhinaca bidix ku dheji (Paste) koodhka aad koobiyaysay.
4. Jaantuska wuxuu si toos ah sawir ahaan ugu soo baxayaa dhinaca midig.
5. Guji badhanka **"Actions"** ee hoose ee bidixda, dabadeed dooro **"Download PNG"** si aad u soo dejisato.
6. Sawirkaas ku dhex dheji **Chapter 3**-kaaga hoostiisa **Figure 3.1: System Architecture Diagram**.
