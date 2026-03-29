require('dotenv').config();
const express       = require('express');
const session       = require('express-session');
const pgSession     = require('connect-pg-simple')(session);
const cors          = require('cors');
const path          = require('path');
const { pool }      = require('./db/pool');

const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes    = require('./routes/cart');
const orderRoutes   = require('./routes/orders');
const userRoutes    = require('./routes/user');


const app = express();

// ── Middleware ──────────────────────────────
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Session ─────────────────────────────────
app.set('trust proxy', 1); // 👈 ADD THIS ABOVE session

app.use(session({
  store: new pgSession({ pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,

  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: true,
    sameSite: 'lax'
  }
}));

// ── API Routes ───────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart',     cartRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/user',     userRoutes);

// ── SPA Fallback ─────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error Handler ─────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
  console.log(`\n🚀 Amazon Clone running at http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV}\n`);

    // 🚨 AUTO SETUP (TEMP)
//  if (process.env.NODE_ENV === 'production') {
//   require('./db/setup');
// }
if (process.env.NODE_ENV !== 'production') {
  require('./db/setup');
}
});