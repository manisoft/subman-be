const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../db');

const BUILTIN_CATEGORIES = [
  'music',
  'entertainment',
  'shopping',
  'software',
  'productivity',
  'health',
  'fitness',
  'education',
  'news',
  'finance',
  'utilities',
  'other'
];

const router = express.Router();

// Get all categories (builtin + custom used by user)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Get distinct categories used by the user
    const [rows] = await pool.query(
      'SELECT DISTINCT category FROM subscriptions WHERE user_id = ? AND category IS NOT NULL',
      [req.user.id]
    );
    const userCategories = rows.map(r => r.category).filter(Boolean);
    // Merge and deduplicate
    const allCategories = Array.from(new Set([...BUILTIN_CATEGORIES, ...userCategories]));
    res.json(allCategories);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
