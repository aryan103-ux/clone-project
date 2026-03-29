async function renderHomePage() {
  const page = document.getElementById('page-home');
  page.innerHTML = `
    <div class="hero-banner">
      <h1>Welcome to <span>amazon</span></h1>
      <p>Millions of products. Free delivery. Prime deals.</p>
      <div class="hero-btns">
        <button class="btn-primary" onclick="navigate('products')">Shop Now</button>
        <button class="btn-secondary" onclick="navigate('deals')">Today's Deals</button>
      </div>
    </div>
    <div class="container">
      <h2 class="section-title">Shop by Category</h2>
      <div class="category-grid" id="home-categories"><div class="loading">⏳</div></div>
      <h2 class="section-title">Featured Products</h2>
      <div class="product-grid" id="home-products"><div class="loading">⏳</div></div>
    </div>`;

  try {
    const [catData, prodData] = await Promise.all([
      API.get('/products/categories/all'),
      API.get('/products?limit=8')
    ]);
    document.getElementById('home-categories').innerHTML = catData.categories.map(c => `
      <div class="category-card" onclick="navigate('products','${c.slug}')">
        <div class="icon">${c.icon}</div>
        <span>${c.name}</span>
      </div>`).join('');
    document.getElementById('home-products').innerHTML = prodData.products.map(productCard).join('');
  } catch (err) {
    document.getElementById('home-categories').innerHTML = '<p>Error loading categories</p>';
  }
}

