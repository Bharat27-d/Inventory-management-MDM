/**
 * Inventory Management System — Frontend Logic
 * Uses Fetch API for all HTTP requests (no page reloads).
 * Handles: Add, List, Search, Update, Delete, Low-stock alerts.
 */

const API = '/api/products';

// ── DOM Elements ──

const addForm = document.getElementById('add-form');
const productTbody = document.getElementById('product-tbody');
const invTbody = document.getElementById('inv-tbody');
const emptyMsg = document.getElementById('empty-msg');
const invEmptyMsg = document.getElementById('inv-empty-msg');

const searchInput = document.getElementById('inp-search');
const btnSearch = document.getElementById('btn-search');
const btnClearSearch = document.getElementById('btn-clear-search');
const searchResults = document.getElementById('search-results');
const searchResultsTitle = document.getElementById('search-results-title');
const searchTbody = document.getElementById('search-tbody');

const alertsSection = document.getElementById('alerts-section');
const alertsTbody = document.getElementById('alerts-tbody');
const alertCount = document.getElementById('alert-count');

const updateModal = document.getElementById('update-modal');
const updateForm = document.getElementById('update-form');
const updProductId = document.getElementById('upd-product-id');
const updQuantity = document.getElementById('upd-quantity');
const updPrice = document.getElementById('upd-price');
const modalProductLabel = document.getElementById('modal-product-label');
const btnCancelUpdate = document.getElementById('btn-cancel-update');
const btnCloseUpdate = document.getElementById('btn-close-update');

const deleteModal = document.getElementById('delete-modal');
const deleteConfirmText = document.getElementById('delete-confirm-text');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnCloseDelete = document.getElementById('btn-close-delete');

const toast = document.getElementById('toast');
const pageTitle = document.getElementById('page-title');

let deleteTargetId = null;


// ══════════════════════════════════════════════
//  Sidebar Navigation
// ══════════════════════════════════════════════

const navItems = document.querySelectorAll('.nav-item');
const pageSections = document.querySelectorAll('.page-section');
const sectionTitles = {
    'dashboard': 'Dashboard',
    'add-product': 'Add Product',
    'search': 'Search Products',
    'inventory': 'Inventory'
};

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');

        // Update active nav
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');

        // Show correct section
        pageSections.forEach(s => s.classList.remove('active-section'));
        document.getElementById(`section-${section}`).classList.add('active-section');

        // Update page title
        pageTitle.textContent = sectionTitles[section] || 'Dashboard';
    });
});

// Set current date in topbar
const dateEl = document.getElementById('current-date');
dateEl.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});


// ══════════════════════════════════════════════
//  Toast Notification
// ══════════════════════════════════════════════

function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}


// ══════════════════════════════════════════════
//  List All Products + Stats
// ══════════════════════════════════════════════

async function loadProducts() {
    try {
        const res = await fetch(API);
        const json = await res.json();

        if (json.success) {
            renderProductTable(json.data, productTbody, emptyMsg);
            renderProductTable(json.data, invTbody, invEmptyMsg);
            updateStats(json.data);

            // Update badges
            document.getElementById('product-count-badge').textContent = `${json.data.length} items`;
            document.getElementById('inv-count-badge').textContent = `${json.data.length} items`;
        }
    } catch (err) {
        showToast('Failed to load products.', 'error');
    }
}

function updateStats(products) {
    document.getElementById('stat-total').textContent = products.length;

    const categories = new Set(products.map(p => p.category));
    document.getElementById('stat-categories').textContent = categories.size;

    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    document.getElementById('stat-stock').textContent = totalStock.toLocaleString();

    const lowStockCount = products.filter(p => p.quantity <= 10).length;
    document.getElementById('stat-lowstock').textContent = lowStockCount;
}

