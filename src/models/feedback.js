const pool = require('../db');

// Feedback model: save feedback to database
async function saveFeedback({ userId, userEmail, title, message, createdAt }) {
    const [result] = await pool.execute(
        'INSERT INTO feedback (user_id, user_email, title, message, created_at) VALUES (?, ?, ?, ?, ?)',
        [userId, userEmail, title, message, createdAt]
    );
    return result.insertId;
}

// Get paginated feedback with optional search
async function getFeedbackPaginated({ page = 1, limit = 50, search = '' }) {
    const offset = (page - 1) * limit;
    let where = '';
    let params = [];
    if (search) {
        where = 'WHERE title LIKE ? OR message LIKE ?';
        params = [`%${search}%`, `%${search}%`];
    }
    const [rows] = await pool.query(
        `SELECT * FROM feedback ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
    );
    const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) as total FROM feedback ${where}`,
        params
    );
    return { feedback: rows, total };
}

module.exports = { saveFeedback, getFeedbackPaginated };
