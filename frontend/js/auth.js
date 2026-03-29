let currentUser = null;

async function initAuth() {
  try {
    const data = await API.get('/auth/me');
    currentUser = data.user;
    updateHeader();
    updateCartCount();
  } catch {}
}

function updateHeader() {
  const greeting = document.getElementById('user-greeting');
  const dropdown = document.getElementById('account-dropdown');
  if (currentUser) {
    greeting.textContent = currentUser.name.split(' ')[0];
    dropdown.innerHTML = `
      <div style="padding:8px 12px;font-weight:700;border-bottom:1px solid #e0e0e0">Hello, ${currentUser.name}</div>
      <a onclick="navigate('profile')">Your Account</a>
      <a onclick="navigate('orders')">Your Orders</a>
      <a onclick="navigate('profile','wishlist')">Your Wishlist</a>
      <hr/>
      <button onclick="logout()">Sign Out</button>`;
  } else {
    greeting.textContent = 'sign in';
    dropdown.innerHTML = `
      <div style="text-align:center;padding:8px">
        <button class="btn-primary" style="width:100%;border-radius:4px;padding:8px" onclick="navigate('login');closeDropdown()">Sign in</button>
      </div>
      <div style="padding:6px 12px;font-size:12px">New customer? <a onclick="navigate('register');closeDropdown()" style="color:#007185">Start here</a></div>
      <hr/>
      <a onclick="navigate('orders');closeDropdown()">Orders & Returns</a>`;
  }
}

function toggleAccountMenu() {
  document.getElementById('account-dropdown').classList.toggle('show');
}
function closeDropdown() {
  document.getElementById('account-dropdown').classList.remove('show');
}
document.addEventListener('click', e => {
  if (!document.getElementById('account-menu').contains(e.target)) closeDropdown();
});

async function logout() {
  try {
    await API.post('/auth/logout');
    currentUser = null;
    updateHeader();
    document.getElementById('cart-count').textContent = 0;
    navigate('home');
    showToast('Signed out successfully');
  } catch (err) { showToast(err.message, 'error'); }
}

function renderLoginPage() {
  document.getElementById('page-login').innerHTML = `
    <div class="container">
      <div class="auth-container">
        <div class="auth-logo">amazon<span>.</span></div>
        <h2>Sign in</h2>
        <div class="form-group"><label>Email</label><input type="email" id="login-email" placeholder="you@example.com" autocomplete="email"/></div>
        <div class="form-group"><label>Password</label><input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password"/></div>
        <button class="btn-form" onclick="doLogin()">Sign in</button>
        <div class="form-divider"><span>New to Amazon?</span></div>
        <div class="auth-link"><a onclick="navigate('register')">Create your Amazon account</a></div>
      </div>
    </div>`;
  document.getElementById('login-email').addEventListener('keydown', e => e.key==='Enter'&&doLogin());
  document.getElementById('login-password').addEventListener('keydown', e => e.key==='Enter'&&doLogin());
}

async function doLogin() {
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  if (!email || !password) return showToast('Please fill all fields', 'error');
  try {
    const data = await API.post('/auth/login', { email, password });
    currentUser = data.user;
    updateHeader();
    await updateCartCount();
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    navigate('home');
  } catch (err) { showToast(err.message, 'error'); }
}

function renderRegisterPage() {
  document.getElementById('page-register').innerHTML = `
    <div class="container">
      <div class="auth-container">
        <div class="auth-logo">amazon<span>.</span></div>
        <h2>Create account</h2>
        <div class="form-group"><label>Your name</label><input type="text" id="reg-name" placeholder="First and last name" autocomplete="name"/></div>
        <div class="form-group"><label>Email</label><input type="email" id="reg-email" placeholder="you@example.com" autocomplete="email"/></div>
        <div class="form-group"><label>Password</label><input type="password" id="reg-password" placeholder="At least 6 characters" autocomplete="new-password"/></div>
        <div class="form-group"><label>Re-enter password</label><input type="password" id="reg-password2" placeholder="At least 6 characters" autocomplete="new-password"/></div>
        <button class="btn-form" onclick="doRegister()">Create your Amazon account</button>
        <div class="auth-link">Already have an account? <a onclick="navigate('login')">Sign in</a></div>
      </div>
    </div>`;
}

async function doRegister() {
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  if (!name||!email||!password) return showToast('Please fill all fields', 'error');
  if (password !== password2) return showToast('Passwords do not match', 'error');
  if (password.length < 6) return showToast('Password must be ≥ 6 characters', 'error');
  try {
    const data = await API.post('/auth/register', { name, email, password });
    currentUser = data.user;
    updateHeader();
    showToast(`Welcome to Amazon, ${currentUser.name}!`, 'success');
    navigate('home');
  } catch (err) { showToast(err.message, 'error'); }
}
