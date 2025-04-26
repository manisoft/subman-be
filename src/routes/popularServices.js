const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const popularServiceModel = require('../models/popularService');

const router = express.Router();

// Get all popular services (public route)
router.get('/', async (req, res) => {
  try {
    const services = await popularServiceModel.getAllPopularServices();
    res.json(services);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
