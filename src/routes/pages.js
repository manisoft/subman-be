const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/pages/:id - public, returns { title, content } for a page
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT id, title, content, created_at, updated_at FROM pages WHERE id = ?', [id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Page not found' });
    }
    const page = rows[0];
    res.json({
      id: page.id,
      title: page.title || '',
      content: page.content || '',
      created_at: page.created_at,
      updated_at: page.updated_at
    });
  } catch (err) {
    console.error('Error fetching page:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
