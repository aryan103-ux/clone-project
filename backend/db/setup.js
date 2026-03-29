require('dotenv').config();
const { pool } = require('./pool');
console.log("STARTING DB SETUP...");
async function setup() {
  const client = await pool.connect();
  try {
    console.log('🔧 Setting up database schema...');
    await client.query(`
      
      CREATE TABLE IF NOT EXISTS users (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name         VARCHAR(100) NOT NULL,
        email        VARCHAR(150) UNIQUE NOT NULL,
        password     TEXT NOT NULL,
        role         VARCHAR(20) DEFAULT 'customer',
        address      TEXT,
        phone        VARCHAR(20),
        avatar       TEXT,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id    SERIAL PRIMARY KEY,
        name  VARCHAR(100) UNIQUE NOT NULL,
        slug  VARCHAR(100) UNIQUE NOT NULL,
        icon  VARCHAR(10) DEFAULT '📦'
      );

      CREATE TABLE IF NOT EXISTS products (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name          TEXT NOT NULL,
        description   TEXT,
        price         NUMERIC(10,2) NOT NULL,
        original_price NUMERIC(10,2),
        stock         INTEGER DEFAULT 0,
        category_id   INTEGER REFERENCES categories(id),
        image_url     TEXT,
        rating        NUMERIC(3,2) DEFAULT 0,
        rating_count  INTEGER DEFAULT 0,
        is_prime      BOOLEAN DEFAULT FALSE,
        brand         VARCHAR(100),
        created_at    TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cart_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
        quantity    INTEGER DEFAULT 1,
        added_at    TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id         UUID REFERENCES users(id),
        total_amount    NUMERIC(10,2) NOT NULL,
        status          VARCHAR(30) DEFAULT 'pending',
        shipping_address TEXT,
        payment_method  VARCHAR(50) DEFAULT 'COD',
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
        product_id  UUID REFERENCES products(id),
        quantity    INTEGER NOT NULL,
        price       NUMERIC(10,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS wishlist (
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID REFERENCES users(id),
        product_id  UUID REFERENCES products(id),
        rating      INTEGER CHECK (rating BETWEEN 1 AND 5),
        title       VARCHAR(200),
        body        TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, product_id)
      );
    `);

    // Session table (connect-pg-simple)
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid    VARCHAR NOT NULL COLLATE "default",
        sess   JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      );
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire);
    `);

    // Seed categories
    await client.query(`
      INSERT INTO categories (name, slug, icon) VALUES
        ('Electronics',     'electronics',     '💻'),
        ('Books',           'books',           '📚'),
        ('Clothing',        'clothing',        '👕'),
        ('Home & Kitchen',  'home-kitchen',    '🏠'),
        ('Sports',          'sports',          '⚽'),
        ('Toys',            'toys',            '🧸'),
        ('Beauty',          'beauty',          '💄'),
        ('Automotive',      'automotive',      '🚗')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // Seed sample products
    await client.query(`
      INSERT INTO products (name, description, price, original_price, stock, category_id, image_url, rating, rating_count, is_prime, brand)
      VALUES
        ('Apple iPhone 15 Pro', '6.1-inch Super Retina XDR display, A17 Pro chip, titanium design', 999.00, 1099.00, 50,
         (SELECT id FROM categories WHERE slug='electronics'),
         'https://via.placeholder.com/300x300/FF9900/FFFFFF?text=iPhone+15', 4.8, 2341, TRUE, 'Apple'),

        ('Samsung 65" 4K QLED TV', 'Quantum HDR 32x, Dolby Atmos, Smart TV with Tizen OS', 1299.00, 1599.00, 20,
         (SELECT id FROM categories WHERE slug='electronics'),
         'https://via.placeholder.com/300x300/232F3E/FF9900?text=Samsung+TV', 4.6, 876, TRUE, 'Samsung'),

        ('Sony WH-1000XM5 Headphones', 'Industry-leading noise cancellation, 30hr battery, multipoint connection', 349.00, 399.00, 80,
         (SELECT id FROM categories WHERE slug='electronics'),
         'https://via.placeholder.com/300x300/131921/FEBD69?text=Sony+WH5', 4.9, 5210, TRUE, 'Sony'),

        ('Atomic Habits', 'An Easy and Proven Way to Build Good Habits and Break Bad Ones by James Clear', 14.99, 27.00, 200,
         (SELECT id FROM categories WHERE slug='books'),
         'https://via.placeholder.com/300x300/FF9900/131921?text=Atomic+Habits', 4.8, 89321, TRUE, 'Avery'),

        ('Nike Air Max 270', 'Mens Running Shoe, Max Air cushioning unit for lasting comfort', 129.99, 159.99, 150,
         (SELECT id FROM categories WHERE slug='clothing'),
         'https://via.placeholder.com/300x300/FEBD69/232F3E?text=Nike+Air+Max', 4.5, 3401, TRUE, 'Nike'),

        ('Instant Pot Duo 7-in-1', 'Pressure Cooker, Slow Cooker, Rice Cooker, Steamer, Saute, Yogurt Maker', 89.00, 129.00, 60,
         (SELECT id FROM categories WHERE slug='home-kitchen'),
         'https://via.placeholder.com/300x300/232F3E/FEBD69?text=Instant+Pot', 4.7, 12890, TRUE, 'Instant Pot'),

        ('LEGO Technic Bugatti Chiron', '3599-piece detailed model of the iconic Bugatti Chiron hypercar', 449.00, 499.00, 25,
         (SELECT id FROM categories WHERE slug='toys'),
         'https://via.placeholder.com/300x300/FF9900/131921?text=LEGO+Bugatti', 4.9, 2103, TRUE, 'LEGO'),

        ('Dyson V15 Detect Vacuum', 'Laser dust detection, HEPA filtration, 60min run time', 749.00, 849.00, 35,
         (SELECT id FROM categories WHERE slug='home-kitchen'),
         'https://via.placeholder.com/300x300/131921/FF9900?text=Dyson+V15', 4.6, 4512, TRUE, 'Dyson'),

        ('MacBook Pro 14-inch M3', 'Apple M3 Pro chip, 18GB RAM, 512GB SSD, Liquid Retina XDR display', 1999.00, 2199.00, 40,
         (SELECT id FROM categories WHERE slug='electronics'),
         'https://via.placeholder.com/300x300/FEBD69/131921?text=MacBook+Pro', 4.8, 1876, TRUE, 'Apple'),

        ('Garmin Forerunner 265', 'Running GPS Smartwatch, AMOLED display, Training Readiness', 449.99, 499.99, 55,
         (SELECT id FROM categories WHERE slug='sports'),
         'https://via.placeholder.com/300x300/232F3E/FF9900?text=Garmin+265', 4.7, 932, TRUE, 'Garmin'),

        ('The Psychology of Money', 'Timeless lessons on wealth, greed, and happiness by Morgan Housel', 13.99, 20.00, 300,
         (SELECT id FROM categories WHERE slug='books'),
         'https://via.placeholder.com/300x300/FF9900/232F3E?text=Psychology+Money', 4.7, 45210, FALSE, 'Harriman House'),

        ('Adidas Ultraboost 23', 'Boost cushioning, Primeknit upper, Continental rubber outsole', 189.99, 230.00, 90,
         (SELECT id FROM categories WHERE slug='clothing'),
         'https://via.placeholder.com/300x300/131921/FEBD69?text=Adidas+UB23', 4.6, 2830, TRUE, 'Adidas')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Database setup complete!');
    console.log('   Tables created: users, categories, products, cart_items, orders, order_items, wishlist, reviews, session');
    console.log('   Sample data seeded: 8 categories, 12 products\n');
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

setup().catch(() => process.exit(1));