function renderProductTable(products, tbody, emptyEl) {
    tbody.innerHTML = '';

    if (products.length === 0) {
        emptyEl.classList.remove('hidden');
        return;
    }

    emptyEl.classList.add('hidden');

    products.forEach(p => {
        const isLow = p.quantity <= 10;
        const tr = document.createElement('tr');
        if (isLow) tr.classList.add('row-low-stock');

        tr.innerHTML = `
            <td>${getProductIdBadge(p.product_id)}</td>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${getCategoryBadge(p.category)}</td>
            <td>
                <strong>${p.quantity}</strong>
                ${getStatusBadge(p.quantity)}
            </td>
            <td>${getStockProgress(p.quantity)}</td>
            <td class="price-cell">₹${Number(p.price).toFixed(2)}</td>
            <td class="actions-cell">
                <button class="btn btn-outline btn-sm" onclick="openUpdateModal('${escapeAttr(p.product_id)}', '${escapeAttr(p.name)}', ${p.quantity}, ${p.price})">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${escapeAttr(p.product_id)}', '${escapeAttr(p.name)}')">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}


// ══════════════════════════════════════════════
//  Add Product
// ══════════════════════════════════════════════

addForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('inp-product-id').value.trim();
    const name = document.getElementById('inp-name').value.trim();
    const category = document.getElementById('inp-category').value.trim();
    const quantity = document.getElementById('inp-quantity').value;
    const price = document.getElementById('inp-price').value;

    // Client-side validation
    if (!productId || !name || !category || quantity === '' || price === '') {
        showToast('All fields are required.', 'error');
        return;
    }

    if (Number(quantity) < 0) {
        showToast('Quantity cannot be negative.', 'error');
        return;
    }

    if (Number(price) < 0) {
        showToast('Price cannot be negative.', 'error');
        return;
    }

    try {
        const res = await fetch(API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                product_id: productId,
                name: name,
                category: category,
                quantity: Number(quantity),
                price: Number(price)
            })
        });

        const json = await res.json();

        if (json.success) {
            showToast(json.message, 'success');
            addForm.reset();
            loadProducts();
            loadLowStockAlerts();
        } else {
            showToast(json.error, 'error');
        }
    } catch (err) {
        showToast('Failed to add product.', 'error');
    }
});


// ══════════════════════════════════════════════
//  Search Products
// ══════════════════════════════════════════════

btnSearch.addEventListener('click', performSearch);
searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') performSearch();
});

btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    searchResults.classList.add('hidden');
});

async function performSearch() {
    const query = searchInput.value.trim();

    if (!query) {
        showToast('Enter a search term.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();

        if (json.success) {
            searchResults.classList.remove('hidden');

            if (json.data.length === 0) {
                searchResultsTitle.textContent = `No products found for "${query}"`;
                searchTbody.innerHTML = '';
            } else {
                searchResultsTitle.textContent = `Found ${json.count} result(s) for "${query}"`;
                searchTbody.innerHTML = '';

                json.data.forEach(p => {
                    const isLow = p.quantity <= 10;
                    const tr = document.createElement('tr');
                    if (isLow) tr.classList.add('row-low-stock');

                    tr.innerHTML = `
                        <td>${getProductIdBadge(p.product_id)}</td>
                        <td><strong>${escapeHtml(p.name)}</strong></td>
                        <td>${getCategoryBadge(p.category)}</td>
                        <td>
                            <strong>${p.quantity}</strong>
                            ${getStatusBadge(p.quantity)}
                        </td>
                        <td>${getStockProgress(p.quantity)}</td>
                        <td class="price-cell">₹${Number(p.price).toFixed(2)}</td>
                        <td class="actions-cell">
                            <button class="btn btn-outline btn-sm" onclick="openUpdateModal('${escapeAttr(p.product_id)}', '${escapeAttr(p.name)}', ${p.quantity}, ${p.price})">
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${escapeAttr(p.product_id)}', '${escapeAttr(p.name)}')">
                                <i class="fa-solid fa-trash-can"></i> Delete
                            </button>
                        </td>
                    `;
                    searchTbody.appendChild(tr);
                });
            }
        } else {
            showToast(json.error, 'error');
        }
    } catch (err) {
        showToast('Search failed.', 'error');
    }
}


// ══════════════════════════════════════════════
//  Update Product (Stock Quantity / Price)
// ══════════════════════════════════════════════

function openUpdateModal(productId, name, quantity, price) {
    updProductId.value = productId;
    updQuantity.value = quantity;
    updPrice.value = price;
    modalProductLabel.textContent = `Updating: ${name} (${productId})`;
    updateModal.classList.remove('hidden');
}

btnCancelUpdate.addEventListener('click', () => {
    updateModal.classList.add('hidden');
});

btnCloseUpdate.addEventListener('click', () => {
    updateModal.classList.add('hidden');
});

updateModal.addEventListener('click', (e) => {
    if (e.target === updateModal) updateModal.classList.add('hidden');
});

updateForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const pid = updProductId.value;
    const quantity = updQuantity.value;
    const price = updPrice.value;

    // Validate non-negative
    if (Number(quantity) < 0) {
        showToast('Quantity cannot be negative (stock cannot go below zero).', 'error');
        return;
    }

    if (Number(price) < 0) {
        showToast('Price cannot be negative.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API}/${encodeURIComponent(pid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quantity: Number(quantity),
                price: Number(price)
            })
        });

        const json = await res.json();

        if (json.success) {
            showToast(json.message, 'success');
            updateModal.classList.add('hidden');
            loadProducts();
            loadLowStockAlerts();
            if (!searchResults.classList.contains('hidden') && searchInput.value.trim()) {
                performSearch();
            }
        } else {
            showToast(json.error, 'error');
        }
    } catch (err) {
        showToast('Failed to update product.', 'error');
    }
});


// ══════════════════════════════════════════════
//  Delete Product
// ══════════════════════════════════════════════

function openDeleteModal(productId, name) {
    deleteTargetId = productId;
    deleteConfirmText.textContent = `Are you sure you want to delete "${name}" (${productId})? This action cannot be undone.`;
    deleteModal.classList.remove('hidden');
}

btnCancelDelete.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    deleteTargetId = null;
});

btnCloseDelete.addEventListener('click', () => {
    deleteModal.classList.add('hidden');
    deleteTargetId = null;
});

deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
        deleteModal.classList.add('hidden');
        deleteTargetId = null;
    }
});

btnConfirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;

    try {
        const res = await fetch(`${API}/${encodeURIComponent(deleteTargetId)}`, {
            method: 'DELETE'
        });

        const json = await res.json();

        if (json.success) {
            showToast(json.message, 'success');
            deleteModal.classList.add('hidden');
            deleteTargetId = null;
            loadProducts();
            loadLowStockAlerts();
            if (!searchResults.classList.contains('hidden') && searchInput.value.trim()) {
                performSearch();
            }
        } else {
            showToast(json.error, 'error');
        }
    } catch (err) {
        showToast('Failed to delete product.', 'error');
    }
});


// ══════════════════════════════════════════════
//  Low-Stock Alerts
// ══════════════════════════════════════════════

async function loadLowStockAlerts() {
    try {
        const res = await fetch(`${API}/low-stock`);
        const json = await res.json();

        if (json.success && json.data.length > 0) {
            alertsSection.classList.remove('hidden');
            alertsTbody.innerHTML = '';
            alertCount.textContent = json.data.length;

            json.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.classList.add('row-low-stock');
                tr.innerHTML = `
                    <td>${getProductIdBadge(p.product_id)}</td>
                    <td><strong>${escapeHtml(p.name)}</strong></td>
                    <td>${getCategoryBadge(p.category)}</td>
                    <td><strong>${p.quantity}</strong></td>
                    <td>${getStockProgress(p.quantity)}</td>
                    <td>${getStatusBadge(p.quantity)}</td>
                    <td class="actions-cell">
                        <button class="btn btn-warning btn-sm" onclick="openUpdateModal('${escapeAttr(p.product_id)}', '${escapeAttr(p.name)}', ${p.quantity}, ${p.price})">
                            <i class="fa-solid fa-boxes-packing"></i> Restock
                        </button>
                    </td>
                `;
                alertsTbody.appendChild(tr);
            });
        } else {
            alertsSection.classList.add('hidden');
        }
    } catch (err) {
        // Silently fail for alerts
    }
}


// ══════════════════════════════════════════════
//  UI Component Generators
// ══════════════════════════════════════════════

function getProductIdBadge(id) {
    return `<span class="product-id-tag"><i class="fa-solid fa-barcode"></i> ${escapeHtml(id)}</span>`;
}

function getCategoryBadge(category) {
    const cat = (category || '').trim();
    const lower = cat.toLowerCase();
    let colorClass = 'category-default';
    if (lower.includes('elect')) colorClass = 'category-blue';
    else if (lower.includes('furn')) colorClass = 'category-purple';
    else if (lower.includes('cloth') || lower.includes('apparel') || lower.includes('wear')) colorClass = 'category-pink';
    else if (lower.includes('food') || lower.includes('groc')) colorClass = 'category-green';
    else if (lower.includes('station') || lower.includes('book') || lower.includes('office')) colorClass = 'category-amber';
    else if (lower.includes('toy') || lower.includes('game') || lower.includes('gadget')) colorClass = 'category-cyan';

    return `<span class="category-chip ${colorClass}"><i class="fa-solid fa-tag"></i> ${escapeHtml(cat)}</span>`;
}

function getStatusBadge(quantity) {
    const qty = Number(quantity);
    if (qty <= 0) {
        return `<span class="status-pill status-out"><i class="fa-solid fa-circle-xmark"></i> Out of Stock</span>`;
    } else if (qty <= 10) {
        return `<span class="status-pill status-low"><i class="fa-solid fa-triangle-exclamation"></i> Low Stock</span>`;
    } else {
        return `<span class="status-pill status-in-stock"><i class="fa-solid fa-circle-check"></i> In Stock</span>`;
    }
}

function getStockProgress(quantity) {
    const qty = Number(quantity) || 0;
    // Standard baseline max 50 units for visualization
    const percent = Math.min(100, Math.round((qty / 50) * 100));
    let barClass = 'stock-good';
    if (qty <= 0) {
        barClass = 'stock-out';
    } else if (qty <= 10) {
        barClass = 'stock-critical';
    } else if (qty <= 20) {
        barClass = 'stock-warning';
    }

    return `
        <div class="stock-progress-wrap">
            <div class="stock-progress-track">
                <div class="stock-progress-fill ${barClass}" style="width: ${Math.max(6, percent)}%"></div>
            </div>
            <span class="stock-progress-label ${barClass}-text">${qty} units (${percent}%)</span>
        </div>
    `;
}


// ══════════════════════════════════════════════
//  Utility: HTML escaping
// ══════════════════════════════════════════════

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function escapeAttr(str) {
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
}


// ══════════════════════════════════════════════
//  Initialize
// ══════════════════════════════════════════════

loadProducts();
loadLowStockAlerts();
