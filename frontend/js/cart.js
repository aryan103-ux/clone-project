async function updateCartCount() {
  if (!currentUser) { document.getElementById('cart-count').textContent = 0; return; }
  try {
    const data = await API.get('/cart');
    const total = data.items.reduce((s, i) => s + i.quantity, 0);
    document.getElementById('cart-count').textContent = total;
  } catch {}
}

async function addToCart(productId, qty = 1) {
  if (!currentUser) { showToast('Please sign in to add to cart', 'error'); navigate('login'); return; }
  try {
    const data = await API.post('/cart', { product_id: productId, quantity: qty });
    document.getElementById('cart-count').textContent = data.cartCount;
    showToast('Added to cart!', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function renderCartPage() {
  const page = document.getElementById('page-cart');

  if (!currentUser) {
    page.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <span class="empty-icon">🔒</span>
          <h2>Sign in to view your cart</h2>
          <p>You need to be signed in to view your shopping cart.</p>
          <button class="btn-hero-primary" onclick="navigate('login')">Sign in</button>
        </div>
      </div>`;
    return;
  }

  page.innerHTML = '<div class="container"><div class="loading-spinner"><div class="spinner"></div>Loading your cart…</div></div>';

  try {
    const data  = await API.get('/cart');
    const items = data.items;

    if (!items.length) {
      page.innerHTML = `
        <div class="container">
          <div class="empty-state">
            <span class="empty-icon">🛒</span>
            <h2>Your Amazon Cart is empty</h2>
            <p>Add items from your wishlist or continue shopping.</p>
            <button class="btn-hero-primary" onclick="navigate('home')">Continue Shopping</button>
          </div>
        </div>`;
      return;
    }

    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);

    page.innerHTML = `
      <div class="container">
        <div class="cart-layout">
          <div>
            <div class="cart-header">
              <h1>Shopping Cart</h1>
            </div>
            <div class="cart-items-list">
              ${items.map(item => `
                <div class="cart-item" id="cart-item-${item.id}">
                  <div class="cart-item-img" onclick="navigate('product','${item.product_id}')">
                    <img src="${getProductImageUrl({ ...item, id: item.product_id })}" alt="${item.name}" loading="lazy" decoding="async" onerror="${productImageOnErrorAttr(item.product_id)}"/>
                  </div>
                  <div class="cart-item-info">
                    <div class="cart-item-name" onclick="navigate('product','${item.product_id}')">${item.name}</div>
                    ${item.is_prime ? '<div class="prime-badge" style="font-size:11px"> prime</div>' : ''}
                    <div class="cart-in-stock">In Stock</div>
                    <div class="cart-controls">
                      <button class="cart-qty-btn" onclick="updateCartItem('${item.id}', ${item.quantity - 1})">−</button>
                      <span class="cart-qty-val">${item.quantity}</span>
                      <button class="cart-qty-btn" onclick="updateCartItem('${item.id}', ${item.quantity + 1})">+</button>
                      <span class="cart-sep">|</span>
                      <button class="btn-cart-remove" onclick="removeCartItem('${item.id}')">Delete</button>
                    </div>
                  </div>
                  <div class="cart-item-price">₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</div>
                </div>`).join('')}
            </div>
          </div>
          <div class="cart-summary">
            <div class="summary-free-tag">Your order qualifies for FREE Delivery.</div>
            <p style="font-size:12px;color:var(--muted);margin:6px 0 16px">Select this option at checkout.</p>
            <div class="summary-row">
              <span>Items (${totalQty}):</span>
              <span style="font-weight:600">₹${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
              <span>Delivery:</span>
              <span style="color:var(--green);font-weight:600">FREE</span>
            </div>
            <div class="summary-row summary-total">
              <strong>Order Total:</strong>
              <strong>₹${subtotal.toFixed(2)}</strong>
            </div>
            <button class="btn-checkout" onclick="navigate('checkout')">Proceed to Checkout</button>
            <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:10px">
              🔒 Transaction secured with SSL encryption
            </p>
          </div>
        </div>
      </div>`;
  } catch (err) {
    page.innerHTML = `<div class="container"><div class="empty-state"><p>Error loading cart: ${err.message}</p></div></div>`;
  }
}

async function updateCartItem(id, qty) {
  if (qty < 1) { removeCartItem(id); return; }
  try {
    await API.put('/cart/' + id, { quantity: qty });
    await renderCartPage();
    await updateCartCount();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeCartItem(id) {
  try {
    await API.delete('/cart/' + id);
    await renderCartPage();
    await updateCartCount();
    showToast('Item removed from cart');
  } catch (err) { showToast(err.message, 'error'); }
}
