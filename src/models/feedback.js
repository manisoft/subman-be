const pool = require('../db');

// Feedback model: save feedback to database
async function saveFeedback({ userId, userEmail, title, message, createdAt }) {
    const [result] = await pool.execute(
        'INSERT INTO feedback (user_id, user_email, title, message, created_at) VALUES (?, ?, ?, ?, ?)',
        [userId, userEmail, title, message, createdAt]
    );
    return result.insertId;
}

module.exports = { saveFeedback };
