/**
 * Zayid Food System — Frontend App
 * Design Patterns Used:
 *   - Module Pattern   : AuthModule, MenuModule, CartModule, OrderModule, AdminModule
 *   - Observer Pattern : EventBus (publish/subscribe)
 *   - Facade Pattern   : API object (hides all fetch() complexity)
 */

'use strict';

// ============================================================
// FACADE PATTERN — API object
// Single interface for all backend communication
// ============================================================
const API = (() => {
  // FIX: Use an absolute path from the server root instead of a relative one.
  // This works whether index.html is at /zayid_food/frontend/ or anywhere else.
  // We detect the base path dynamically so no manual editing is needed.
  function getBase() {
    const loc = window.location;
    // Strip /frontend/ (or /frontend/index.html) to get project root
    const path = loc.pathname.replace(/\/frontend(\/.*)?$/, '');
    return `${loc.protocol}//${loc.host}${path}/backend/index.php`;
  }

  const BASE = getBase();

  async function request(params = {}, method = 'GET', body = null) {
    const url = new URL(BASE);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const opts = {
      method,
      credentials: 'include',   // FIX: 'include' is needed to send cookies cross-path; 'same-origin' can silently fail
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(url.toString(), opts);

      if (res.status === 404) {
        console.error('404 — Backend not found at:', url.toString());
        throw new Error('Backend not found at: ' + url.toString());
      }

      let data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      return data;
    } catch (err) {
      console.error('Fetch error:', err);
      throw err;
    }
  }

  return {
    // Auth
    login:    (username, password) => request({ route: 'auth', action: 'login' }, 'POST', { username, password }),
    logout:   ()                   => request({ route: 'auth', action: 'logout' }),
    register: (name, username, password) => request({ route: 'auth', action: 'register' }, 'POST', { name, username, password }),
    me:       ()                   => request({ route: 'auth', action: 'me' }),

    // Menu
    getMenu:    ()              => request({ route: 'menu', action: 'list' }),
    addItem:    (data)          => request({ route: 'menu', action: 'add' }, 'POST', data),
    deleteItem: (id)            => request({ route: 'menu', action: 'delete' }, 'DELETE', { id }),

    // Orders
    placeOrder:    (items, total) => request({ route: 'orders', action: 'place' }, 'POST', { items, total }),
    getMyOrders:   ()             => request({ route: 'orders', action: 'my' }),
    getAllOrders:   ()             => request({ route: 'orders', action: 'list' }),
    updateStatus:  (id, status)   => request({ route: 'orders', action: 'update-status' }, 'PUT', { id, status }),
    getStats:      ()             => request({ route: 'orders', action: 'stats' }),
  };
})();


// ============================================================
// OBSERVER PATTERN — EventBus
// Decouples modules: cart doesn't directly call admin, etc.
// ============================================================
const EventBus = (() => {
  const listeners = {};
  return {
    on(event, fn) {
      (listeners[event] = listeners[event] || []).push(fn);
    },
    off(event, fn) {
      if (listeners[event]) listeners[event] = listeners[event].filter(f => f !== fn);
    },
    emit(event, data) {
      (listeners[event] || []).forEach(fn => fn(data));
    },
  };
})();


// ============================================================
// MODULE PATTERN — Toast Notifications
// ============================================================
const Toast = (() => {
  const el = document.getElementById('toast');
  let timer;
  function show(message, type = 'info', duration = 3000) {
    if (!el) return;
    el.textContent = message;
    el.className = `toast ${type} show`;
    clearTimeout(timer);
    timer = setTimeout(() => { el.classList.remove('show'); }, duration);
  }
  return {
    info:    m => show(m, 'info'),
    success: m => show(m, 'success'),
    error:   m => show(m, 'error'),
  };
})();


