const express  = require('express');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const router   = express.Router();

// POST /api/orders  (place order from cart)
router.post('/', requireAuth, async (req, res) => {
  const { shipping_address, payment_method = 'COD' } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cartItems = await client.query(
      `SELECT ci.quantity, p.id AS product_id, p.price, p.stock, p.name
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.user_id=$1`,
      [req.session.userId]
    );
    if (!cartItems.rows.length) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }
    for (const item of cartItems.rows) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
      }
    }
    const total = cartItems.rows.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const order = await client.query(
      'INSERT INTO orders (user_id, total_amount, shipping_address, payment_method) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.session.userId, total.toFixed(2), shipping_address, payment_method]
    );
    const orderId = order.rows[0].id;
    for (const item of cartItems.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
      await client.query('UPDATE products SET stock=stock-$1 WHERE id=$2', [item.quantity, item.product_id]);
    }
    await client.query('DELETE FROM cart_items WHERE user_id=$1', [req.session.userId]);
    await client.query('COMMIT');
    res.status(201).json({ order: order.rows[0], message: 'Order placed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

// GET /api/orders  (user's orders)
router.get('/', requireAuth, async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
         'product_id', oi.product_id, 'quantity', oi.quantity, 'price', oi.price, 'name', p.name, 'image_url', p.image_url
       )) AS items
       FROM orders o JOIN order_items oi ON o.id = oi.order_id JOIN products p ON oi.product_id = p.id
       WHERE o.user_id=$1 GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.session.userId]
    );
    res.json({ orders: orders.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
