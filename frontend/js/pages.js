/* ── Home ──────────────────────────────────────────── */
async function renderHomePage() {
  const page = document.getElementById('page-home');
  page.innerHTML = `
    <!-- Hero -->
    <section class="hero" aria-label="Hero banner">
      <div class="hero-aurora" aria-hidden="true"></div>
      <div class="hero-grid"></div>
      <div class="hero-content">
        <div class="hero-eyebrow hero-reveal" style="--hr:0">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          Free Delivery on Prime Orders
        </div>
        <h1 class="hero-reveal" style="--hr:1">Shop <em>everything</em> you need,<br/>delivered to your door</h1>
        <p class="hero-sub hero-reveal" style="--hr:2">Millions of products. Competitive prices. Trusted sellers.<br/>All in one place.</p>
        <div class="hero-btns hero-reveal" style="--hr:3">
          <button class="btn-hero-primary" onclick="navigate('products')">Start Shopping</button>
          <button class="btn-hero-secondary" onclick="navigate('deals')">Today's Deals</button>
        </div>
        <div class="hero-stats hero-reveal" style="--hr:4">
          <div class="stat-item"><span class="stat-num">12M+</span><span class="stat-label">Products</span></div>
          <div class="stat-item"><span class="stat-num">2-Day</span><span class="stat-label">Prime Delivery</span></div>
          <div class="stat-item"><span class="stat-num">4.8★</span><span class="stat-label">Avg Rating</span></div>
          <div class="stat-item"><span class="stat-num">100%</span><span class="stat-label">Secure Checkout</span></div>
        </div>
      </div>
    </section>

    <!-- Main content -->
    <div class="container">
      <!-- Categories -->
      <div class="section-header">
        <h2 class="section-title">Shop by Category</h2>
        <a class="section-link" onclick="navigate('products')">See all categories</a>
      </div>
      <div class="category-grid" id="home-categories">
        <div class="loading-spinner"><div class="spinner"></div></div>
      </div>

      <!-- Featured -->
      <div class="section-header" style="margin-top:32px">
        <h2 class="section-title">Featured Products</h2>
        <a class="section-link" onclick="navigate('products')">See all products</a>
      </div>
      <div class="product-grid" id="home-products">
        <div class="loading-spinner"><div class="spinner"></div></div>
      </div>

      <!-- Deals teaser -->
      <div style="margin-top:40px;background:linear-gradient(135deg,#c0392b,#e74c3c);border-radius:12px;padding:28px 32px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;color:#fff">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.08em;opacity:.8;margin-bottom:6px">Limited Time</div>
          <div style="font-size:22px;font-weight:700;font-family:var(--font-display)">Today's Deals 🔥</div>
          <div style="font-size:14px;opacity:.85;margin-top:4px">Grab them before they're gone!</div>
        </div>
        <button class="btn-hero-primary" onclick="navigate('deals')" style="flex-shrink:0">View All Deals</button>
      </div>
    </div>`;

  try {
    const [catData, prodData] = await Promise.all([
      API.get('/products/categories/all'),
      API.get('/products?limit=8'),
    ]);

    document.getElementById('home-categories').innerHTML =
      catData.categories.map(c => `
        <div class="category-card" onclick="navigate('products','${c.slug}')" role="button" tabindex="0">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-name">${c.name}</span>
        </div>`).join('');

    document.getElementById('home-products').innerHTML =
      prodData.products.map((p, i) => productCard(p, i)).join('');
  } catch {
    document.getElementById('home-categories').innerHTML = '<p style="color:var(--muted)">Could not load categories.</p>';
  }
}

