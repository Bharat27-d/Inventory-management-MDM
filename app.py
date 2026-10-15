"""
Inventory Management System (MDM) — Flask Backend Server
Full-stack REST API with SQLite for product catalog, stock tracking, and activity logging.
"""

import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# Enable CORS for all domains so Next.js frontend on localhost:3000 can communicate seamlessly
CORS(app, resources={r"/api/*": {"origins": "*"}})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, 'inventory.db')
DEFAULT_LOW_STOCK_THRESHOLD = 10


def get_db():
    """Establish connection to SQLite database."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Create database tables and seed sample data if empty."""
    conn = get_db()
    cursor = conn.cursor()

    # Product Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL CHECK (quantity >= 0),
            price REAL NOT NULL CHECK (price >= 0),
            low_stock_threshold INTEGER NOT NULL DEFAULT 10 CHECK (low_stock_threshold >= 0),
            description TEXT DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # Stock Activity / Audit Log Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT NOT NULL,
            product_name TEXT NOT NULL,
            action TEXT NOT NULL,
            quantity_change INTEGER DEFAULT 0,
            resulting_quantity INTEGER DEFAULT 0,
            details TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')

    conn.commit()

    # Check if products exist; if not, seed realistic sample data
    count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    if count == 0:
        seed_sample_data(conn)

    conn.close()


