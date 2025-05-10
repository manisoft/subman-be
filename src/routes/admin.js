// src/routes/admin.js
const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const userModel = require('../models/user');
const versionModel = require('../models/version');
const db = require('../db');

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

// Get paginated users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const offset = (page - 1) * limit;
  try {
    const [rows] = await db.query('SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?', [limit, offset]);
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
    res.json({ users: rows, total });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get and update app settings (version, theme)
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM app_settings LIMIT 1');
    res.json(rows[0] || {});
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', authenticateToken, requireAdmin, async (req, res) => {
  const { version, theme } = req.body;
  try {
    await db.query('UPDATE app_settings SET version = ?, theme = ? WHERE id = 1', [version, theme]);
    res.json({ message: 'Settings updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CRUD for static pages
router.get('/pages', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pages');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/pages/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    await db.query('UPDATE pages SET title = ?, content = ? WHERE id = ?', [title, content, id]);
    res.json({ message: 'Page updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Version history endpoints for admin
router.get('/version-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT version, release_date FROM version_history WHERE id = 1');
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/version-history', authenticateToken, requireAdmin, async (req, res) => {
  const { version, release_date } = req.body;
  try {
    await db.query('UPDATE version_history SET version = ?, release_date = ? WHERE id = 1', [version, release_date]);
    res.json({ message: 'Version history updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Analytics endpoints
router.get('/analytics/total-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM users');
    res.json({ total });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/analytics/last-7-days-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM users WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)'
    );
    res.json({ total });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Broadcast custom push notification to all users with push subscriptions
router.post('/push-broadcast', authenticateToken, requireAdmin, async (req, res) => {
  const { title, body, url, icon } = req.body;
  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }
  try {
    // Get all push subscriptions
    const [subs] = await db.query('SELECT * FROM user_push_subscriptions');
    if (!subs.length) return res.json({ status: 'ok', sent: 0 });
    // Setup web-push
    const webpush = require('web-push');
    webpush.setVapidDetails(
      'mailto:info@subman.org',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    let sent = 0;
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/icon-192x192.png',
      data: url ? { url } : undefined,
      requireInteraction: true
    });
    for (const sub of subs) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth }
        }, payload);
        sent++;
      } catch (err) {
        // Ignore failed push (unsubscribed, etc.)
      }
    }
    res.json({ status: 'ok', sent });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
