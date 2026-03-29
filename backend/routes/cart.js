const express  = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const router   = express.Router();

// GET /api/cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock, p.is_prime
       FROM cart_items ci JOIN products p ON ci.product_id = p.id
       WHERE ci.user_id = $1 ORDER BY ci.added_at DESC`, [req.session.userId]
    );
    res.json({ items: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', requireAuth, async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ error: 'product_id required' });
  try {
    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = cart_items.quantity + $3`,
      [req.session.userId, product_id, quantity]
    );
    const count = await pool.query('SELECT SUM(quantity) AS cnt FROM cart_items WHERE user_id=$1', [req.session.userId]);
    res.json({ message: 'Added to cart', cartCount: parseInt(count.rows[0].cnt) || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PUT /api/cart/:id
router.put('/:id', requireAuth, async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'Valid quantity required' });
  try {
    await pool.query(
      'UPDATE cart_items SET quantity=$1 WHERE id=$2 AND user_id=$3',
      [quantity, req.params.id, req.session.userId]
    );
    res.json({ message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE id=$1 AND user_id=$2', [req.params.id, req.session.userId]);
    res.json({ message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// DELETE /api/cart  (clear entire cart)
router.delete('/', requireAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM cart_items WHERE user_id=$1', [req.session.userId]);
    res.json({ message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;