/* ── Orders ─────────────────────────────────────────── */
async function renderOrdersPage() {
  const page = document.getElementById('page-orders');

  if (!currentUser) {
    page.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <span class="empty-icon">🔒</span>
          <h2>Sign in to view your orders</h2>
          <button class="btn-hero-primary" style="margin-top:8px" onclick="navigate('login')">Sign in</button>
        </div>
      </div>`;
    return;
  }

  page.innerHTML = '<div class="container"><div class="loading-spinner"><div class="spinner"></div>Loading your orders…</div></div>';

  try {
    const data   = await API.get('/orders');
    const orders = data.orders;

    if (!orders.length) {
      page.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <span class="empty-icon">📦</span>
            <h2>No orders yet</h2>
            <p>Your orders will appear here once you've made a purchase.</p>
            <button class="btn-hero-primary" onclick="navigate('home')">Start Shopping</button>
          </div>
        </div>`;
      return;
    }

    const statusClass = s => {
      const map = { pending:'status-pending', confirmed:'status-confirmed', shipped:'status-shipped', delivered:'status-delivered', cancelled:'status-cancelled' };
      return map[s] || 'status-pending';
    };

    page.innerHTML = `
      <div class="container">
        <div class="orders-header">
          <h1>Your Orders</h1>
          <p style="color:var(--muted);margin-top:4px">${orders.length} order${orders.length !== 1 ? 's' : ''} placed</p>
        </div>
        ${orders.map(o => `
          <div class="order-card">
            <div class="order-header-bar">
              <div class="order-meta-item">
                <span class="order-meta-label">Order Placed</span>
                <span class="order-meta-val">${new Date(o.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}</span>
              </div>
              <div class="order-meta-item">
                <span class="order-meta-label">Total</span>
                <span class="order-meta-val">₹${parseFloat(o.total_amount).toFixed(2)}</span>
              </div>
              <div class="order-meta-item">
                <span class="order-meta-label">Ship To</span>
                <span class="order-meta-val" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.shipping_address || 'N/A'}</span>
              </div>
              <span class="order-status-badge ${statusClass(o.status)}">● ${o.status.toUpperCase()}</span>
            </div>
            <div class="order-items-body">
              ${o.items.map(i => `
                <div class="order-item-row">
                  <div class="order-item-img">
                    <img src="${getProductImageUrl({ ...i, id: i.product_id })}" alt="${i.name}" loading="lazy" decoding="async" onerror="${productImageOnErrorAttr(i.product_id)}"/>
                  </div>
                  <div>
                    <div class="order-item-name">${i.name}</div>
                    <div class="order-item-sub">Qty: ${i.quantity} × ₹${parseFloat(i.price).toFixed(2)}</div>
                  </div>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  } catch (err) {
    page.innerHTML = `<div class="container"><div class="empty-state"><p>Error loading orders: ${err.message}</p></div></div>`;
  }
}

/* ── Checkout ───────────────────────────────────────── */
async function renderCheckoutPage() {
  const page = document.getElementById('page-checkout');
  if (!currentUser) { navigate('login'); return; }

  try {
    const data  = await API.get('/cart');
    const items = data.items;
    if (!items.length) { navigate('cart'); return; }

    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

    page.innerHTML = `
      <div class="container">
        <h1 class="section-title" style="margin-bottom:20px">Checkout</h1>
        <div class="checkout-layout">
          <div>
            <!-- Address -->
            <div class="checkout-section">
              <h3><span class="checkout-step">1</span> Delivery Address</h3>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" id="co-name" value="${currentUser.name}"/>
              </div>
              <div class="form-group">
                <label>Address</label>
                <textarea id="co-address" rows="3" placeholder="Street, City, State, PIN">${currentUser.address || ''}</textarea>
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="tel" id="co-phone" value="${currentUser.phone || ''}"/>
              </div>
            </div>

            <!-- Payment -->
            <div class="checkout-section">
              <h3><span class="checkout-step">2</span> Payment Method</h3>
              <div class="payment-option selected" id="pay-cod" onclick="selectPayment('COD')">
                <span class="payment-option-icon">💵</span>
                <div class="payment-option-label">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </div>
                <div class="payment-radio"></div>
              </div>
              <div class="payment-option" id="pay-upi" onclick="selectPayment('UPI')">
                <span class="payment-option-icon">📱</span>
                <div class="payment-option-label">
                  <strong>UPI</strong>
                  <small>PhonePe, Google Pay, Paytm</small>
                </div>
                <div class="payment-radio"></div>
              </div>
              <div class="payment-option" id="pay-card" onclick="selectPayment('Card')">
                <span class="payment-option-icon">💳</span>
                <div class="payment-option-label">
                  <strong>Credit / Debit Card</strong>
                  <small>Visa, Mastercard, RuPay</small>
                </div>
                <div class="payment-radio"></div>
              </div>
            </div>
          </div>

          <!-- Summary -->
          <div class="cart-summary" style="position:sticky;top:80px">
            <h3 style="font-family:var(--font-display);font-size:18px;margin-bottom:16px">Order Summary</h3>
            ${items.map(i => `
              <div class="summary-row" style="font-size:13px">
                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px">${i.name} ×${i.quantity}</span>
                <span style="flex-shrink:0">₹${(parseFloat(i.price) * i.quantity).toFixed(2)}</span>
              </div>`).join('')}
            <div class="summary-row" style="border-top:1px solid var(--subtle);padding-top:10px;margin-top:6px">
              <span>Delivery:</span>
              <span style="color:var(--green);font-weight:600">FREE</span>
            </div>
            <div class="summary-row summary-total">
              <strong>Total:</strong>
              <strong>₹${subtotal.toFixed(2)}</strong>
            </div>
            <button class="btn-place-order" onclick="placeOrder()">Place Your Order</button>
            <p style="font-size:11px;color:var(--muted);margin-top:12px;text-align:center;line-height:1.5">
              By placing your order you agree to our<br/>
              <a style="color:var(--teal)">Terms &amp; Conditions</a> and <a style="color:var(--teal)">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>`;
  } catch (err) {
    page.innerHTML = `<div class="container"><div class="empty-state"><p>Error: ${err.message}</p></div></div>`;
  }
}

let selectedPayment = 'COD';
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('pay-' + method.toLowerCase())?.classList.add('selected');
}

async function placeOrder() {
  const address = document.getElementById('co-address')?.value.trim();
  if (!address) return showToast('Please enter a delivery address', 'error');
  try {
    const data = await API.post('/orders', { shipping_address: address, payment_method: selectedPayment });
    document.getElementById('cart-count').textContent = 0;
    showToast(data.message, 'success');
    navigate('orders');
  } catch (err) { showToast(err.message, 'error'); }
}

/* ── Profile ─────────────────────────────────────────── */
async function renderProfilePage(tab = 'info') {
  const page = document.getElementById('page-profile');
  if (!currentUser) { navigate('login'); return; }

  const initial = currentUser.name[0].toUpperCase();

  page.innerHTML = `
    <div class="container">
      <h1 class="section-title" style="margin-bottom:22px">Your Account</h1>
      <div class="profile-layout">
        <aside class="profile-sidebar">
          <div class="profile-avatar">${initial}</div>
          <div class="profile-name">${currentUser.name}</div>
          <a class="profile-nav-item ${tab === 'info' ? 'active' : ''}" onclick="renderProfilePage('info')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Personal Info
          </a>
          <a class="profile-nav-item ${tab === 'password' ? 'active' : ''}" onclick="renderProfilePage('password')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Change Password
          </a>
          <a class="profile-nav-item ${tab === 'wishlist' ? 'active' : ''}" onclick="renderProfilePage('wishlist')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            Wish List
          </a>
          <a class="profile-nav-item" onclick="navigate('orders')">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            Your Orders
          </a>
        </aside>
        <div class="profile-content" id="profile-tab-content">
          ${tab === 'info' ? renderProfileInfo() : tab === 'password' ? renderPasswordForm() : '<div class="loading-spinner"><div class="spinner"></div>Loading…</div>'}
        </div>
      </div>
    </div>`;

  if (tab === 'wishlist') loadWishlist();
}

function renderProfileInfo() {
  return `
    <h2>Personal Information</h2>
    <div class="form-group">
      <label>Full Name</label>
      <input type="text" id="pf-name" value="${currentUser.name}"/>
    </div>
    <div class="form-group">
      <label>Email</label>
      <input type="email" value="${currentUser.email}" disabled style="background:#f5f5f5;cursor:not-allowed;color:var(--muted)"/>
    </div>
    <div class="form-group">
      <label>Phone Number</label>
      <input type="tel" id="pf-phone" value="${currentUser.phone || ''}"/>
    </div>
    <div class="form-group">
      <label>Delivery Address</label>
      <textarea id="pf-address" rows="3">${currentUser.address || ''}</textarea>
    </div>
    <button class="btn-form" style="width:auto;padding:10px 32px;border-radius:6px" onclick="saveProfile()">Save Changes</button>`;
}

function renderPasswordForm() {
  return `
    <h2>Change Password</h2>
    <div class="form-group"><label>Current Password</label><input type="password" id="pw-current"/></div>
    <div class="form-group"><label>New Password</label><input type="password" id="pw-new" placeholder="At least 6 characters"/></div>
    <div class="form-group"><label>Confirm New Password</label><input type="password" id="pw-confirm"/></div>
    <button class="btn-form" style="width:auto;padding:10px 32px;border-radius:6px" onclick="savePassword()">Update Password</button>`;
}

async function saveProfile() {
  const name    = document.getElementById('pf-name').value.trim();
  const phone   = document.getElementById('pf-phone').value.trim();
  const address = document.getElementById('pf-address').value.trim();
  if (!name) return showToast('Name cannot be empty', 'error');
  try {
    const data = await API.put('/user/profile', { name, phone, address });
    currentUser = { ...currentUser, ...data.user };
    updateHeader();
    showToast('Profile updated successfully!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function savePassword() {
  const cp = document.getElementById('pw-current').value;
  const np = document.getElementById('pw-new').value;
  const nc = document.getElementById('pw-confirm').value;
  if (np !== nc)    return showToast('New passwords do not match', 'error');
  if (np.length < 6) return showToast('Password must be ≥ 6 characters', 'error');
  try {
    await API.put('/user/password', { current_password: cp, new_password: np });
    showToast('Password updated!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function loadWishlist() {
  try {
    const data = await API.get('/user/wishlist');
    document.getElementById('profile-tab-content').innerHTML = `
      <h2>Your Wish List</h2>
      ${data.wishlist.length
        ? `<div class="product-grid" style="margin-top:16px">${data.wishlist.map((p, i) => productCard(p, i)).join('')}</div>`
        : `<div class="empty-state" style="padding:40px 0">
             <span class="empty-icon">♡</span>
             <h2>Your Wish List is empty</h2>
             <p>Save items you love while you shop.</p>
           </div>`}`;
  } catch {}
}

/* ── Deals ───────────────────────────────────────────── */
function renderDealsPage() {
  document.getElementById('page-deals').innerHTML = `
    <div class="container">
      <div class="deals-hero">
        <h2>🔥 Today's Deals</h2>
        <p>Limited time offers — grab them before they're gone!</p>
      </div>
      <div class="product-grid" id="deals-grid">
        <div class="loading-spinner"><div class="spinner"></div>Loading deals…</div>
      </div>
    </div>`;

  API.get('/products?sort=rating&limit=8').then(data => {
    document.getElementById('deals-grid').innerHTML = data.products.map((p, i) => {
      const discount = p.original_price
        ? Math.round((1 - p.price / p.original_price) * 100)
        : 0;
      const card = productCard(p, i);
      if (discount > 0) {
        return card.replace(
          /<div class="product-card"[^>]*>/,
          m => `${m}<div class="deal-overlay-badge">${discount}% OFF</div>`
        );
      }
      return card;
    }).join('');
  }).catch(() => {
    document.getElementById('deals-grid').innerHTML = '<p style="color:var(--muted)">Could not load deals.</p>';
  });
}