// ============================================================
// MODULE PATTERN — AuthModule
// Handles login, logout, register, session check
// ============================================================
const AuthModule = (() => {
  let currentUser = null;

  function showOverlay()  { document.getElementById('auth-overlay').classList.add('active'); }
  function hideOverlay()  { document.getElementById('auth-overlay').classList.remove('active'); }
  function showApp()      { document.getElementById('app').classList.remove('hidden'); }
  function hideApp()      { document.getElementById('app').classList.add('hidden'); }

  function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
  }

  function clearError() {
    document.getElementById('auth-error').classList.add('hidden');
  }

  function applyUser(user) {
    currentUser = user;
    document.getElementById('user-chip').textContent =
      `${user.role === 'admin' ? '⚙️' : '👤'} ${user.name || user.username}`;

    const adminBtn = document.querySelector('.admin-only');
    if (adminBtn) {
      if (user.role === 'admin') adminBtn.classList.remove('hidden');
      else adminBtn.classList.add('hidden');
    }
    hideOverlay();
    showApp();
    EventBus.emit('auth:login', user);
  }

  async function login() {
    clearError();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    if (!username || !password) { showError('Please enter username and password.'); return; }

    const btn = document.getElementById('btn-login');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await API.login(username, password);
      applyUser(data.user);
    } catch (err) {
      showError(err.message || 'Login failed. Check your credentials.');
    } finally {
      btn.textContent = 'Sign In';
      btn.disabled = false;
    }
  }

  async function register() {
    clearError();
    const name     = document.getElementById('reg-name').value.trim();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!name || !username || !password) { showError('All fields are required.'); return; }
    if (password.length < 4) { showError('Password must be at least 4 characters.'); return; }

    const btn = document.getElementById('btn-register');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const data = await API.register(name, username, password);
      applyUser(data.user);
      Toast.success('Account created! Welcome 🎉');
    } catch (err) {
      showError(err.message || 'Registration failed.');
    } finally {
      btn.textContent = 'Create Account';
      btn.disabled = false;
    }
  }

  async function logout() {
    try { await API.logout(); } catch {}
    currentUser = null;
    hideApp();
    showOverlay();
    EventBus.emit('auth:logout');
    CartModule.clear();
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  }

  async function checkSession() {
    try {
      const data = await API.me();
      if (data.user) applyUser(data.user);
      else showOverlay();
    } catch {
      showOverlay();
    }
  }

  function bindUI() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        const target = document.getElementById(`tab-${btn.dataset.tab}`);
        if (target) target.classList.add('active');
        clearError();
      });
    });

    // Login — button click
    document.getElementById('btn-login').addEventListener('click', login);

    // Login — Enter key
    ['login-username', 'login-password'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') login();
      });
    });

    // Register — button click
    document.getElementById('btn-register').addEventListener('click', register);

    // Register — Enter key
    ['reg-name', 'reg-username', 'reg-password'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') register();
      });
    });

    // Sign out
    document.getElementById('btn-signout').addEventListener('click', logout);
  }

  return {
    init() { bindUI(); checkSession(); },
    getUser() { return currentUser; },
    isAdmin() { return currentUser?.role === 'admin'; },
  };
})();


