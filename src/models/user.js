const pool = require('../db');

const getUserByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

const getUserById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
};

const createUser = async ({ id, email, password, name, avatar_url, role }) => {
  await pool.query(
    'INSERT INTO users (id, email, password, name, avatar_url, role) VALUES (?, ?, ?, ?, ?, ?)',
    [id, email, password, name, avatar_url, role || 'user']
  );
};

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
};
