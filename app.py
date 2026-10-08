"""
Inventory Management System — Flask Backend
REST API with SQLite for CRUD operations on product inventory.
"""

from flask import Flask, request, jsonify, send_from_directory
import sqlite3
import os

app = Flask(__name__, static_folder='static')
DATABASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'inventory.db')
LOW_STOCK_THRESHOLD = 10


def get_db():
    """Create a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize SQLite schema for product and stock data."""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 0,
            price REAL NOT NULL DEFAULT 0.0
        )
    ''')
    conn.commit()
    conn.close()


# ── Serve Frontend ──

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)


# ── API: List all products ──

@app.route('/api/products', methods=['GET'])
def list_products():
    conn = get_db()
    rows = conn.execute("SELECT * FROM products ORDER BY id ASC").fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})


# ── API: Add product ──

@app.route('/api/products', methods=['POST'])
def add_product():
    data = request.get_json()

    # Validate required fields
    for field in ['product_id', 'name', 'category', 'quantity', 'price']:
        if field not in data or data[field] == '' or data[field] is None:
            return jsonify({'success': False, 'error': f"'{field}' is required."}), 400

    try:
        quantity = int(data['quantity'])
        price = float(data['price'])
    except (ValueError, TypeError):
        return jsonify({'success': False, 'error': 'Quantity must be integer, Price must be number.'}), 400

    # Validate non-negative
    if quantity < 0:
        return jsonify({'success': False, 'error': 'Quantity cannot be negative.'}), 400
    if price < 0:
        return jsonify({'success': False, 'error': 'Price cannot be negative.'}), 400

    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO products (product_id, name, category, quantity, price) VALUES (?, ?, ?, ?, ?)",
            (data['product_id'].strip(), data['name'].strip(), data['category'].strip(), quantity, price)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'success': False, 'error': f"Product ID '{data['product_id']}' already exists."}), 409
    conn.close()
    return jsonify({'success': True, 'message': 'Product added successfully.'}), 201


# ── API: Search by name / ID / category ──

@app.route('/api/products/search', methods=['GET'])
def search_products():
    q = request.args.get('q', '').strip()
    if not q:
        return jsonify({'success': False, 'error': 'Search query is empty.'}), 400

    conn = get_db()
    term = f"%{q}%"
    rows = conn.execute(
        "SELECT * FROM products WHERE product_id LIKE ? OR name LIKE ? OR category LIKE ?",
        (term, term, term)
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows], 'count': len(rows)})


# ── API: Update stock quantity / price ──

@app.route('/api/products/<string:pid>', methods=['PUT'])
def update_product(pid):
    data = request.get_json()
    conn = get_db()

    row = conn.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'success': False, 'error': f"Product '{pid}' not found."}), 404

    updates, vals = [], []

    if 'quantity' in data and data['quantity'] is not None:
        try:
            qty = int(data['quantity'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': 'Quantity must be an integer.'}), 400
        if qty < 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Stock cannot go below zero.'}), 400
        updates.append("quantity = ?")
        vals.append(qty)

    if 'price' in data and data['price'] is not None:
        try:
            prc = float(data['price'])
        except (ValueError, TypeError):
            conn.close()
            return jsonify({'success': False, 'error': 'Price must be a number.'}), 400
        if prc < 0:
            conn.close()
            return jsonify({'success': False, 'error': 'Price cannot be negative.'}), 400
        updates.append("price = ?")
        vals.append(prc)

    if not updates:
        conn.close()
        return jsonify({'success': False, 'error': 'Provide quantity or price to update.'}), 400

    vals.append(pid)
    conn.execute(f"UPDATE products SET {', '.join(updates)} WHERE product_id = ?", vals)
    conn.commit()

    updated = conn.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'message': 'Product updated.', 'data': dict(updated)})


# ── API: Delete product ──

@app.route('/api/products/<string:pid>', methods=['DELETE'])
def delete_product(pid):
    conn = get_db()
    row = conn.execute("SELECT * FROM products WHERE product_id = ?", (pid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'success': False, 'error': f"Product '{pid}' not found."}), 404

    conn.execute("DELETE FROM products WHERE product_id = ?", (pid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': f"Product '{pid}' deleted."})


# ── API: Low-stock alerts ──

@app.route('/api/products/low-stock', methods=['GET'])
def low_stock():
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM products WHERE quantity <= ? ORDER BY quantity ASC",
        (LOW_STOCK_THRESHOLD,)
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows], 'threshold': LOW_STOCK_THRESHOLD})


# ── Main ──

if __name__ == '__main__':
    init_db()
    print("Inventory Management System running at http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
