const express = require('express');
const router = express.Router();
const { getLatestVersion } = require('../models/version');

// GET /api/version
router.get('/', async (req, res) => {
  try {
    const version = await getLatestVersion();
    if (!version) return res.status(404).json({ error: 'No version found' });
    res.json(version);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
