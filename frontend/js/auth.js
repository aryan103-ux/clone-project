let currentUser = null;

async function initAuth() {
  try {
    const data = await API.get('/auth/me');
    currentUser = data.user;
    updateHeader();
    if (currentUser) updateCartCount();
  } catch {}
}

function updateHeader() {
  const greeting = document.getElementById('user-greeting');
  const dropdown = document.getElementById('account-dropdown');

  if (currentUser) {
    greeting.textContent = currentUser.name.split(' ')[0];
    dropdown.innerHTML = `
      <div class="dropdown-header">Hello, ${currentUser.name}</div>
      <a onclick="navigate('profile');closeDropdown()">Your Account</a>
      <a onclick="navigate('orders');closeDropdown()">Your Orders</a>
      <a onclick="navigate('profile','wishlist');closeDropdown()">Your Wish List</a>
      <hr/>
      <button onclick="logout()">Sign Out</button>`;
  } else {
    greeting.textContent = 'sign in';
    dropdown.innerHTML = `
      <div style="padding:12px">
        <button class="btn-form" style="margin:0;border-radius:6px;padding:10px" onclick="navigate('login');closeDropdown()">Sign in</button>
      </div>
      <div style="padding:4px 12px 10px;font-size:12px;color:var(--muted)">
        New customer? <a onclick="navigate('register');closeDropdown()" style="color:var(--teal);font-weight:600">Create account</a>
      </div>
      <hr/>
      <a onclick="navigate('orders');closeDropdown()">Orders &amp; Returns</a>`;
  }
}

function toggleAccountMenu() {
  const dd = document.getElementById('account-dropdown');
  const wrap = document.getElementById('account-menu');
  const isOpen = dd.classList.toggle('show');
  wrap.classList.toggle('open', isOpen);
}

function closeDropdown() {
  document.getElementById('account-dropdown').classList.remove('show');
  document.getElementById('account-menu').classList.remove('open');
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

/* ── Login page ─────────────────────────────────────── */
function renderLoginPage() {
  document.getElementById('page-login').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">${amazonLogoHtml('light')}</div>
        <h2>Sign in</h2>
        <div class="form-group">
          <label>Email address</label>
          <input type="email" id="login-email" placeholder="you@example.com" autocomplete="email"/>
        </div>
        <div class="form-group">
          <label>Password</label>
          <input type="password" id="login-password" placeholder="••••••••" autocomplete="current-password"/>
        </div>
        <button class="btn-form" onclick="doLogin()">Continue</button>
        <div class="auth-divider"><span>New to Amazon?</span></div>
        <a class="btn-form" style="display:block;text-align:center;background:#f0f2f2;border:1px solid #ccc;color:var(--text)" onclick="navigate('register')">Create your Amazon account</a>
      </div>
    </div>`;
  const onEnter = e => { if (e.key === 'Enter') doLogin(); };
  document.getElementById('login-email').addEventListener('keydown', onEnter);
  document.getElementById('login-password').addEventListener('keydown', onEnter);
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

/* ── Register page ──────────────────────────────────── */
function renderRegisterPage() {
  document.getElementById('page-register').innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">${amazonLogoHtml('light')}</div>
        <h2>Create account</h2>
        <div class="form-group"><label>Your name</label><input type="text" id="reg-name" placeholder="First and last name" autocomplete="name"/></div>
        <div class="form-group"><label>Email</label><input type="email" id="reg-email" placeholder="you@example.com" autocomplete="email"/></div>
        <div class="form-group"><label>Password</label><input type="password" id="reg-password" placeholder="At least 6 characters" autocomplete="new-password"/></div>
        <div class="form-group"><label>Re-enter password</label><input type="password" id="reg-password2" placeholder="At least 6 characters" autocomplete="new-password"/></div>
        <button class="btn-form" onclick="doRegister()">Create your Amazon account</button>
        <div class="auth-link" style="margin-top:14px">Already have an account? <a onclick="navigate('login')">Sign in</a></div>
      </div>
    </div>`;
}

async function doRegister() {
  const name      = document.getElementById('reg-name').value.trim();
  const email     = document.getElementById('reg-email').value.trim();
  const password  = document.getElementById('reg-password').value;
  const password2 = document.getElementById('reg-password2').value;
  if (!name || !email || !password) return showToast('Please fill all fields', 'error');
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
