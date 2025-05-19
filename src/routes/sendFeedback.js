const express = require('express');
const router = express.Router();
const { saveFeedback } = require('../models/feedback');

// POST /api/send-feedback
router.post('/', async (req, res) => {
    const { title, message, userId, userEmail } = req.body;
    if (!title || !message) {
        return res.status(400).json({ error: 'Missing title or message' });
    }
    try {
        const createdAt = new Date();
        await saveFeedback({ userId, userEmail, title, message, createdAt });
        res.json({ success: true });
    } catch (err) {
        console.error('Feedback DB error:', err);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

module.exports = router;
