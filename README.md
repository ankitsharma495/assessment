# CrossVal — Orders & Settlements Management Platform

A high-performance, full-stack Orders & Settlements web application built with **Node.js, Express, TypeScript, Sequelize ORM, Neon PostgreSQL / SQLite**, and **React 18 (Vite)** featuring minimalist Dribbble-inspired UI aesthetics.

---

## 📋 PDF Requirements Checklist & Compliance Audit

| Requirement Category | Description / Criteria | Status | Implementation Details |
| :--- | :--- | :---: | :--- |
| **1. Authentication** | Sign up & Log in (email + password) | **COMPLETED** | JWT-based auth (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`). |
| **Data Isolation & RBAC** | User-level data isolation + Admin role | **COMPLETED** | Regular users view own orders; Platform Admins access all merchant orders across system. |
| **2. Orders Creation** | Customer Name, Due Date, Line Items ($\text{Qty} \ge 1, \text{Price} \ge 0$) | **COMPLETED** | Form with dynamic items & auto-computed subtotal/order total (`POST /api/orders`). |
| **3. Order Status** | Derived status: `pending`, `partially_paid`, `paid`, `overdue` | **COMPLETED** | Auto-computed based on effective payments & due date comparisons. |
| **4. Payments Validation** | Over-payment prevention & multiple payments | **COMPLETED** | Server-side validation rejects payments exceeding $\text{Remaining Balance Due}$ with actionable error message. |
| **5. Dashboard** | Orders list, status filters, search, detail view | **COMPLETED** | Integrated dashboard with KPI metrics, status filters (`All`, `Pending`, `Partially Paid`, `Paid`, `Overdue`), pagination, & modal views. |
| **6. Analytics & Graphs** | Real order data visualization | **COMPLETED** | Dedicated Analytics Dashboard (`DashboardView.tsx`) with real dual-bar SVG chart and Donut status chart. |
| **7. Stretch Goal: Refunds** | Credit Notes / Refunds | **COMPLETED** | Issued credit notes adjust balance due (`POST /api/orders/:id/credit-notes`). |
| **8. Stretch Goal: Audit Log** | Status changes tracked with timestamps | **COMPLETED** | Automated `OrderAuditLog` model & vertical timeline tab in Order Detail Modal. |
| **9. Stretch Goal: Export** | CSV Export downloader | **COMPLETED** | Single-click CSV downloader for order financial data. |
| **10. Testing & DDL Sync** | Automated API tests & DB schema migration | **COMPLETED** | Full Jest + Supertest test suite in `backend/src/__tests__/order.test.ts`. Auto-migration in `database.ts`. |

---

## 💡 Key Features & Business Rules

### 1. Automated Status Derivation Logic
Order status is recalculated dynamically whenever an order, payment, or credit note is accessed or updated:
- **`pending`**: Total paid is `$0.00` and due date has not passed.
- **`partially_paid`**: Some payment recorded ($0 < \text{Total Paid} < \text{Total Amount}$) and due date not passed.
- **`paid`**: Total payments equal or exceed total order amount ($\text{Total Paid} \ge \text{Total Amount}$).
- **`overdue`**: Payment due date has passed ($\text{Today} > \text{Due Date}$) and total paid is less than order total ($\text{Total Paid} < \text{Total Amount}$).
  > *Edge Case Decision*: If an order was `overdue` and later receives a payment that settles the balance in full, its status automatically transitions to `paid`.

### 2. Over-Payment Rejection Logic
- Server enforces: $\text{Payment Amount} \le \text{Remaining Balance Due}$.
- Attempting to pay more than the balance due returns HTTP 400 with a detailed error:
  `"Payment amount of $1.00 exceeds the remaining balance due of $0.00. Maximum allowed payment is $0.00."`

### 3. Payment Deletion & Recalculation
- Deleting a recorded payment automatically recalculates order totals, updates balance due, logs an audit record, and reverts order status accordingly.

---

## 🧪 Sample Verification Scenario (From Assignment Spec)

You can run the automated test suite or verify manually via the UI/API:

1. **Create Order**: 2 items $\times$ $500 = **$1,000 Total**, due in 7 days.
   - *Result*: Status is `pending`, Balance Due = `$1,000.00`.
2. **Record $400 Payment**:
   - *Result*: Status transitions to `partially_paid`, Total Paid = `$400.00`, Balance Due = `$600.00`.
3. **Record $600 Payment**:
   - *Result*: Status transitions to `paid`, Total Paid = `$1,000.00`, Balance Due = `$0.00`.
4. **Attempt $1 Payment**:
   - *Result*: Request rejected with HTTP 400: `"Payment amount of $1.00 exceeds the remaining balance due of $0.00."`

---

## 🛠️ Tech Stack & Architecture

- **Backend Framework**: Node.js, Express, TypeScript, Sequelize ORM.
- **Database**: Neon PostgreSQL (Production Pooler) with local SQLite fallback.
- **Frontend Framework**: React 18, Vite, TypeScript, Lucide React Icons, Vanilla CSS Design System.
- **Testing**: Jest, Supertest, ts-jest.

---

## ⚡ Prerequisites & Step-by-Step Setup

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Step 1: Clone & Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5001
JWT_SECRET=crossval-secret-key-2026
NODE_ENV=development
NEON_DATABASE_URL=postgresql://neondb_owner:npg_15aqeJgRGzPL@ep-purple-hall-ayta5ves-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### Step 3: Run Automated Test Suite

```bash
cd backend
npm test
```

### Step 4: Run Application Locally

In terminal 1 (Backend API Server):
```bash
cd backend
npm run dev
# Starts backend server on http://127.0.0.1:5001
```

In terminal 2 (Frontend Vite Server):
```bash
cd frontend
npm run dev
# Starts frontend web app on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📡 REST API Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register user (`name`, `email`, `password`, `role`) | No |
| `POST` | `/api/auth/login` | Login user (`email`, `password`) | No |
| `GET` | `/api/auth/me` | Fetch active user profile | Yes |
| `POST` | `/api/orders` | Create new order with line items | Yes |
| `GET` | `/api/orders` | List orders (filters: `?status=pending`, `?search=Acme`, `?page=1`) | Yes |
| `GET` | `/api/orders/:id` | Fetch single order details + line items + payments + audit logs | Yes |
| `POST` | `/api/orders/:id/payments` | Record payment against order (with server-side validation) | Yes |
| `DELETE` | `/api/orders/:id/payments/:paymentId` | Delete payment & recalculate status | Yes |
| `POST` | `/api/orders/:id/credit-notes` | Issue credit note against order | Yes |

---

## 🔒 Concurrency & Production Considerations

1. **Payment Concurrency**: Payment submission evaluates balance due within a database transaction to prevent double-spending or race conditions.
2. **Order Immutability**: Orders with recorded payments lock line item modification to preserve audit compliance.
