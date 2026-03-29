let allCategories = [];
let currentPage   = 1;
let currentFilters = {};

/** Stable Unsplash URLs (auto=format works reliably across browsers). Each product is visually distinct. */
const US = 'https://images.unsplash.com';
const Q = '?auto=format&fit=crop&w=640&q=82';

/** Curated one-to-one map (normalized keys + common API variants). */
const PRODUCT_IMAGE_BY_NAME = {
  'Apple iPhone 15 Pro': `${US}/photo-1592750475338-74b7b21085ab${Q}`,
  'Samsung 65" 4K QLED TV': `${US}/photo-1593359677879-a4bb92f829d1${Q}`,
  'Sony WH-1000XM5 Headphones': `${US}/photo-1583394838336-acd977736f90${Q}`,
  'Atomic Habits': `${US}/photo-1544947950-fa07a98d237f${Q}`,
  'Nike Air Max 270': `${US}/photo-1542291026-7eec264c27ff${Q}`,
  'Instant Pot Duo 7-in-1': `${US}/photo-1556909172-54557c7e4fb7${Q}`,
  'LEGO Technic Bugatti Chiron': `${US}/photo-1587654780291-39c9404d746b${Q}`,
  'Dyson V15 Detect Vacuum': `${US}/photo-1558618666-fcd25c85cd64${Q}`,
  'MacBook Pro 14-inch M3': `${US}/photo-1496181133206-80ce9b88a853${Q}`,
  'Garmin Forerunner 265': `${US}/photo-1579586337278-3befd40fd17a${Q}`,
  'The Psychology of Money': `${US}/photo-1507003211169-0a1dd7228f2d${Q}`,
  'Adidas Ultraboost 23': `${US}/photo-1608231387042-66d1773070a5${Q}`,
};

function normalizeProductName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[\u201c\u201d\u201e\u00ab\u00bb]/g, '"');
}

function lookupImageByProductName(name) {
  const n = normalizeProductName(name);
  if (PRODUCT_IMAGE_BY_NAME[n]) return PRODUCT_IMAGE_BY_NAME[n];
  const lower = n.toLowerCase();
  for (const key of Object.keys(PRODUCT_IMAGE_BY_NAME)) {
    if (key.toLowerCase() === lower) return PRODUCT_IMAGE_BY_NAME[key];
  }
  return null;
}

/** When name map misses: pick a *unique* image per product id within category (no shared generic blob). */
/** Verified HTTP 200 via images.unsplash.com (invalid photo IDs break product grids). */
const CATEGORY_IMAGE_POOLS = {
  electronics: [
    `${US}/photo-1592750475338-74b7b21085ab${Q}`,
    `${US}/photo-1593359677879-a4bb92f829d1${Q}`,
    `${US}/photo-1583394838336-acd977736f90${Q}`,
    `${US}/photo-1496181133206-80ce9b88a853${Q}`,
    `${US}/photo-1517694712202-14dd9538aa97${Q}`,
    `${US}/photo-1498049794561-7780e7231661${Q}`,
    `${US}/photo-1505740420928-5e560c06d30e${Q}`,
    `${US}/photo-1579586337278-3befd40fd17a${Q}`,
  ],
  books: [
    `${US}/photo-1544947950-fa07a98d237f${Q}`,
    `${US}/photo-1519682337058-a94d519337bc${Q}`,
    `${US}/photo-1526243741027-444d633d7365${Q}`,
    `${US}/photo-1481627834876-b7833e8f5570${Q}`,
    `${US}/photo-1532012197267-da84d127e765${Q}`,
    `${US}/photo-1512820790803-83ca734da794${Q}`,
  ],
  clothing: [
    `${US}/photo-1542291026-7eec264c27ff${Q}`,
    `${US}/photo-1608231387042-66d1773070a5${Q}`,
    `${US}/photo-1549298916-b41d501d3772${Q}`,
    `${US}/photo-1460353581641-37baddab0fa2${Q}`,
    `${US}/photo-1605348532760-6753d2c43329${Q}`,
    `${US}/photo-1543163521-1bf539c55dd2${Q}`,
    `${US}/photo-1507003211169-0a1dd7228f2d${Q}`,
  ],
  'home-kitchen': [
    `${US}/photo-1556909114-f6e7ad7d3136${Q}`,
    `${US}/photo-1556909172-54557c7e4fb7${Q}`,
    `${US}/photo-1556912173-46c336c7fd55${Q}`,
    `${US}/photo-1556228720-195a672e8a03${Q}`,
    `${US}/photo-1556742049-0cfed4f6a45d${Q}`,
    `${US}/photo-1558618666-fcd25c85cd64${Q}`,
  ],
  sports: [
    `${US}/photo-1476480862126-209bfaa8edc8${Q}`,
    `${US}/photo-1534438327276-14e5300c3a48${Q}`,
    `${US}/photo-1517836357463-d25dfeac3438${Q}`,
    `${US}/photo-1570172619644-dfd03ed5d881${Q}`,
    `${US}/photo-1579586337278-3befd40fd17a${Q}`,
  ],
  toys: [
    `${US}/photo-1587654780291-39c9404d746b${Q}`,
    `${US}/photo-1566576912321-d58ddd7a6088${Q}`,
    `${US}/photo-1558060370-d644479cb6f7${Q}`,
    `${US}/photo-1596462502278-27bfdc403348${Q}`,
  ],
  beauty: [
    `${US}/photo-1596462502278-27bfdc403348${Q}`,
    `${US}/photo-1522338242992-e1a54906a8da${Q}`,
    `${US}/photo-1570172619644-dfd03ed5d881${Q}`,
    `${US}/photo-1556228720-195a672e8a03${Q}`,
  ],
  automotive: [
    `${US}/photo-1492144534655-ae79c964c9d7${Q}`,
    `${US}/photo-1503376780353-7e6692767b70${Q}`,
    `${US}/photo-1498049794561-7780e7231661${Q}`,
    `${US}/photo-1605348532760-6753d2c43329${Q}`,
  ],
};

