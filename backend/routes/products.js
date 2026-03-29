const express  = require('express');
const { pool } = require('../db/pool');
const router   = express.Router();

// GET /api/products/category/all
router.get('/categories/all', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ categories: result.rows });
  } catch (err) {
    console.error("CATEGORY ERROR:", err); // 👈 ADD THIS
    res.status(500).json({ error: err.message }); // 👈 SHOW REAL ERROR
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`, [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json({ product: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET /api/products  (with optional ?category=slug&q=search&sort=price_asc&page=1&limit=12)
router.get('/', async (req, res) => {
  const { category, q, sort = 'created_at_desc', page = 1, limit = 12 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];
  let idx = 1;

  if (category) {
    where.push(`c.slug = $${idx++}`);
    params.push(category);
  }
  if (q) {
    where.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    params.push(`%${q}%`);
    idx++;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const orderMap = {
    price_asc:  'p.price ASC',
    price_desc: 'p.price DESC',
    rating:     'p.rating DESC',
    newest:     'p.created_at DESC',
    created_at_desc: 'p.created_at DESC',
  };
  const orderClause = orderMap[sort] || 'p.created_at DESC';

  try {
    const [products, total] = await Promise.all([
      pool.query(
        `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p LEFT JOIN categories c ON p.category_id = c.id
         ${whereClause} ORDER BY ${orderClause}
         LIMIT $${idx} OFFSET $${idx+1}`,
        [...params, parseInt(limit), offset]
      ),
      pool.query(
        `SELECT COUNT(*) FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`,
        params
      )
    ]);
    res.json({ products: products.rows, total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});





module.exports = router;
