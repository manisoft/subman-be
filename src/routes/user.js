const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getAllCurrencies } = require('../utils/currencyRates');

// Middleware to authenticate user
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, process.env.JWT_SECRET || 'dev_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// GET user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, avatar_url, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    // Map DB fields to camelCase for frontend
    const user = rows[0];
    res.json({
      ...user,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, avatarUrl } = req.body;
    let updateFields = [];
    let updateValues = [];
    if (name) { updateFields.push('name = ?'); updateValues.push(name); }
    if (email) { updateFields.push('email = ?'); updateValues.push(email); }
    if (avatarUrl !== undefined) { updateFields.push('avatar_url = ?'); updateValues.push(avatarUrl); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.push('password = ?');
      updateValues.push(hashed);
    }
    if (!updateFields.length) return res.status(400).json({ error: 'No fields to update' });
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    updateValues.push(req.user.id);
    await db.query(sql, updateValues);
    const [rows] = await db.query('SELECT id, name, email, avatar_url, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];
    res.json({
      ...user,
      avatarUrl: user.avatar_url,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get/set user default currency
router.get('/currency', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const [rows] = await db.query('SELECT default_currency FROM users WHERE id = ?', [userId]);
  res.json({ currency: rows[0]?.default_currency || 'USD' });
});

router.put('/currency', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { currency } = req.body;
  await db.query('UPDATE users SET default_currency = ? WHERE id = ?', [currency, userId]);
  res.json({ success: true });
});

// Get all supported currencies and rates
router.get('/currencies', async (req, res) => {
  const currencies = await getAllCurrencies();
  res.json(currencies);
});

module.exports = router;
