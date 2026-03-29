const PAGES = [
  'home','products','product-detail','cart','checkout',
  'orders','login','register','profile','deals'
];

function showPage(name) {
  PAGES.forEach(p => document.getElementById('page-' + p).classList.add('hidden'));
  const el = document.getElementById('page-' + name);
  if (el) el.classList.remove('hidden');
}

async function navigate(page, param1 = '', param2 = '') {
  closeDropdown();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  switch (page) {
    case 'home':           showPage('home');           await renderHomePage();              break;
    case 'products':       showPage('products');       await renderProductsPage(param1, param2); break;
    case 'product':        showPage('product-detail'); await renderProductDetail(param1);   break;
    case 'cart':           showPage('cart');           await renderCartPage();              break;
    case 'checkout':       showPage('checkout');       await renderCheckoutPage();          break;
    case 'orders':         showPage('orders');         await renderOrdersPage();            break;
    case 'login':          showPage('login');          renderLoginPage();                   break;
    case 'register':       showPage('register');       renderRegisterPage();                break;
    case 'profile':        showPage('profile');        await renderProfilePage(param1||'info'); break;
    case 'deals':          showPage('deals');          renderDealsPage();                   break;
  }
}

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'show' + (type ? ' ' + type : '');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.className = ''; }, 3500);
}

function openModal(html) {
  document.getElementById('modal-box').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  await loadCategories();
  navigate('home');
});
