let allCategories = [];
let currentPage = 1;
let currentFilters = {};

async function loadCategories() {
  try {
    const data = await API.get('/products/categories/all');
    allCategories = data.categories;
    const sel = document.getElementById('search-category');
    allCategories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.slug; opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch {}
}

function renderStars(rating, count) {
  const full = Math.round(rating);
  const stars = Array.from({length:5}, (_,i) => `<span class="star ${i<full?'filled':''}">★</span>`).join('');
  return `<div class="product-rating"><div class="stars">${stars}</div> <span style="color:var(--text-muted)">(${count?.toLocaleString()||0})</span></div>`;
}

function productCard(p) {
  const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0;
  return `
    <div class="product-card">
      <img src="${p.image_url||'https://via.placeholder.com/300x300/f8f8f8?text=No+Image'}" alt="${p.name}" onclick="navigate('product','${p.id}')" style="cursor:pointer" loading="lazy"/>
      <div class="product-info">
        ${p.is_prime ? '<div class="prime-badge">✓ prime</div>' : ''}
        <div class="product-name" onclick="navigate('product','${p.id}')" style="cursor:pointer">${p.name}</div>
        ${renderStars(p.rating, p.rating_count)}
        <div class="product-price">
          <span class="price-now">₹${parseFloat(p.price).toFixed(2)}</span>
          ${p.original_price ? `<span class="price-old">₹${parseFloat(p.original_price).toFixed(2)}</span>` : ''}
          ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
        </div>
        <button class="btn-add-cart" onclick="addToCart('${p.id}')">Add to Cart</button>
      </div>
    </div>`;
}

async function renderProductsPage(category = '', query = '') {
  currentFilters = { category, q: query };
  currentPage = 1;
  await _fetchAndRenderProducts();
}

async function _fetchAndRenderProducts() {
  const page = document.getElementById('page-products');
  const { category, q } = currentFilters;
  const sort = document.getElementById('sort-select')?.value || 'created_at_desc';
  page.innerHTML = '<div class="container"><div class="loading">⏳ Loading products...</div></div>';
  try {
    const params = new URLSearchParams({ page: currentPage, limit: 12 });
    if (category) params.append('category', category);
    if (q) params.append('q', q);
    if (sort) params.append('sort', sort);
    const data = await API.get('/products?' + params);
    const { products, total } = data;
    const catLabel = allCategories.find(c=>c.slug===category)?.name || (q ? `"${q}"` : 'All Products');
    const totalPages = Math.ceil(total / 12);

    page.innerHTML = `
      <div class="container">
        <div class="breadcrumb">
          <a onclick="navigate('home')">Home</a> ›
          <span>${catLabel}</span>
        </div>
        <div class="filter-bar">
          <label>Sort by:</label>
          <select id="sort-select" onchange="_fetchAndRenderProducts()">
            <option value="created_at_desc">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Avg. Customer Review</option>
            <option value="newest">Newest Arrivals</option>
          </select>
          <span class="results-count">${total.toLocaleString()} results${q?' for <strong>"'+q+'"</strong>':''}</span>
        </div>
        ${products.length ? `<div class="product-grid">${products.map(productCard).join('')}</div>` : '<div class="empty-state"><div class="emoji">😔</div><h2>No products found</h2></div>'}
        ${totalPages > 1 ? renderPagination(totalPages) : ''}
      </div>`;
    if (sort) document.getElementById('sort-select').value = sort;
  } catch (err) { page.innerHTML = `<div class="container"><div class="empty-state"><p>Error: ${err.message}</p></div></div>`; }
}

function renderPagination(total) {
  const pages = Array.from({length:total}, (_,i)=>i+1);
  return `<div class="pagination">${pages.map(p=>`<button class="${p===currentPage?'active':''}" onclick="goToPage(${p})">${p}</button>`).join('')}</div>`;
}
async function goToPage(p) { currentPage = p; await _fetchAndRenderProducts(); window.scrollTo(0,0); }

async function renderProductDetail(id) {
  const page = document.getElementById('page-product-detail');
  page.innerHTML = '<div class="container"><div class="loading">⏳ Loading...</div></div>';
  try {
    const data = await API.get('/products/' + id);
    const p = data.product;
    const discount = p.original_price ? Math.round((1 - p.price/p.original_price)*100) : 0;
    page.innerHTML = `
      <div class="container">
        <div class="breadcrumb">
          <a onclick="navigate('home')">Home</a> ›
          <a onclick="navigate('products','${p.category_slug}')">${p.category_name}</a> ›
          <span>${p.name}</span>
        </div>
        <div class="product-detail">
          <div><img src="${p.image_url||'https://via.placeholder.com/440x440/f8f8f8?text=No+Image'}" alt="${p.name}"/></div>
          <div class="detail-right">
            <h1>${p.name}</h1>
            <div style="color:var(--text-muted);font-size:13px">Brand: <strong>${p.brand||'Generic'}</strong> | ${p.category_name}</div>
            ${renderStars(p.rating, p.rating_count)}
            <hr style="margin:12px 0;border:none;border-top:1px solid #e8e8e8"/>
            <div class="detail-price">
              ₹${parseFloat(p.price).toFixed(2)}
              ${p.original_price ? `<span class="price-old" style="font-size:16px;margin-left:8px">M.R.P: ₹${parseFloat(p.original_price).toFixed(2)}</span>` : ''}
              ${discount > 0 ? `<span class="discount-badge" style="font-size:14px;margin-left:8px">-${discount}%</span>` : ''}
            </div>
            ${p.is_prime ? '<div style="color:#007185;font-weight:700;font-size:14px">✓ prime  FREE Delivery</div>' : ''}
            <div class="detail-stock">${p.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}</div>
            <p class="detail-desc">${p.description || ''}</p>
            <div class="qty-selector">
              <label><strong>Qty:</strong></label>
              <button onclick="changeDetailQty(-1)">−</button>
              <span id="detail-qty">1</span>
              <button onclick="changeDetailQty(1)">+</button>
            </div>
            <button class="btn-buy-now" onclick="addToCartDetail('${p.id}')">Add to Cart</button>
            <button class="btn-primary" style="width:100%;padding:12px;border-radius:24px" onclick="addToCartDetail('${p.id}', true)">Buy Now</button>
            <button style="background:none;border:none;color:var(--amazon-blue);margin-top:12px;cursor:pointer;font-size:13px" onclick="addToWishlist('${p.id}')">♡ Add to Wish List</button>
          </div>
        </div>
      </div>`;
  } catch (err) { page.innerHTML = `<div class="container"><div class="empty-state"><p>Product not found</p></div></div>`; }
}

function changeDetailQty(delta) {
  const el = document.getElementById('detail-qty');
  const val = Math.max(1, parseInt(el.textContent) + delta);
  el.textContent = val;
}

async function addToCartDetail(id, buyNow=false) {
  const qty = parseInt(document.getElementById('detail-qty')?.textContent || 1);
  await addToCart(id, qty);
  if (buyNow) navigate('cart');
}

async function addToWishlist(productId) {
  if (!currentUser) { showToast('Sign in to save to wishlist', 'error'); navigate('login'); return; }
  try { await API.post('/user/wishlist/' + productId); showToast('Added to wish list ♡', 'success'); } catch (err) { showToast(err.message, 'error'); }
}

function doSearch() {
  const q = document.getElementById('search-input').value.trim();
  const cat = document.getElementById('search-category').value;
  if (!q && !cat) return;
  navigate('products', cat, q);
}
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input').addEventListener('keydown', e => { if (e.key==='Enter') doSearch(); });
});