async function renderOrdersPage() {
  const page = document.getElementById('page-orders');
  if (!currentUser) {
    page.innerHTML = `<div class="container"><div class="empty-state"><div class="emoji">🔒</div><h2>Sign in to view your orders</h2><br><button class="btn-primary" onclick="navigate('login')">Sign in</button></div></div>`;
    return;
  }
  page.innerHTML = '<div class="container"><div class="loading">⏳ Loading orders...</div></div>';
  try {
    const data = await API.get('/orders');
    const orders = data.orders;
    if (!orders.length) {
      page.innerHTML = `<div class="container"><div class="empty-state"><div class="emoji">📦</div><h2>No orders yet</h2><br><button class="btn-primary" onclick="navigate('home')">Start Shopping</button></div></div>`;
      return;
    }
    page.innerHTML = `<div class="container">
      <h1 class="section-title">Your Orders</h1>
      ${orders.map(o => `
        <div class="order-card">
          <div class="order-header">
            <div>
              <small>ORDER PLACED</small><br>
              <strong>${new Date(o.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'})}</strong>
            </div>
            <div><small>TOTAL</small><br><strong>₹${parseFloat(o.total_amount).toFixed(2)}</strong></div>
            <div><small>SHIP TO</small><br><strong>${o.shipping_address||'N/A'}</strong></div>
            <div class="order-status">● ${o.status.toUpperCase()}</div>
          </div>
          <div class="order-items-list">
            ${o.items.map(i => `
              <div class="order-item-row">
                <img src="${i.image_url||'https://via.placeholder.com/60x60/f8f8f8'}" alt="${i.name}"/>
                <div>
                  <div style="font-weight:600">${i.name}</div>
                  <div style="font-size:13px;color:var(--text-muted)">Qty: ${i.quantity} × ₹${parseFloat(i.price).toFixed(2)}</div>
                </div>
              </div>`).join('')}
          </div>
        </div>`).join('')}
    </div>`;
  } catch (err) { page.innerHTML = `<div class="container"><p>Error: ${err.message}</p></div>`; }
}

async function renderCheckoutPage() {
  const page = document.getElementById('page-checkout');
  if (!currentUser) { navigate('login'); return; }
  try {
    const data = await API.get('/cart');
    const items = data.items;
    if (!items.length) { navigate('cart'); return; }
    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    page.innerHTML = `
      <div class="container">
        <h1 class="section-title">Checkout</h1>
        <div class="checkout-layout">
          <div>
            <div class="checkout-section">
              <h3>1. Delivery Address</h3>
              <div class="form-group"><label>Full Name</label><input type="text" id="co-name" value="${currentUser.name}"/></div>
              <div class="form-group"><label>Address</label><textarea id="co-address" rows="3" placeholder="Street, City, State, PIN">${currentUser.address||''}</textarea></div>
              <div class="form-group"><label>Phone</label><input type="tel" id="co-phone" value="${currentUser.phone||''}"/></div>
            </div>
            <div class="checkout-section">
              <h3>2. Payment Method</h3>
              <div class="payment-option selected" id="pay-cod" onclick="selectPayment('COD')">
                <span style="font-size:20px">💵</span>
                <div><strong>Cash on Delivery</strong><br><small>Pay when your order arrives</small></div>
              </div>
              <div class="payment-option" id="pay-upi" onclick="selectPayment('UPI')">
                <span style="font-size:20px">📱</span>
                <div><strong>UPI</strong><br><small>PhonePe, GPay, Paytm</small></div>
              </div>
              <div class="payment-option" id="pay-card" onclick="selectPayment('Card')">
                <span style="font-size:20px">💳</span>
                <div><strong>Credit / Debit Card</strong><br><small>Visa, Mastercard, RuPay</small></div>
              </div>
            </div>
          </div>
          <div class="cart-summary" style="position:sticky;top:80px">
            <h3>Order Summary</h3>
            ${items.map(i=>`<div class="summary-row"><span>${i.name.substring(0,25)}... ×${i.quantity}</span><span>₹${(parseFloat(i.price)*i.quantity).toFixed(2)}</span></div>`).join('')}
            <div class="summary-row" style="border-top:1px solid #e8e8e8;padding-top:8px;margin-top:4px"><span>Shipping:</span><span style="color:var(--green)">FREE</span></div>
            <div class="summary-row summary-total"><strong>Total:</strong><strong>₹${subtotal.toFixed(2)}</strong></div>
            <button class="btn-checkout" onclick="placeOrder()">Place Order</button>
            <p style="font-size:11px;color:var(--text-muted);margin-top:10px;text-align:center">By placing your order, you agree to our Terms & Conditions</p>
          </div>
        </div>
      </div>`;
  } catch (err) { page.innerHTML = `<div class="container"><p>Error: ${err.message}</p></div>`; }
}

let selectedPayment = 'COD';
function selectPayment(method) {
  selectedPayment = method;
  document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
  document.getElementById('pay-'+method.toLowerCase())?.classList.add('selected');
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

async function renderProfilePage(tab = 'info') {
  const page = document.getElementById('page-profile');
  if (!currentUser) { navigate('login'); return; }
  const initial = currentUser.name[0].toUpperCase();
  page.innerHTML = `
    <div class="container">
      <h1 class="section-title">Your Account</h1>
      <div class="profile-layout">
        <div class="profile-sidebar">
          <div class="avatar">${initial}</div>
          <h3>${currentUser.name}</h3>
          <a class="${tab==='info'?'active':''}" onclick="renderProfilePage('info')">📋 Personal Info</a>
          <a class="${tab==='password'?'active':''}" onclick="renderProfilePage('password')">🔒 Change Password</a>
          <a class="${tab==='wishlist'?'active':''}" onclick="renderProfilePage('wishlist')">♡ Wishlist</a>
          <a onclick="navigate('orders')">📦 Orders</a>
        </div>
        <div class="profile-content" id="profile-tab-content">
          ${tab==='info' ? renderProfileInfo() : tab==='password' ? renderPasswordForm() : '<div class="loading">⏳ Loading wishlist...</div>'}
        </div>
      </div>
    </div>`;
  if (tab === 'wishlist') loadWishlist();
}

function renderProfileInfo() {
  return `
    <h2 style="margin-bottom:20px">Personal Information</h2>
    <div class="form-group"><label>Full Name</label><input type="text" id="pf-name" value="${currentUser.name}"/></div>
    <div class="form-group"><label>Email</label><input type="email" value="${currentUser.email}" disabled style="background:#f5f5f5;cursor:not-allowed"/></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="pf-phone" value="${currentUser.phone||''}"/></div>
    <div class="form-group"><label>Address</label><textarea id="pf-address" rows="3">${currentUser.address||''}</textarea></div>
    <button class="btn-form" style="width:auto;padding:10px 28px" onclick="saveProfile()">Save Changes</button>`;
}
function renderPasswordForm() {
  return `
    <h2 style="margin-bottom:20px">Change Password</h2>
    <div class="form-group"><label>Current Password</label><input type="password" id="pw-current"/></div>
    <div class="form-group"><label>New Password</label><input type="password" id="pw-new"/></div>
    <div class="form-group"><label>Confirm New Password</label><input type="password" id="pw-confirm"/></div>
    <button class="btn-form" style="width:auto;padding:10px 28px" onclick="savePassword()">Update Password</button>`;
}

async function saveProfile() {
  const name = document.getElementById('pf-name').value.trim();
  const phone = document.getElementById('pf-phone').value.trim();
  const address = document.getElementById('pf-address').value.trim();
  if (!name) return showToast('Name cannot be empty', 'error');
  try {
    const data = await API.put('/user/profile', { name, phone, address });
    currentUser = { ...currentUser, ...data.user };
    updateHeader();
    showToast('Profile updated successfully', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}
async function savePassword() {
  const cp = document.getElementById('pw-current').value;
  const np = document.getElementById('pw-new').value;
  const nc = document.getElementById('pw-confirm').value;
  if (np !== nc) return showToast('New passwords do not match', 'error');
  if (np.length < 6) return showToast('Password must be ≥ 6 characters', 'error');
  try { await API.put('/user/password', { current_password: cp, new_password: np }); showToast('Password updated!', 'success'); } catch (err) { showToast(err.message, 'error'); }
}
async function loadWishlist() {
  try {
    const data = await API.get('/user/wishlist');
    const el = document.getElementById('profile-tab-content');
    el.innerHTML = `<h2 style="margin-bottom:20px">Your Wish List</h2>
      ${data.wishlist.length ? `<div class="product-grid">${data.wishlist.map(p => productCard(p)).join('')}</div>` : '<div class="empty-state"><div class="emoji">♡</div><p>Your wishlist is empty</p></div>'}`;
  } catch {}
}

function renderDealsPage() {
  document.getElementById('page-deals').innerHTML = `
    <div class="container">
      <div class="deals-banner">
        <h2>🔥 Today's Deals</h2>
        <p>Limited time offers — grab them before they're gone!</p>
      </div>
      <div class="product-grid" id="deals-grid"><div class="loading">⏳</div></div>
    </div>`;
  API.get('/products?sort=rating&limit=8').then(data => {
    document.getElementById('deals-grid').innerHTML = data.products.map(p => {
      const discount = p.original_price ? Math.round((1-p.price/p.original_price)*100) : 0;
      return discount > 0 ? `<div class="product-card" style="position:relative">
        <div class="deal-badge" style="position:absolute;top:8px;left:8px;z-index:1">${discount}% OFF</div>
        ${productCard(p).replace('<div class="product-card">', '')}` : productCard(p);
    }).join('');
  }).catch(() => { document.getElementById('deals-grid').innerHTML = '<p>Error loading deals</p>'; });
}
