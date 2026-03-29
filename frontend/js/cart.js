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
    showToast('Added to cart! 🛒', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

async function renderCartPage() {
  const page = document.getElementById('page-cart');
  page.innerHTML = '<div class="container"><div class="loading">⏳ Loading cart...</div></div>';
  if (!currentUser) {
    page.innerHTML = `<div class="container"><div class="empty-state"><div class="emoji">🔒</div><h2>Sign in to view your cart</h2><br><button class="btn-primary" onclick="navigate('login')">Sign in</button></div></div>`;
    return;
  }
  try {
    const data = await API.get('/cart');
    const items = data.items;
    if (!items.length) {
      page.innerHTML = `<div class="container"><div class="empty-state"><div class="emoji">🛒</div><h2>Your Amazon Cart is empty</h2><p>Add items from your wishlist or continue shopping.</p><br><button class="btn-primary" onclick="navigate('home')">Continue Shopping</button></div></div>`;
      return;
    }
    const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    page.innerHTML = `
      <div class="container">
        <div class="cart-layout">
          <div class="cart-items-container">
            <h1 class="section-title">Shopping Cart</h1>
            ${items.map(item => `
              <div class="cart-item" id="cart-item-${item.id}">
                <img src="${item.image_url||'https://via.placeholder.com/100x100/f8f8f8?text=No+Image'}" alt="${item.name}" onclick="navigate('product','${item.product_id}')" style="cursor:pointer"/>
                <div class="cart-item-info">
                  <div class="cart-item-name" onclick="navigate('product','${item.product_id}')" style="cursor:pointer">${item.name}</div>
                  ${item.is_prime ? '<div class="prime-badge">✓ prime</div>' : ''}
                  <div style="color:var(--green);font-size:12px">In Stock</div>
                  <div class="cart-item-controls">
                    <button onclick="updateCartItem('${item.id}', ${item.quantity - 1})">−</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItem('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="btn-remove" onclick="removeCartItem('${item.id}')">Delete</button>
                  </div>
                </div>
                <div class="cart-item-price">₹${(parseFloat(item.price)*item.quantity).toFixed(2)}</div>
              </div>`).join('')}
          </div>
          <div class="cart-summary">
            <h3>Order Summary</h3>
            <div class="summary-row"><span>Items (${totalQty}):</span><span>₹${subtotal.toFixed(2)}</span></div>
            <div class="summary-row"><span>Shipping:</span><span style="color:var(--green)">FREE</span></div>
            <div class="summary-row summary-total"><strong>Order Total:</strong><strong>₹${subtotal.toFixed(2)}</strong></div>
            <button class="btn-checkout" onclick="navigate('checkout')">Proceed to Checkout</button>
          </div>
        </div>
      </div>`;
  } catch (err) { page.innerHTML = `<div class="container"><div class="empty-state"><p>Error loading cart: ${err.message}</p></div></div>`; }
}

async function updateCartItem(id, qty) {
  if (qty < 1) { removeCartItem(id); return; }
  try { await API.put('/cart/' + id, { quantity: qty }); await renderCartPage(); await updateCartCount(); } catch (err) { showToast(err.message, 'error'); }
}
async function removeCartItem(id) {
  try { await API.delete('/cart/' + id); await renderCartPage(); await updateCartCount(); showToast('Item removed from cart'); } catch (err) { showToast(err.message, 'error'); }
}