const GENERIC_POOL = [
  `${US}/photo-1607082348824-0a96f2a4b9da${Q}`,
  `${US}/photo-1607082349566-187342175e2f${Q}`,
  `${US}/photo-1556742049-0cfed4f6a45d${Q}`,
  `${US}/photo-1560472354-b33ff0c44a43${Q}`,
  `${US}/photo-1441986300917-64674bd600d8${Q}`,
  `${US}/photo-1472851294608-062f824d29cc${Q}`,
];

function hashString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h) ^ s.charCodeAt(i);
  return Math.abs(h);
}

function pickFromPool(pool, seed) {
  if (!pool.length) return GENERIC_POOL[0];
  return pool[seed % pool.length];
}

/**
 * Deterministic fallback image (always loads): picsum with seed derived from product id.
 * @param {string} id
 */
function getProductImageFallback(id) {
  const seed = encodeURIComponent(String(id || 'p').replace(/-/g, '')).slice(0, 80);
  return `https://picsum.photos/seed/${seed}/640/640`;
}

function isPlaceholderImage(url) {
  return !url || String(url).includes('via.placeholder') || String(url).includes('placeholder');
}

/**
 * @param {{ name?: string, image_url?: string, id?: string, product_id?: string, category_slug?: string }} p
 * @returns {string}
 */
function getProductImageUrl(p) {
  const byName = p.name && lookupImageByProductName(p.name);
  if (byName) return byName;
  if (!isPlaceholderImage(p.image_url)) return p.image_url;

  const pid = p.id || p.product_id;
  const slug = p.category_slug || 'general';
  const pool = CATEGORY_IMAGE_POOLS[slug] || GENERIC_POOL;
  const seed = hashString(String(pid || '') + '|' + normalizeProductName(p.name || ''));
  return pickFromPool(pool, seed);
}

/**
 * For use inside double-quoted HTML attributes.
 * @param {string} [id]
 */
function productImageOnErrorAttr(id) {
  const fb = getProductImageFallback(id);
  return `this.onerror=null;this.src='${fb.replace(/'/g, "\\'")}'`;
}