// ============================================================
// MODULE PATTERN — CartModule
// ============================================================
const CartModule = (() => {
  let items = []; // [{ id, name, price, emoji, qty }]

  function getTotal() {
    return items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function updateBadge() {
    const total = items.reduce((s, i) => s + i.qty, 0);
    document.getElementById('cart-count').textContent = total;
  }

  function render() {
    const container = document.getElementById('cart-items');
    const totalEl   = document.getElementById('cart-total');

    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <span>🛒</span>
          <p>Your cart is empty</p>
        </div>`;
      totalEl.textContent = 'ETB 0.00';
      return;
    }

    container.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <span class="cart-item-emoji">${item.emoji}</span>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">ETB ${(item.price * item.qty).toFixed(2)}</div>
        </div>
        <div class="cart-item-qty">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
      </div>
    `).join('');

    totalEl.textContent = `ETB ${getTotal().toFixed(2)}`;
    updateBadge();
  }

  function openCart()  {
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-backdrop').classList.add('open');
  }
  function closeCart() {
    document.getElementById('cart-sidebar').classList.remove('open');
    document.getElementById('cart-backdrop').classList.remove('open');
  }

  function addItem(item) {
    const existing = items.find(i => i.id === item.id);
    if (existing) existing.qty++;
    else items.push({ ...item, qty: 1 });
    render();
    Toast.success(`${item.name} added to cart!`);
  }

  function clear() {
    items = [];
    render();
    updateBadge();
  }

  async function checkout() {
    if (items.length === 0) { Toast.error('Cart is empty!'); return; }

    const btn = document.getElementById('btn-checkout');
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;

    try {
      const payload = items.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty }));
      await API.placeOrder(payload, getTotal());
      Toast.success('Order placed successfully! 🎉');
      clear();
      closeCart();
      EventBus.emit('order:placed');
    } catch (err) {
      Toast.error(err.message || 'Could not place order.');
    } finally {
      btn.textContent = 'Place Order';
      btn.disabled = false;
    }
  }

  function bindUI() {
    document.getElementById('cart-toggle').addEventListener('click', openCart);
    document.getElementById('cart-close').addEventListener('click', closeCart);
    document.getElementById('cart-backdrop').addEventListener('click', closeCart);
    document.getElementById('btn-checkout').addEventListener('click', checkout);

    document.getElementById('cart-items').addEventListener('click', e => {
      const btn = e.target.closest('.qty-btn');
      if (!btn) return;
      const id     = parseInt(btn.dataset.id);
      const action = btn.dataset.action;
      const item   = items.find(i => i.id === id);
      if (!item) return;
      if (action === 'inc') item.qty++;
      else if (action === 'dec') {
        item.qty--;
        if (item.qty <= 0) items = items.filter(i => i.id !== id);
      }
      render();
    });
  }

  return {
    init() { bindUI(); render(); },
    addItem,
    clear,
    getItems: () => items,
  };
})();


// ============================================================
// MODULE PATTERN — MenuModule
// ============================================================
const MenuModule = (() => {
  let allItems = [];
  const FOOD_EMOJIS = ['🍕','🍔','🌮','🍜','🥗','🍱','🍛','🥘','🌯','🍣','🥙','🍲','🍗','🥩','🍝'];

  function emoji(name) {
    // Deterministic emoji from item name
    let hash = 0;
    for (let c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xfffff;
    return FOOD_EMOJIS[hash % FOOD_EMOJIS.length];
  }

  function renderCard(item) {
    const em = emoji(item.name);
    return `
      <div class="menu-card">
        <div class="menu-card-img">
          ${item.image_url
            ? `<img src="${item.image_url}" alt="${item.name}" onerror="this.parentElement.textContent='${em}'" />`
            : em
          }
        </div>
        <div class="menu-card-body">
          <div class="menu-card-name">${item.name}</div>
          <div class="menu-card-cat">${item.category || 'Main'}</div>
          <div class="menu-card-footer">
            <span class="menu-card-price">ETB ${parseFloat(item.price).toFixed(2)}</span>
            <button class="btn-add-cart"
              data-id="${item.id}"
              data-name="${item.name}"
              data-price="${item.price}"
              data-emoji="${em}">
              + Add
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderGrid(items) {
    const grid = document.getElementById('menu-grid');
    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state"><span class="es-icon">🍽️</span><p>No items found</p></div>`;
      return;
    }
    grid.innerHTML = items.map(renderCard).join('');
  }

  async function load() {
    document.getElementById('menu-grid').innerHTML = `
      <div class="skeleton-grid">
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
        <div class="skeleton-card"></div><div class="skeleton-card"></div>
      </div>`;
    try {
      const data = await API.getMenu();
      allItems = data.items || [];
      renderGrid(allItems);
    } catch (err) {
      document.getElementById('menu-grid').innerHTML =
        `<div class="empty-state"><span class="es-icon">⚠️</span><p>${err.message}</p></div>`;
    }
  }

  function bindUI() {
    // Add to cart delegation
    document.getElementById('menu-grid').addEventListener('click', e => {
      const btn = e.target.closest('.btn-add-cart');
      if (!btn) return;
      CartModule.addItem({
        id:    parseInt(btn.dataset.id),
        name:  btn.dataset.name,
        price: parseFloat(btn.dataset.price),
        emoji: btn.dataset.emoji,
      });
    });

    // Search
    document.getElementById('menu-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtered = allItems.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
      renderGrid(filtered);
    });
  }

  return {
    init() { bindUI(); },
    load,
    getAll: () => allItems,
    emoji,
  };
})();


