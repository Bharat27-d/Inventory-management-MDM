# Inventory Management System (StockHub)

A full-stack Inventory & Product Management System web application demonstrating complete CRUD (Create, Read, Update, Delete) operations, dynamic search, input validation, and real-time low-stock tracking.

Built using **HTML5, CSS3, and JavaScript** (with Node.js tooling) for the frontend, **Python Flask** as the backend REST API server, and **SQLite** as the database.

---

## 📋 Features

- **Dashboard Overview**: Real-time KPI summary cards displaying Total Products, Unique Categories, Total Stock Units, and Low-Stock Alert counts.
- **Add Product**: Form interface to record new products with fields for Product ID, Name, Category, Quantity, and Price.
- **Full Inventory Table**: Tabular view of all stock items with color-coded category chips, visual stock health progress bars, and status badges.
- **Dynamic Search**: Instant search by Product ID, Name, or Category using the Fetch API without full page reloads.
- **Stock & Price Update**: Modal interface allowing users to adjust stock quantities and prices with input validation.
- **Delete Record**: Safe deletion with a confirmation prompt modal.
- **Low-Stock Alerts**: Automatic detection and display of products with stock $\le 10$ units, with a direct **Restock** action button.
- **Input Validation**: Client-side and server-side validation preventing negative quantities, negative prices, and empty submissions.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+, Fetch API), Font Awesome 6
- **Frontend Tooling**: Node.js & npm (`package.json` scripts)
- **Backend**: Python 3, Flask REST API
- **Database**: SQLite3 (`inventory.db`)

---

## 🚀 How to Run the Project

### Prerequisites
Make sure you have installed:
1. **Python 3.8+** ([python.org](https://www.python.org/downloads/))
2. *(Optional)* **Node.js & npm** ([nodejs.org](https://nodejs.org/))

---

### Step 1: Open Terminal / Command Prompt
Navigate to the project root directory:

```bash
cd Inventory-management-MDM
```

---

### Step 2: Install Dependencies

Install the required Python package (`Flask`):

```bash
pip install -r requirements.txt
```

*(Alternatively: `pip install flask`)*

If you wish to use Node.js scripts for frontend tooling:
```bash
npm install
```

---

### Step 3: Start the Backend Server

Run using Python:
```bash
python app.py
```

*Or run using npm:*
```bash
npm start
```

You will see output indicating the server is running:
```text
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
```

---

### Step 4: Open in Web Browser

Open your web browser and visit:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)** or **[http://localhost:5000](http://localhost:5000)**

---

## 🔌 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Fetch all products with inventory stats |
| `POST` | `/api/products` | Add a new product (validates non-negative quantity & price) |
| `GET` | `/api/products/search?q=<term>` | Search products by Product ID, Name, or Category |
| `PUT` | `/api/products/<pid>` | Update stock quantity and/or price of a product |
| `DELETE` | `/api/products/<pid>` | Delete a product record by Product ID |
| `GET` | `/api/products/low-stock` | Get all products with quantity $\le 10$ |

---

## 🗄️ Database Schema

SQLite table `products`:

```sql
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    price REAL NOT NULL DEFAULT 0.0
);
```

---

## 📂 Project Structure

```text
Inventory-management-MDM/
├── app.py              # Flask server, REST API routes & SQLite queries
├── inventory.db        # SQLite database file (auto-generated on launch)
├── package.json        # Frontend tooling & npm start scripts
├── requirements.txt    # Python dependencies (Flask)
├── README.md           # Documentation & run instructions
└── static/
    ├── index.html      # Responsive dashboard UI layout
    ├── script.js       # Asynchronous Fetch API logic & DOM manipulation
    └── style.css       # Design system, cards, progress bars & themes
```
