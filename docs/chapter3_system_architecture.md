# Chapter 3: Updated Section 3.4 (System Architecture)

Halkan waxaa ku qoran qoraalka saxda ah oo loo cusboonaysiiyay (updated) tiknoolajiyada rasmiga ah ee nidaamkaaga (**React**, **Tailwind CSS**, iyo **MongoDB**). Qoraalkani wuxuu ku qoran yahay luuqadda Ingiriisiga oo ah qaabkii rasmiga ahaa ee buuggaaga (Thesis-ka):

---

## 3.4 System Architecture

The system architecture describes the overall structure of the proposed furniture e-commerce platform and explains how different system components interact with each other. It provides a blueprint of the system by showing how data flows between users, the frontend, the backend, the database, and payment integration services. The architecture is important because it helps readers understand how the proposed system operates as a complete web-based application.

The proposed system follows a client-server architecture model. In this architecture, customers and administrators interact with the system through the web-based frontend interface developed using **React.js** (a modern JavaScript library for building user interfaces) and styled with **Tailwind CSS** alongside HTML5 and CSS3. The frontend allows users to browse furniture products, manage shopping carts, place orders, track deliveries, and perform payment transactions through web browsers with a highly responsive design.

The backend of the system is developed using **Node.js** and **Express.js**. The backend handles request processing, business logic, order management, payment integration, and communication between the frontend and the database. The backend also manages user authentication, transaction processing, and delivery coordination functionalities (such as driver assignment) within the platform.

The proposed platform uses **MongoDB** as a NoSQL document-based database management system (with **Mongoose** as the Object Data Modeling library) for storing customer profiles, product catalogs, categories, order logs, payment transactions, and support ticket messages. MongoDB stores data in flexible, JSON-like documents, which supports rapid schema adaptation, efficient query performance, and seamless data exchange between the Node.js backend and the database.

The architecture also integrates mobile money payment APIs to support secure online payment processing within the platform. Customers can complete financial transactions electronically through mobile payment services connected to the backend system. The interaction between the frontend, backend, database, and payment integration services enables smooth operation of the furniture e-commerce platform.
