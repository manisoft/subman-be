// src/routes/admin.js
const express = require('express');
const router = express.Router();

// Import the notification logic
const notifyDueSubscriptions = require('../notifyDueSubscriptions');

// Simple token check for security
const ADMIN_NOTIFY_SECRET = process.env.ADMIN_NOTIFY_SECRET;

router.post('/notify-due-subscriptions', async (req, res) => {
  // Require a secret token in the header
  const token = req.headers['x-admin-secret'];
  if (!token || token !== ADMIN_NOTIFY_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  try {
    await notifyDueSubscriptions();
    res.json({ status: 'ok', message: 'Notifications sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
