const pool = require('../db');

const getSubscriptionsByUser = async (user_id) => {
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE user_id = ?', [user_id]);
  return rows;
};

const getSubscriptionById = async (id, user_id) => {
  const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ? AND user_id = ?', [id, user_id]);
  return rows[0];
};

const createSubscription = async (sub) => {
  await pool.query(
    `INSERT INTO subscriptions (id, user_id, name, price, billing_cycle, category, description, next_billing_date, color, logo, website, notes, currency, auto_renew) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [sub.id, sub.user_id, sub.name, sub.price, sub.billing_cycle, sub.category, sub.description, sub.next_billing_date, sub.color, sub.logo, sub.website, sub.notes, sub.currency || 'USD', sub.auto_renew ? 1 : 0]
  );
};

const updateSubscription = async (id, user_id, sub) => {
  await pool.query(
    `UPDATE subscriptions SET name=?, price=?, billing_cycle=?, category=?, description=?, next_billing_date=?, color=?, logo=?, website=?, notes=?, currency=?, auto_renew=? WHERE id=? AND user_id=?`,
    [sub.name, sub.price, sub.billing_cycle, sub.category, sub.description, sub.next_billing_date, sub.color, sub.logo, sub.website, sub.notes, sub.currency || 'USD', sub.auto_renew ? 1 : 0, id, user_id]
  );
};

const deleteSubscription = async (id, user_id) => {
  await pool.query('DELETE FROM subscriptions WHERE id = ? AND user_id = ?', [id, user_id]);
};

module.exports = {
  getSubscriptionsByUser,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
};
