const express = require('express');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');
const subModel = require('../models/subscription');

const router = express.Router();

// Get all subscriptions for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subs = await subModel.getSubscriptionsByUser(req.user.id);
    res.json(subs);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single subscription by id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sub = await subModel.getSubscriptionById(req.params.id, req.user.id);
    if (!sub) return res.status(404).json({ error: 'Not found' });
    res.json(sub);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new subscription
router.post(
  '/',
  authenticateToken,
  [
    body('name').notEmpty(),
    body('price').isNumeric(),
    // Accept any string for billing_cycle, we'll validate manually
    body('billing_cycle').isString(),
    body('category').notEmpty(),
    body('next_billing_date').isISO8601(),
    body('currency').optional().isString().isLength({ min: 3, max: 8 })
  ],
  async (req, res) => {
    // Normalize billing_cycle to lowercase before validation
    if (req.body.billing_cycle) {
      req.body.billing_cycle = req.body.billing_cycle.toLowerCase();
    }
    // Now validate against allowed values
    const allowedCycles = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!allowedCycles.includes(req.body.billing_cycle)) {
      return res.status(400).json({
        errors: [{
          type: 'field',
          value: req.body.billing_cycle,
          msg: 'Invalid value',
          path: 'billing_cycle',
          location: 'body',
        }]
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const sub = {
        id: uuidv4(),
        user_id: req.user.id,
        name: req.body.name,
        price: req.body.price,
        billing_cycle: req.body.billing_cycle,
        category: req.body.category,
        description: req.body.description || '',
        next_billing_date: req.body.next_billing_date,
        color: req.body.color || null,
        logo: req.body.logo || null,
        website: req.body.website || null,
        notes: req.body.notes || null,
        currency: req.body.currency || 'USD',
      };
      await subModel.createSubscription(sub);
      res.status(201).json({ message: 'Subscription created', id: sub.id });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Update a subscription
router.put(
  '/:id',
  authenticateToken,
  [
    body('name').notEmpty(),
    body('price').isNumeric(),
    // Accept any string for billing_cycle, we'll validate manually
    body('billing_cycle').isString(),
    body('category').notEmpty(),
    body('next_billing_date').isISO8601(),
    body('currency').optional().isString().isLength({ min: 3, max: 8 })
  ],
  async (req, res) => {
    // Normalize billing_cycle to lowercase before validation
    if (req.body.billing_cycle) {
      req.body.billing_cycle = req.body.billing_cycle.toLowerCase();
    }
    // Now validate against allowed values
    const allowedCycles = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];
    if (!allowedCycles.includes(req.body.billing_cycle)) {
      return res.status(400).json({
        errors: [{
          type: 'field',
          value: req.body.billing_cycle,
          msg: 'Invalid value',
          path: 'billing_cycle',
          location: 'body',
        }]
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const sub = {
        name: req.body.name,
        price: req.body.price,
        billing_cycle: req.body.billing_cycle,
        category: req.body.category,
        description: req.body.description || '',
        next_billing_date: req.body.next_billing_date,
        color: req.body.color || null,
        logo: req.body.logo || null,
        website: req.body.website || null,
        notes: req.body.notes || null,
        currency: req.body.currency || 'USD',
      };
      await subModel.updateSubscription(req.params.id, req.user.id, sub);
      res.json({ message: 'Subscription updated' });
    } catch (e) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);

// Delete a subscription
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    await subModel.deleteSubscription(req.params.id, req.user.id);
    res.json({ message: 'Subscription deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
