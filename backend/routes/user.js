const express  = require('express');
const bcrypt   = require('bcryptjs');
const { pool } = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const router   = express.Router();

// PUT /api/user/profile
router.put('/profile', requireAuth, async (req, res) => {
  const { name, address, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, address=$2, phone=$3 WHERE id=$4 RETURNING id, name, email, address, phone, role',
      [name, address, phone, req.session.userId]
    );
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// PUT /api/user/password
router.put('/password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!new_password || new_password.length < 6)
    return res.status(400).json({ error: 'New password must be ≥ 6 characters' });
  try {
    const result = await pool.query('SELECT password FROM users WHERE id=$1', [req.session.userId]);
    const valid = await bcrypt.compare(current_password, result.rows[0].password);
    if (!valid) return res.status(401).json({ error: 'Current password incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hash, req.session.userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Password update failed' });
  }
});

// Wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT p.* FROM wishlist w JOIN products p ON w.product_id=p.id WHERE w.user_id=$1`,
    [req.session.userId]
  );
  res.json({ wishlist: result.rows });
});

router.post('/wishlist/:productId', requireAuth, async (req, res) => {
  try {
    await pool.query(
      'INSERT INTO wishlist (user_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [req.session.userId, req.params.productId]
    );
    res.json({ message: 'Added to wishlist' });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.delete('/wishlist/:productId', requireAuth, async (req, res) => {
  await pool.query('DELETE FROM wishlist WHERE user_id=$1 AND product_id=$2', [req.session.userId, req.params.productId]);
  res.json({ message: 'Removed from wishlist' });
});

module.exports = router;
