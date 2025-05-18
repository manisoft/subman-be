const pool = require('../db');

// Feedback model: save feedback to database
async function saveFeedback({ userId, title, message, createdAt }) {
    const [result] = await pool.execute(
        'INSERT INTO feedback (user_id, title, message, created_at) VALUES (?, ?, ?, ?)',
        [userId, title, message, createdAt]
    );
    return result.insertId;
}

module.exports = { saveFeedback };
