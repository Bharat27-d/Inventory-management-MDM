# Aim 6 — Inventory / Product Management System (MDM)

A full-stack, enterprise-grade **Inventory and Product Master Data Management (MDM) System** built with **Next.js (React 19 & TypeScript)** featuring a minimalist **shadcn/ui black & white aesthetic**, powered by a high-performance **Python Flask REST API** and an **SQLite** database.

---

## 🎯 Aim & Objectives

### Aim
To design and develop an Inventory Management System web application that enables users to add, search, update stock, and delete product records, using Next.js (with Node.js frontend tooling), Python Flask as the backend server, and SQLite as the database — demonstrating full-stack CRUD operations relevant to inventory tracking.

### Objectives
1. **Frontend Interface**: Design a responsive interface using Next.js and shadcn/ui for entering, searching, and viewing product details (`Product ID`, `Name`, `Category`, `Quantity`, `Price`, `Threshold`).
2. **Flask REST API**: Develop robust endpoints for adding products, listing with filters, searching across fields, updating details/stock, and deleting records.
3. **SQLite Database Schema**: Design schemas for product inventory and audit logs with check constraints.
4. **Data Exchange**: Connect frontend and backend via JSON HTTP requests (Fetch API) with zero page reloads.
5. **Validation Guards**: Validate non-negative quantities (`quantity >= 0`) and prices (`price >= 0`), unique Product IDs, and required fields.
6. **Dynamic Low-Stock Alerts**: Dynamically calculate and display low-stock warnings and out-of-stock badges.
7. **Edge-Case Resilience**: Test and guard against reducing stock below zero, searching non-existent items, and duplicate SKU entries.

---

## 🎨 Design System: shadcn/ui Monochrome Aesthetic

Following the strict requirement for a **black and white foundation with selective accent colors only where strictly needed**:

- **Foundation (Black & White)**:
  - Surface Background: Pure White (`#ffffff`) and Off-White Canvas (`#fafafa`)
  - Typography & Primary Accents: Deep Pitch Black (`#09090b` / `#000000`)
  - Subdued Borders & Dividers: Clean Zinc (`border-zinc-200`)
  - Secondary Elements & Badges: Light Zinc Neutral (`bg-zinc-100 text-zinc-900`)
- **Selective Colors (Only Where Needed)**:
  - 🟢 **In Stock**: Soft Emerald badge (`bg-emerald-50 text-emerald-800 border-emerald-200`)
  - 🟡 **Low Stock Alert**: Warning Amber badge with pulse indicator (`bg-amber-50 text-amber-900 border-amber-300`)
  - 🔴 **Out of Stock**: Rose / Crimson badge (`bg-rose-50 text-rose-700 border-rose-200`)
  - 🔴 **Destructive Delete Action**: Crimson confirmation button (`bg-rose-600 hover:bg-rose-700 text-white`)
  - 🟢 **Live Backend Health**: Green glowing pulse indicator when Flask API is connected.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client["Next.js Frontend (React 19 / TypeScript / Tailwind CSS / shadcn)"]
    Proxy["Next.js API Rewrites (/api/* -> http://127.0.0.1:5000)"]
    Flask["Python Flask Backend Server (app.py)"]
    CORS["Flask-CORS Middleware"]
    DB[("SQLite Database (inventory.db)")]

    Client -->|Fetch JSON| Proxy
    Proxy -->|Forward HTTP Request| Flask
    Flask -->|Enforce Business Rules & Constraints| DB
    DB -->|Rows & Result Sets| Flask
    Flask -->|JSON Response (200 / 201 / 400 / 404 / 409)| Client