// ============================================================
// MODULE PATTERN — OrderModule
// ============================================================
const OrderModule = (() => {
  function statusBadge(status) {
    return `<span class="order-status-badge status-${status}">${status}</span>`;
  }

  function renderOrderCard(order, isAdmin = false) {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch {}
    const summary = items.map(i => `${i.qty}× ${i.name}`).join(', ') || 'Unknown items';

    const adminControls = isAdmin ? `
      <div>
        ${statusBadge(order.status)}
        <select class="admin-status-select" data-id="${order.id}">
          ${['pending','confirmed','preparing','ready','delivered','cancelled']
            .map(s => `<option value="${s}" ${order.status===s?'selected':''}>${s}</option>`)
            .join('')}
        </select>
      </div>` : statusBadge(order.status);

    return `
      <div class="order-card">
        <div class="order-meta">
          <div class="order-id">Order #${order.id} ${isAdmin ? `· <b>${order.username || 'User'}</b>` : ''}</div>
          <div class="order-items">${summary}</div>
          <div class="order-total">ETB ${parseFloat(order.total).toFixed(2)}</div>
          <div class="order-date">${new Date(order.created_at).toLocaleString()}</div>
        </div>
        ${adminControls}
      </div>`;
  }

  async function loadMyOrders() {
    const list = document.getElementById('orders-list');
    list.innerHTML = `<div class="empty-state"><span class="spinner"></span></div>`;
    try {
      const data = await API.getMyOrders();
      const orders = data.orders || [];
      if (orders.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="es-icon">📋</span><p>No orders yet</p></div>`;
      } else {
        list.innerHTML = orders.map(o => renderOrderCard(o)).join('');
      }
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><span class="es-icon">⚠️</span><p>${err.message}</p></div>`;
    }
  }

  async function loadAllOrders() {
    const list = document.getElementById('admin-orders-list');
    list.innerHTML = `<div class="empty-state"><span class="spinner"></span></div>`;
    try {
      const data = await API.getAllOrders();
      const orders = data.orders || [];
      if (orders.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="es-icon">📋</span><p>No orders yet</p></div>`;
      } else {
        list.innerHTML = orders.map(o => renderOrderCard(o, true)).join('');
        bindStatusSelects();
      }
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><span class="es-icon">⚠️</span><p>${err.message}</p></div>`;
    }
  }

  function bindStatusSelects() {
    document.querySelectorAll('.admin-status-select').forEach(sel => {
      sel.addEventListener('change', async e => {
        const id     = parseInt(e.target.dataset.id);
        const status = e.target.value;
        try {
          await API.updateStatus(id, status);
          Toast.success(`Order #${id} → ${status}`);
          // Update badge in DOM
          const badge = e.target.previousElementSibling;
          if (badge) { badge.className = `order-status-badge status-${status}`; badge.textContent = status; }
        } catch (err) {
          Toast.error(err.message);
        }
      });
    });
  }

  return {
    loadMyOrders,
    loadAllOrders,
  };
})();


// ============================================================
// MODULE PATTERN — AdminModule
// ============================================================
const AdminModule = (() => {
  async function loadMenuItems() {
    const list = document.getElementById('admin-menu-list');
    list.innerHTML = `<div class="empty-state"><span class="spinner"></span></div>`;
    try {
      const data = await API.getMenu();
      const items = data.items || [];
      if (items.length === 0) {
        list.innerHTML = `<div class="empty-state"><span class="es-icon">🍽️</span><p>No items yet</p></div>`;
        return;
      }
      list.innerHTML = items.map(item => {
        const em = MenuModule.emoji(item.name);
        return `
          <div class="admin-menu-item">
            <span class="item-emoji">${em}</span>
            <div class="item-info">
              <div class="item-name">${item.name}</div>
              <div class="item-meta">${item.category || 'Uncategorized'}</div>
            </div>
            <span class="item-price">ETB ${parseFloat(item.price).toFixed(2)}</span>
            <button class="btn-danger" data-id="${item.id}">Delete</button>
          </div>`;
      }).join('');

      list.querySelectorAll('.btn-danger').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.dataset.id);
          if (!confirm('Delete this item?')) return;
          try {
            await API.deleteItem(id);
            Toast.success('Item deleted');
            loadMenuItems();
            MenuModule.load();
          } catch (err) { Toast.error(err.message); }
        });
      });
    } catch (err) {
      list.innerHTML = `<div class="empty-state"><span class="es-icon">⚠️</span><p>${err.message}</p></div>`;
    }
  }

  async function loadStats() {
    const el = document.getElementById('stats-content');
    el.innerHTML = `<div class="empty-state"><span class="spinner"></span></div>`;
    try {
      const data = await API.getStats();
      const s = data.stats || {};
      el.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Total Revenue</div>
          <div class="stat-value">ETB ${parseFloat(s.total_revenue || 0).toFixed(0)}</div>
          <div class="stat-sub">all time</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Total Orders</div>
          <div class="stat-value">${s.total_orders || 0}</div>
          <div class="stat-sub">orders placed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Delivered</div>
          <div class="stat-value">${s.delivered || 0}</div>
          <div class="stat-sub">completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Pending</div>
          <div class="stat-value">${s.pending || 0}</div>
          <div class="stat-sub">awaiting action</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Avg. Order</div>
          <div class="stat-value">ETB ${s.total_orders > 0 ? (s.total_revenue / s.total_orders).toFixed(0) : 0}</div>
          <div class="stat-sub">per order</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Menu Items</div>
          <div class="stat-value">${s.menu_items || 0}</div>
          <div class="stat-sub">available</div>
        </div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="empty-state"><span class="es-icon">⚠️</span><p>${err.message}</p></div>`;
    }
  }

  function bindUI() {
    // Admin sub-tabs
    document.querySelectorAll('.atab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.atab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.atab-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById(`atab-${tab.dataset.atab}`);
        if (panel) panel.classList.add('active');

        if (tab.dataset.atab === 'all-orders') OrderModule.loadAllOrders();
        if (tab.dataset.atab === 'stats') loadStats();
        if (tab.dataset.atab === 'manage-menu') loadMenuItems();
      });
    });

    // Add item
    document.getElementById('btn-add-item').addEventListener('click', async () => {
      const name     = document.getElementById('item-name').value.trim();
      const price    = parseFloat(document.getElementById('item-price').value);
      const category = document.getElementById('item-category').value.trim();
      const image    = document.getElementById('item-image').value.trim();

      if (!name || isNaN(price) || price <= 0) {
        Toast.error('Name and valid price are required.');
        return;
      }
      try {
        await API.addItem({ name, price, category, image_url: image || null });
        Toast.success(`${name} added!`);
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        document.getElementById('item-category').value = '';
        document.getElementById('item-image').value = '';
        loadMenuItems();
        MenuModule.load();
      } catch (err) { Toast.error(err.message); }
    });
  }

  return {
    init() { bindUI(); },
    loadMenuItems,
    loadStats,
  };
})();


// ============================================================
// MODULE PATTERN — NavigationModule
// ============================================================
const NavigationModule = (() => {
  function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn[data-view]').forEach(b => b.classList.remove('active'));

    const view = document.getElementById(`view-${viewName}`);
    if (view) view.classList.add('active');

    const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
    if (btn) btn.classList.add('active');

    // Lazy-load data
    if (viewName === 'menu') MenuModule.load();
    if (viewName === 'orders') OrderModule.loadMyOrders();
    if (viewName === 'admin') AdminModule.loadMenuItems();
  }

  function bindUI() {
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });
  }

  return {
    init() { bindUI(); },
    switchView,
  };
})();


// ============================================================
// OBSERVER PATTERN — Wire up cross-module events
// ============================================================
EventBus.on('auth:login', user => {
  NavigationModule.switchView('menu');
});

EventBus.on('auth:logout', () => {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-menu').classList.add('active');
});

EventBus.on('order:placed', () => {
  // Automatically refresh orders view if visible
  const ordersView = document.getElementById('view-orders');
  if (ordersView && ordersView.classList.contains('active')) {
    OrderModule.loadMyOrders();
  }
});


// ============================================================
// BOOT — Initialize all modules
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  AuthModule.init();
  CartModule.init();
  MenuModule.init();
  AdminModule.init();
  NavigationModule.init();
});