def log_activity(conn, product_id, product_name, action, quantity_change, resulting_quantity, details):
    """Helper to record audit log entry."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    conn.execute('''
        INSERT INTO activity_logs (product_id, product_name, action, quantity_change, resulting_quantity, details, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (product_id, product_name, action, quantity_change, resulting_quantity, details, now))


def seed_sample_data(conn):
    """Seed initial sample inventory data across various categories."""
    sample_products = [
        ("PRD-1001", "MacBook Pro 16-inch M3 Max", "Electronics", 12, 3499.00, 5, "Space Black, 36GB Unified Memory, 1TB SSD"),
        ("PRD-1002", "Sony WH-1000XM5 Wireless Headphones", "Electronics", 4, 399.99, 8, "Industry Leading Noise Canceling Wireless Headset"),
        ("PRD-1003", "Keychron Q1 Pro Mechanical Keyboard", "Peripherals", 0, 199.00, 5, "Wireless Custom Mechanical Keyboard with Hot-swap switches"),
        ("PRD-1004", "Dell UltraSharp 27-inch 4K USB-C Hub Monitor", "Electronics", 18, 589.50, 6, "IPS Black technology with 2000:1 contrast ratio"),
        ("PRD-1005", "Logitech MX Master 3S Wireless Mouse", "Peripherals", 25, 99.99, 10, "Quiet clicks and 8K DPI tracking on any surface"),
        ("PRD-2001", "Merino Wool Thermal Tech Hoodie", "Apparel", 3, 145.00, 10, "Breathable odor-resistant everyday outerwear"),
        ("PRD-2002", "Waterproof Everyday Commuter Backpack 24L", "Apparel", 22, 129.00, 8, "Weatherproof canvas with padded 16-inch laptop sleeve"),
        ("PRD-3001", "Ergonomic Mesh Task Chair with Lumbar Support", "Office & Furniture", 6, 320.00, 10, "Adjustable 3D armrests and breathable mesh back"),
        ("PRD-3002", "Anker 100W GaN Fast Charging Station", "Accessories", 42, 69.99, 15, "Compact 4-port desktop charger for multiple devices"),
        ("PRD-3003", "Electric Dual-Motor Standing Desk Frame", "Office & Furniture", 2, 289.00, 5, "Heavy-duty steel frame with digital memory keypad")
    ]

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for pid, name, cat, qty, prc, thres, desc in sample_products:
        conn.execute('''
            INSERT INTO products (product_id, name, category, quantity, price, low_stock_threshold, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (pid, name, cat, qty, prc, thres, desc, now, now))
        log_activity(conn, pid, name, "INITIAL_STOCK", qty, qty, f"Initial inventory seed of {qty} units")

    conn.commit()


# ── Health & API Meta ──

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Inventory Management System Backend',
        'timestamp': datetime.now().isoformat()
    })


# ── Reset / Re-Seed Database ──

@app.route('/api/seed', methods=['POST'])
def reset_seed():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM activity_logs")
    cursor.execute("DELETE FROM products")
    seed_sample_data(conn)
    conn.close()
    return jsonify({
        'success': True,
        'message': 'Database re-seeded with pristine inventory sample data.'
    })


# ── API: Dashboard Stats ──

@app.route('/api/stats', methods=['GET'])
def get_stats():
    conn = get_db()
    cursor = conn.cursor()

    total_products = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
    total_items = cursor.execute("SELECT COALESCE(SUM(quantity), 0) FROM products").fetchone()[0]
    total_val = cursor.execute("SELECT COALESCE(SUM(quantity * price), 0.0) FROM products").fetchone()[0]

    low_stock_count = cursor.execute('''
        SELECT COUNT(*) FROM products WHERE quantity <= low_stock_threshold AND quantity > 0
    ''').fetchone()[0]

    out_of_stock_count = cursor.execute('''
        SELECT COUNT(*) FROM products WHERE quantity = 0
    ''').fetchone()[0]

    categories = cursor.execute('''
        SELECT category, COUNT(*) as count, SUM(quantity) as total_qty
        FROM products
        GROUP BY category
        ORDER BY count DESC
    ''').fetchall()

    conn.close()

    return jsonify({
        'success': True,
        'stats': {
            'total_products': total_products,
            'total_items': total_items,
            'total_inventory_value': round(total_val, 2),
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'categories_count': len(categories),
            'categories': [dict(c) for c in categories]
        }
    })


# ── API: List Categories ──

@app.route('/api/categories', methods=['GET'])
def get_categories():
    conn = get_db()
    rows = conn.execute("SELECT DISTINCT category FROM products ORDER BY category ASC").fetchall()
    conn.close()
    return jsonify({
        'success': True,
        'categories': [r['category'] for r in rows]
    })


# ── API: List & Search Products ──

@app.route('/api/products', methods=['GET'])
def list_products():
    """
    List and filter products.
    Supported query params:
      - q: search term matching name, product_id, category, or description
      - category: filter by category
      - status: 'all', 'low_stock', 'out_of_stock', 'in_stock'
      - sort_by: 'name', 'price', 'quantity', 'product_id', 'created_at'
      - order: 'asc', 'desc'
    """
    q = request.args.get('q', '').strip()
    category = request.args.get('category', '').strip()
    status = request.args.get('status', 'all').strip().lower()
    sort_by = request.args.get('sort_by', 'id').strip().lower()
    order = request.args.get('order', 'asc').strip().upper()

    # Allowed sorting fields to prevent SQL injection
    valid_sorts = {
        'id': 'id',
        'product_id': 'product_id',
        'name': 'name',
        'category': 'category',
        'quantity': 'quantity',
        'price': 'price',
        'created_at': 'created_at'
    }
    sort_column = valid_sorts.get(sort_by, 'id')
    sort_direction = 'DESC' if order == 'DESC' else 'ASC'

    conditions = []
    params = []

    if q:
        term = f"%{q}%"
        conditions.append("(product_id LIKE ? OR name LIKE ? OR category LIKE ? OR description LIKE ?)")
        params.extend([term, term, term, term])

    if category and category.lower() != 'all':
        conditions.append("category = ?")
        params.append(category)

    if status == 'low_stock':
        conditions.append("quantity <= low_stock_threshold AND quantity > 0")
    elif status == 'out_of_stock':
        conditions.append("quantity = 0")
    elif status == 'in_stock':
        conditions.append("quantity > low_stock_threshold")

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    query = f"SELECT * FROM products {where_clause} ORDER BY {sort_column} {sort_direction}"

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()

    products = [dict(r) for r in rows]
    return jsonify({
        'success': True,
        'count': len(products),
        'data': products
    })


# ── API: Low-stock list ──

@app.route('/api/products/low-stock', methods=['GET'])
def get_low_stock():
    conn = get_db()
    rows = conn.execute('''
        SELECT * FROM products 
        WHERE quantity <= low_stock_threshold 
        ORDER BY quantity ASC, name ASC
    ''').fetchall()
    conn.close()
    return jsonify({
        'success': True,
        'count': len(rows),
        'data': [dict(r) for r in rows]
    })


# ── API: Get Single Product ──

@app.route('/api/products/<string:pid>', methods=['GET'])
def get_product(pid):
    conn = get_db()
    row = conn.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'success': False, 'error': f"Product with ID '{pid}' not found."}), 404

    return jsonify({'success': True, 'data': dict(row)})


# ── API: Add Product ──

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON request body.'}), 400

    # Required field verification
    required_fields = ['product_id', 'name', 'category', 'quantity', 'price']
    for field in required_fields:
        if field not in data or data[field] is None or str(data[field]).strip() == '':
            return jsonify({'success': False, 'error': f"'{field}' is required and cannot be empty."}), 400

    product_id = str(data['product_id']).strip().upper()
    name = str(data['name']).strip()
    category = str(data['category']).strip()
    description = str(data.get('description', '')).strip()

    # Parse and validate quantity
    try:
        quantity = int(data['quantity'])
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Quantity must be a valid whole number (integer).'}), 400

    if quantity < 0:
        return jsonify({'success': False, 'error': 'Quantity cannot be negative. Must be 0 or greater.'}), 400

    # Parse and validate price
    try:
        price = float(data['price'])
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Price must be a valid number.'}), 400

    if price < 0:
        return jsonify({'success': False, 'error': 'Price cannot be negative. Must be 0.00 or greater.'}), 400

    # Low stock threshold
    try:
        threshold = int(data.get('low_stock_threshold', DEFAULT_LOW_STOCK_THRESHOLD))
        if threshold < 0:
            threshold = DEFAULT_LOW_STOCK_THRESHOLD
    except (ValueError, TypeError):
        threshold = DEFAULT_LOW_STOCK_THRESHOLD

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_db()
    cursor = conn.cursor()

    # Check for duplicate product ID
    existing = cursor.execute("SELECT id FROM products WHERE product_id = ?", (product_id,)).fetchone()
    if existing:
        conn.close()
        return jsonify({
            'success': False,
            'error': f"Product ID '{product_id}' already exists in inventory. Product IDs must be unique."
        }), 409

    try:
        cursor.execute('''
            INSERT INTO products (product_id, name, category, quantity, price, low_stock_threshold, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (product_id, name, category, quantity, price, threshold, description, now, now))

        log_activity(conn, product_id, name, "CREATE", quantity, quantity,
                     f"Added new product '{name}' with initial stock {quantity} @ ${price:.2f}")

        conn.commit()

        new_row = cursor.execute("SELECT * FROM products WHERE product_id = ?", (product_id,)).fetchone()
        product_dict = dict(new_row)
        conn.close()

        return jsonify({
            'success': True,
            'message': f"Product '{name}' ({product_id}) added successfully.",
            'data': product_dict
        }), 201

    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'success': False, 'error': f"Database error: {str(e)}"}), 500


# ── API: Update Product Details ──

@app.route('/api/products/<string:pid>', methods=['PUT'])
def update_product(pid):
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON request body.'}), 400

    conn = get_db()
    cursor = conn.cursor()

    current = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    if not current:
        conn.close()
        return jsonify({'success': False, 'error': f"Product with ID '{pid}' not found."}), 404

    updates = []
    vals = []
    log_details = []

    if 'name' in data and data['name'] is not None:
        name = str(data['name']).strip()
        if not name:
            conn.close()
            return jsonify({'success': False, 'error': 'Product name cannot be empty.'}), 400
        updates.append("name = ?")
        vals.append(name)
        log_details.append(f"Name changed from '{current['name']}' to '{name}'")
    else:
        name = current['name']

    if 'category' in data and data['category'] is not None:
        category = str(data['category']).strip()
        if not category:
            conn.close()
            return jsonify({'success': False, 'error': 'Category cannot be empty.'}), 400
        updates.append("category = ?")
        vals.append(category)

    if 'description' in data:
        updates.append("description = ?")
        vals.append(str(data['description']).strip())

    if 'quantity' in data and data['quantity'] is not None:
        try:
            quantity = int(data['quantity'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': 'Quantity must be a valid integer.'}), 400

        if quantity < 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Quantity cannot be negative.'}), 400

        updates.append("quantity = ?")
        vals.append(quantity)
        qty_diff = quantity - current['quantity']
        if qty_diff != 0:
            log_details.append(f"Quantity adjusted from {current['quantity']} to {quantity} ({'+' if qty_diff > 0 else ''}{qty_diff})")
    else:
        quantity = current['quantity']

    if 'price' in data and data['price'] is not None:
        try:
            price = float(data['price'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': 'Price must be a valid number.'}), 400

        if price < 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Price cannot be negative.'}), 400

        updates.append("price = ?")
        vals.append(price)
        if price != current['price']:
            log_details.append(f"Price updated from ${current['price']:.2f} to ${price:.2f}")

    if 'low_stock_threshold' in data and data['low_stock_threshold'] is not None:
        try:
            threshold = int(data['low_stock_threshold'])
            if threshold < 0:
                conn.close()
                return jsonify({'success': False, 'error': 'Low stock threshold cannot be negative.'}), 400
            updates.append("low_stock_threshold = ?")
            vals.append(threshold)
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': 'Threshold must be a valid integer.'}), 400

    if not updates:
        conn.close()
        return jsonify({'success': False, 'error': 'No fields provided for update.'}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    updates.append("updated_at = ?")
    vals.append(now)

    vals.append(pid)
    sql = f"UPDATE products SET {', '.join(updates)} WHERE product_id = ?"
    cursor.execute(sql, vals)

    log_text = "; ".join(log_details) if log_details else "Product details updated"
    log_activity(conn, pid, name, "UPDATE", quantity - current['quantity'], quantity, log_text)

    conn.commit()

    updated = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Product '{pid}' updated successfully.",
        'data': dict(updated)
    })


# ── API: Quick Stock Adjust (Increment, Decrement, Set) ──

@app.route('/api/products/<string:pid>/stock', methods=['PATCH'])
def adjust_stock(pid):
    """
    Adjust stock quantity.
    Payload options:
      - {"change": 5}   (increments by 5)
      - {"change": -3}  (decrements by 3, rejects if resulting stock < 0)
      - {"quantity": 20} (sets exact stock, rejects if < 0)
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON body.'}), 400

    conn = get_db()
    cursor = conn.cursor()

    product = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    if not product:
        conn.close()
        return jsonify({'success': False, 'error': f"Product '{pid}' not found."}), 404

    current_qty = product['quantity']

    if 'change' in data:
        try:
            change = int(data['change'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': "'change' must be a whole integer."}), 400

        new_qty = current_qty + change
        if new_qty < 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': f"Stock cannot be reduced below zero. Current stock is {current_qty}, attempted change was {change}."
            }), 400
        action_type = "STOCK_INCREASE" if change > 0 else "STOCK_DECREASE"
        action_desc = f"Stock {'increased' if change > 0 else 'decreased'} by {abs(change)} (from {current_qty} to {new_qty})"
        qty_change = change

    elif 'quantity' in data:
        try:
            new_qty = int(data['quantity'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': "'quantity' must be a valid integer."}), 400

        if new_qty < 0:
            conn.close()
            return jsonify({
                'success': False,
                'error': "Stock cannot be negative. Must be 0 or higher."
            }), 400

        qty_change = new_qty - current_qty
        action_type = "STOCK_OVERRIDE"
        action_desc = f"Stock level set to {new_qty} (was {current_qty})"

    else:
        conn.close()
        return jsonify({'success': False, 'error': "Provide either 'change' or 'quantity' in request payload."}), 400

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("UPDATE products SET quantity = ?, updated_at = ? WHERE product_id = ?", (new_qty, now, pid))

    log_activity(conn, pid, product['name'], action_type, qty_change, new_qty, action_desc)

    conn.commit()
    updated = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    conn.close()

    return jsonify({
        'success': True,
        'message': action_desc,
        'data': dict(updated)
    })


# ── API: Delete Product ──

@app.route('/api/products/<string:pid>', methods=['DELETE'])
def delete_product(pid):
    conn = get_db()
    cursor = conn.cursor()

    product = cursor.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    if not product:
        conn.close()
        return jsonify({'success': False, 'error': f"Product '{pid}' not found."}), 404

    cursor.execute("DELETE FROM products WHERE product_id = ?", (pid,))
    log_activity(conn, pid, product['name'], "DELETE", -product['quantity'], 0,
                 f"Deleted product '{product['name']}' from inventory records")

    conn.commit()
    conn.close()

    return jsonify({
        'success': True,
        'message': f"Product '{product['name']}' ({pid}) successfully deleted from inventory."
    })


# ── API: Audit / Activity Logs ──

@app.route('/api/logs', methods=['GET'])
def get_logs():
    limit = request.args.get('limit', 50, type=int)
    conn = get_db()
    rows = conn.execute("SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
    conn.close()
    return jsonify({
        'success': True,
        'count': len(rows),
        'data': [dict(r) for r in rows]
    })


# ── Initialize DB Schema on Startup ──
init_db()

if __name__ == '__main__':
    print("=" * 60)
    print(" INVENTORY MANAGEMENT SYSTEM (MDM) — FLASK BACKEND")
    print(" Server running on: http://127.0.0.1:5000")
    print(" API Documentation & Health: http://127.0.0.1:5000/api/health")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