/** Amazon-style wordmark for inline use (auth card = light bg). Header/footer use HTML copy. */
function amazonLogoHtml(variant = 'light') {
  const textFill = variant === 'dark' ? '#FFFFFF' : '#0F1111';
  return `
    <svg class="amazon-logo-svg amazon-logo-svg--${variant}" width="100" height="32" viewBox="0 0 112 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="3" y="27" font-family="DM Sans, system-ui, sans-serif" font-size="26" font-weight="700" fill="${textFill}">amazon</text>
      <path d="M8 31 Q56 38 104 31" stroke="#FF9900" stroke-width="2.35" fill="none" stroke-linecap="round"/>
      <path d="M99 28.5 L104 31 L99 33.5" stroke="#FF9900" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

async function loadCategories() {
  try {
    const data = await API.get('/products/categories/all');
    allCategories = data.categories;
    const sel = document.getElementById('search-category');
    allCategories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.slug;
      opt.textContent = c.name;
      sel.appendChild(opt);
    });
  } catch {}
}

function renderStars(rating, count) {
  const rounded = Math.round(rating);
  const stars = Array.from({length: 5}, (_, i) =>
    `<span class="star${i < rounded ? ' filled' : ''}">★</span>`
  ).join('');
  return `
    <div class="rating-wrap">
      <div class="stars">${stars}</div>
      <span>${count ? count.toLocaleString() : 0}</span>
    </div>`;
}

function priceHtml(p) {
  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : 0;
  return `
    <div class="product-price">
      <span class="price-symbol">₹</span>
      <span class="price-now">${parseFloat(p.price).toFixed(2)}</span>
      ${p.original_price ? `<span class="price-old">₹${parseFloat(p.original_price).toFixed(2)}</span>` : ''}
      ${discount > 0 ? `<span class="discount-pill">-${discount}%</span>` : ''}
    </div>`;
}

function productCard(p, index = 0) {
  const pid = p.id || p.product_id;
  const cardDelay = Math.min(index, 28) * 38;
  const imgErr = productImageOnErrorAttr(pid);
  return `
    <div class="product-card" style="--card-d:${cardDelay}ms">
      <div class="product-card-img-wrap" onclick="navigate('product','${pid}')">
        <img src="${getProductImageUrl(p)}"
             alt="${p.name}" loading="lazy" class="product-thumb-img" decoding="async"
             onerror="${imgErr}"/>
      </div>
      <div class="product-info">
        ${p.is_prime ? '<div class="prime-badge"> prime</div>' : ''}
        <div class="product-name" onclick="navigate('product','${pid}')">${p.name}</div>
        ${renderStars(p.rating, p.rating_count)}
        ${priceHtml(p)}
        <button class="btn-add-cart" onclick="addToCart('${pid}')">Add to Cart</button>
      </div>
    </div>`;
}

async function renderProductsPage(category = '', query = '') {
  currentFilters = { category, q: query };
  currentPage    = 1;
  await _fetchAndRenderProducts();
}

async function _fetchAndRenderProducts() {
  const page = document.getElementById('page-products');
  const { category, q } = currentFilters;
  const sort = document.getElementById('sort-select')?.value || 'created_at_desc';

  page.innerHTML = '<div class="container"><div class="loading-spinner"><div class="spinner"></div>Loading products…</div></div>';

  try {
    const params = new URLSearchParams({ page: currentPage, limit: 12 });
    if (category) params.append('category', category);
    if (q) params.append('q', q);
    if (sort) params.append('sort', sort);

    const data = await API.get('/products?' + params);
    const { products, total } = data;
    const catLabel  = allCategories.find(c => c.slug === category)?.name || (q ? `"${q}"` : 'All Products');
    const totalPages = Math.ceil(total / 12);

    page.innerHTML = `
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a onclick="navigate('home')">Home</a>
          <span class="breadcrumb-sep">›</span>
          <span>${catLabel}</span>
        </nav>
        <div class="filter-bar">
          <label for="sort-select">Sort by:</label>
          <select id="sort-select" onchange="_fetchAndRenderProducts()">
            <option value="created_at_desc">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Avg. Customer Review</option>
            <option value="newest">Newest Arrivals</option>
          </select>
          <span class="results-count">
            <strong>${total.toLocaleString()}</strong> result${total !== 1 ? 's' : ''}
            ${q ? ` for &ldquo;<strong>${q}</strong>&rdquo;` : ''}
          </span>
        </div>
        ${products.length
          ? `<div class="product-grid">${products.map((p, i) => productCard(p, i)).join('')}</div>`
          : `<div class="empty-state">
               <span class="empty-icon">😔</span>
               <h2>No products found</h2>
               <p>Try a different search or browse our categories.</p>
               <button class="btn-hero-primary" onclick="navigate('home')">Go Home</button>
             </div>`}
        ${totalPages > 1 ? renderPagination(totalPages) : ''}
      </div>`;

    if (sort) document.getElementById('sort-select').value = sort;
  } catch (err) {
    page.innerHTML = `<div class="container"><div class="empty-state"><p>Error: ${err.message}</p></div></div>`;
  }
}

function renderPagination(total) {
  const pages = Array.from({length: total}, (_, i) => i + 1);
  return `
    <nav class="pagination" aria-label="Pagination">
      ${pages.map(p => `
        <button class="${p === currentPage ? 'active' : ''}" onclick="goToPage(${p})" aria-label="Page ${p}">${p}</button>
      `).join('')}
    </nav>`;
}

async function goToPage(p) {
  currentPage = p;
  await _fetchAndRenderProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── Product Detail ─────────────────────────────────── */
async function renderProductDetail(id) {
  const page = document.getElementById('page-product-detail');
  page.innerHTML = '<div class="container"><div class="loading-spinner"><div class="spinner"></div>Loading product…</div></div>';

  try {
    const data = await API.get('/products/' + id);
    const p    = data.product;
    const discount = p.original_price
      ? Math.round((1 - p.price / p.original_price) * 100)
      : 0;
    const savings = p.original_price
      ? (parseFloat(p.original_price) - parseFloat(p.price)).toFixed(2)
      : 0;

    page.innerHTML = `
      <div class="container">
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <a onclick="navigate('home')">Home</a>
          <span class="breadcrumb-sep">›</span>
          <a onclick="navigate('products','${p.category_slug}')">${p.category_name}</a>
          <span class="breadcrumb-sep">›</span>
          <span>${p.name}</span>
        </nav>
        <div class="detail-wrap">
          <div class="detail-grid">
            <div class="detail-img-col">
              <img src="${getProductImageUrl(p)}" alt="${p.name}" class="product-detail-img" decoding="async" onerror="${productImageOnErrorAttr(p.id)}"/>
            </div>
            <div class="detail-info-col">
              <a class="detail-brand">${p.brand || 'Generic'}</a>
              <h1 class="detail-name">${p.name}</h1>

              <div class="rating-wrap" style="font-size:13.5px">
                ${renderStars(p.rating, p.rating_count)}
              </div>
              <hr class="detail-divider"/>

              <div class="detail-price-row">
                <div class="detail-price">₹${parseFloat(p.price).toFixed(2)}</div>
                ${p.original_price ? `
                  <div class="detail-mrp">M.R.P: <span>₹${parseFloat(p.original_price).toFixed(2)}</span></div>
                  <div class="discount-pill">-${discount}%</div>` : ''}
              </div>
              ${savings > 0 ? `<div class="detail-save">You save: ₹${savings}</div>` : ''}

              ${p.is_prime ? `
                <div class="detail-prime">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>prime</span>
                  <span style="font-weight:400;color:var(--muted)">FREE Delivery</span>
                </div>` : ''}

              <div class="${p.stock > 0 ? 'detail-stock-in' : 'detail-stock-out'}">
                ${p.stock > 0 ? '✓ In Stock' : '✗ Out of Stock'}
              </div>

              ${p.description ? `<p class="detail-desc">${p.description}</p>` : ''}

              <div class="qty-row">
                <span class="qty-label">Quantity:</span>
                <div class="qty-control">
                  <button class="qty-btn" onclick="changeDetailQty(-1)">−</button>
                  <span class="qty-val" id="detail-qty">1</span>
                  <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
                </div>
              </div>

              <button class="btn-add-cart-detail" onclick="addToCartDetail('${p.id}')">Add to Cart</button>
              <button class="btn-buy-now" onclick="addToCartDetail('${p.id}', true)">Buy Now</button>
              <button class="btn-wishlist" onclick="addToWishlist('${p.id}')">♡ Add to Wish List</button>
            </div>
          </div>
        </div>
      </div>`;
  } catch {
    page.innerHTML = `
      <div class="container">
        <div class="empty-state">
          <span class="empty-icon">😕</span>
          <h2>Product Not Found</h2>
          <button class="btn-hero-primary" onclick="navigate('home')">Back to Home</button>
        </div>
      </div>`;
  }
}

function changeDetailQty(delta) {
  const el  = document.getElementById('detail-qty');
  const val = Math.max(1, parseInt(el.textContent) + delta);
  el.textContent = val;
}

async function addToCartDetail(id, buyNow = false) {
  const qty = parseInt(document.getElementById('detail-qty')?.textContent || 1);
  await addToCart(id, qty);
  if (buyNow) navigate('cart');
}

async function addToWishlist(productId) {
  if (!currentUser) { showToast('Sign in to save to wishlist', 'error'); navigate('login'); return; }
  try {
    await API.post('/user/wishlist/' + productId);
    showToast('Added to Wish List ♡', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

function doSearch() {
  const q   = document.getElementById('search-input').value.trim();
  const cat = document.getElementById('search-category').value;
  if (!q && !cat) return;
  navigate('products', cat, q);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch();
  });
});
