# Orders & Settlements Management Platform

A production-ready, full-stack Orders & Settlements web application built with **Node.js, Express, TypeScript, Sequelize ORM (Neon PostgreSQL & SQLite)**, and **React 18 (Vite)** with Vanilla CSS aesthetics.

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher

### 1. Clone & Install Dependencies

```bash
# Clone the repository
git clone ankitsharma495/assessment.git
cd assessment

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

## 🏃 Running Locally

Run both backend and frontend development servers:

**Terminal 1 — Backend Server:**
```bash
cd backend
npm run dev

```

**Terminal 2 — Frontend App:**
```bash
cd frontend
npm run dev

```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 🧪 Automated Testing & Verification

Run the Jest test suite to execute the assignment verification scenario:

```bash
cd backend
npm test
```

---

## ⚡ Core Business Rules & Edge Cases Addressed

### 1. Dynamic Order Status Derivation
Order statuses are computed in real-time based on payments, credit notes, and the current date:
- **`pending`**: Zero payments recorded ($0.00$) and current date $\le$ due date.
- **`partially_paid`**: Payments recorded ($0 < \text{Total Paid} < \text{Total Amount}$) and current date $\le$ due date.
- **`paid`**: Payments + Credit Notes $\ge$ Total Amount.
- **`overdue`**: Current date $>$ due date and total settled amount $<$ Total Amount.
  - *Edge Case*: If an `overdue` order receives a payment settling the balance in full, status transitions automatically to `paid`.

### 2. Strict Over-Payment Prevention
- Server-side validation guarantees: $\text{Payment Amount} \le \text{Remaining Balance Due}$.
- Prevents over-payments under race conditions using transaction locks.
- Returns clear HTTP 400 error detailing the maximum permitted payment.

### 3. Payment Deletion & Recalculation
- Deleting a payment automatically adjusts the order's `totalPaid`, `balanceDue`, updates the status (`paid` $\rightarrow$ `partially_paid` or `pending`), and logs an audit log entry.

### 4. Credit Notes (Refunds / Discounts)
- Issuing a Credit Note reduces `balanceDue`.
- If Credit Note amount equals `balanceDue`, the order transitions to `paid`.

### 5. Role-Based Access & Data Isolation
- **User Role**: Access restricted strictly to own merchant orders.
- **Admin Role**: Cross-merchant visibility and management.

### 6. Serverless Vercel Compatibility
- Explicit `dialectModule: pg` configuration prevents bundler exclusion on serverless platforms.
- Automatically selects write-safe storage (`/tmp/database.sqlite`) when deployed in serverless mode without Postgres connection strings.

---

## 📡 REST API Reference

All requests requiring authentication must include the HTTP header:  
`Authorization: Bearer <JWT_TOKEN>`

### Authentication Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register user (`name`, `email`, `password`, `role`) | No |
| `POST` | `/api/auth/login` | Login user (`email`, `password`) | No |
| `GET` | `/api/auth/me` | Get current authenticated user profile | Yes |

### Orders Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/orders` | Create order with line items & additional charges | Yes |
| `GET` | `/api/orders` | List orders (filters: `?status=pending`, `?search=Acme`) | Yes |
| `GET` | `/api/orders/:id` | Get single order with items, payments & audit logs | Yes |
| `PUT` | `/api/orders/:id` | Update order details (if unpaid) | Yes |
| `DELETE` | `/api/orders/:id` | Delete an order | Yes |
| `POST` | `/api/orders/bulk-delete` | Delete multiple orders by IDs (`{ orderIds: [] }`) | Yes |

### Payments & Credit Notes Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/orders/:orderId/payments` | Record payment against order (validates over-payment) | Yes |
| `GET` | `/api/orders/:orderId/payments` | Fetch all payments recorded for an order | Yes |
| `DELETE` | `/api/orders/:orderId/payments/:paymentId` | Delete payment & recalculate order status | Yes |
| `POST` | `/api/orders/:orderId/credit-notes` | Issue credit note against order | Yes |
| `GET` | `/api/orders/:orderId/credit-notes` | Fetch credit notes issued for an order | Yes |

---

## 📦 Tech Stack Summary

- **Backend**: Node.js, Express, TypeScript, Sequelize ORM, PostgreSQL (`pg`), SQLite (`sqlite3`), Jest, Supertest.
- **Frontend**: React 18, Vite, TypeScript, Lucide React, Custom CSS.
- **Deployment**: Vercel Serverless Function (`@vercel/node`), Neon Postgres Pooler.
