# Amazon Clone — Setup & Testing Guide

## Prerequisites
- Node.js ≥ 18  →  https://nodejs.org
- PostgreSQL ≥ 14  →  https://www.postgresql.org/download/
- npm (comes with Node.js)

---

## Step 1 — Install PostgreSQL and create the database

```bash
# macOS (Homebrew)
brew install postgresql@16 && brew services start postgresql@16

# Ubuntu / Debian
sudo apt update && sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql && sudo systemctl enable postgresql

# Windows  →  download installer from https://www.postgresql.org/download/windows/
```

### Create the database user / DB
```bash
# Switch to postgres superuser
sudo -u postgres psql          # Linux
psql -U postgres               # macOS / Windows

# Inside psql:
CREATE DATABASE amazon_clone;
\q
```

---

## Step 2 — Configure environment variables

Open `.env` in the project root and update:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amazon_clone
DB_USER=postgres
DB_PASSWORD=your_actual_password
SESSION_SECRET=some_long_random_string
PORT=3000
```

---

## Step 3 — Install Node dependencies

```bash
cd /home/anne/Desktop/amazon-clone
npm install
```

---

## Step 4 — Set up the database schema + seed data

```bash
npm run setup-db
```

Expected output:
```
🔧 Setting up database schema...
✅ Database setup complete!
   Tables created: users, categories, products, ...
   Sample data seeded: 8 categories, 12 products
```

---

## Step 5 — Start the server

```bash
npm start
# OR for auto-reload during development:
npm run dev
```

Expected output:
```
🚀 Amazon Clone running at http://localhost:3000
   Environment: development
```

---

## Step 6 — Open in browser

Go to: **http://localhost:3000**

---

## Testing Checklist

### Authentication
- [ ] Click "sign in" → Register a new account
- [ ] Sign in with your new account
- [ ] Verify name appears in header
- [ ] Sign out and sign back in

### Products
- [ ] Browse home page categories
- [ ] Click a category → filtered product listing
- [ ] Use search bar (e.g. "Sony")
- [ ] Sort by price, rating
- [ ] Click a product → detail page
- [ ] Adjust quantity, click "Add to Cart"

### Cart & Checkout
- [ ] Open cart (🛒 icon)
- [ ] Increase/decrease quantities
- [ ] Remove an item
- [ ] Click "Proceed to Checkout"
- [ ] Fill delivery address, choose payment
- [ ] Place order

### Orders
- [ ] Navigate to "Returns & Orders"
- [ ] Confirm order appears with correct items/total

### Profile
- [ ] Go to Account → Personal Info
- [ ] Update name/phone/address → Save
- [ ] Change password

### Wishlist
- [ ] On product detail, click "Add to Wish List"
- [ ] Go to Account → Wishlist → verify

---

## Useful psql commands for debugging

```bash
psql -U postgres -d amazon_clone

\dt                           -- list tables
SELECT * FROM users;
SELECT * FROM products LIMIT 5;
SELECT * FROM orders;
SELECT * FROM cart_items;
\q
```

---

## Project Structure

```
amazon-clone/
├── backend/
│   ├── server.js           # Express app entry point
│   ├── db/
│   │   ├── pool.js         # PostgreSQL connection pool
│   │   └── setup.js        # DB schema + seed script
│   ├── middleware/
│   │   └── auth.js         # Session-based auth guards
│   └── routes/
│       ├── auth.js         # Register, Login, Logout, /me
│       ├── products.js     # Product listing, detail, categories
│       ├── cart.js         # Cart CRUD
│       ├── orders.js       # Place order, order history
│       └── user.js         # Profile, password, wishlist
├── frontend/
│   ├── index.html          # Single-page shell
│   ├── css/styles.css      # Full Amazon-style stylesheet
│   └── js/
│       ├── api.js          # Fetch wrapper
│       ├── auth.js         # Login, register, logout UI
│       ├── cart.js         # Cart render + actions
│       ├── products.js     # Product cards, detail, search
│       ├── pages.js        # Page renderers (home, orders, checkout, profile, deals)
│       └── app.js          # Router + init
├── uploads/                # Product image uploads (future)
├── .env                    # Environment config (edit this!)
├── package.json
└── SETUP_GUIDE.md          # This file
```

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on DB | PostgreSQL not running — start it |
| `password authentication failed` | Wrong password in `.env` |
| `relation "session" does not exist` | Re-run `npm run setup-db` |
| Port 3000 in use | Change `PORT` in `.env` |
| Blank page / JS errors | Check browser console, ensure `npm install` ran |