```

---

## 🗄️ SQLite Database Schema

The database resides in `inventory.db` with two key tables:

### 1. `products` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | `PRIMARY KEY AUTOINCREMENT` | Internal database surrogate key |
| `product_id` | `TEXT` | `UNIQUE NOT NULL` | Business SKU / Product code (e.g., `PRD-1001`) |
| `name` | `TEXT` | `NOT NULL` | Product name / title |
| `category` | `TEXT` | `NOT NULL` | Product category |
| `quantity` | `INTEGER` | `NOT NULL CHECK (quantity >= 0)` | Stock on hand (non-negative constraint) |
| `price` | `REAL` | `NOT NULL CHECK (price >= 0)` | Unit price in USD (non-negative constraint) |
| `low_stock_threshold`| `INTEGER` | `NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0)` | Custom threshold for low-stock warnings |
| `description` | `TEXT` | `DEFAULT ''` | Optional specifications or notes |
| `created_at` | `TEXT` | `NOT NULL` | ISO / UTC creation timestamp |
| `updated_at` | `TEXT` | `NOT NULL` | Timestamp of last modification |

### 2. `activity_logs` Table
Maintains a full audit trail of stock adjustments, creations, updates, and deletions.

---

## 🚀 REST API Endpoints

All endpoints exchange JSON data:

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/api/health` | Backend health check | `200 OK` |
| `GET` | `/api/stats` | Summary metrics (total SKUs, units, valuation, low stock count) | `200 OK` |
| `GET` | `/api/products` | List & filter products (`?q=`, `?category=`, `?status=`, `?sort_by=`, `?order=`) | `200 OK` |
| `GET` | `/api/products/<pid>` | Retrieve single product by SKU | `200 OK`, `404 Not Found` |
| `POST` | `/api/products` | Register a new product record | `201 Created`, `400 Bad Request`, `409 Conflict` |
| `PUT` | `/api/products/<pid>` | Update product details (name, category, price, quantity) | `200 OK`, `400 Bad Request`, `404 Not Found` |
| `PATCH`| `/api/products/<pid>/stock`| Quick stock adjust (`{"change": delta}` or `{"quantity": num}`) | `200 OK`, `400 Bad Request` (zero floor guard) |
| `DELETE`| `/api/products/<pid>`| Remove product record | `200 OK`, `404 Not Found` |
| `GET` | `/api/products/low-stock` | Retrieve all items at or below low-stock threshold | `200 OK` |
| `GET` | `/api/categories` | Distinct product categories list | `200 OK` |
| `GET` | `/api/logs` | Fetch audit logs | `200 OK` |
| `POST` | `/api/seed` | Reset and re-seed database with clean sample inventory | `200 OK` |

---

## 🛡️ Edge Case Handling

1. **Negative Stock Guard**:
   - Both the frontend UI and backend Flask REST API validate that stock cannot drop below `0`.
   - Attempting to deduct more stock than available triggers a `400 Bad Request` with an exact explanation (e.g. `Stock cannot be reduced below zero. Current stock is 0, attempted change was -1`).
2. **Duplicate SKU / Product ID**:
   - Unique constraint check in SQLite and Flask API returns `409 Conflict` with a helpful user message.
3. **Negative Price & Quantity**:
   - Form inputs enforce `min="0"` with validation before submission and server-side validation.
4. **Search Resilience**:
   - Searching for non-existent items produces a friendly empty state with quick buttons to clear filters.

---

## 💻 How to Run the Application

### 1. Start the Flask Backend Server
In the project root directory:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the Flask backend
python app.py
```
Backend will start on: **`http://127.0.0.1:5000`**

### 2. Start the Next.js Frontend
In a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already installed)
npm install

# Start Next.js development server
npm run dev
```
Frontend will start on: **`http://localhost:3000`**

---

## 🧪 Quick Evaluation & Lab Demo

Open **`http://localhost:3000`** in your browser. You can use the built-in **"Lab Evaluation: Edge Case & Validation Tester"** toolbar to test:
- **Test 1**: Negative stock guard (reducing 0 stock item)
- **Test 2**: Searching non-existent product
- **Test 3**: Rejection of duplicate Product ID
- **Test 4**: Rejection of negative price or quantity
- **Quick Stepper**: Click `+` or `-` on any product row for immediate stock updates
- **Activity Log**: Click "Activity Log" in the header to view the live SQLite audit trail!
