const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
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

// Admin CRUD for popular services
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await popularServiceModel.addPopularService(req.body);
    res.json({ message: 'Popular service added' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await popularServiceModel.updatePopularService(req.params.id, req.body);
    res.json({ message: 'Popular service updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await popularServiceModel.deletePopularService(req.params.id);
    res.json({ message: 'Popular service deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
