const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pushModel = require('../models/pushSubscription');

const router = express.Router();

// Register push subscription
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { endpoint, keys } = req.body;
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    return res.status(400).json({ error: 'Invalid subscription payload' });
  }
  try {
    await pushModel.addPushSubscription({
      user_id: req.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
    res.status(201).json({ message: 'Push subscription registered' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Unregister push subscription
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Endpoint required' });
  try {
    await pushModel.removePushSubscription(req.user.id, endpoint);
    res.json({ message: 'Push subscription removed' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
