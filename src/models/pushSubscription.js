const pool = require('../db');

const addPushSubscription = async ({ user_id, endpoint, p256dh, auth }) => {
  await pool.query(
    `REPLACE INTO user_push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)` ,
    [user_id, endpoint, p256dh, auth]
  );
};

const removePushSubscription = async (user_id, endpoint) => {
  await pool.query(
    `DELETE FROM user_push_subscriptions WHERE user_id = ? AND endpoint = ?`,
    [user_id, endpoint]
  );
};

const getPushSubscriptionsByUser = async (user_id) => {
  const [rows] = await pool.query(
    `SELECT * FROM user_push_subscriptions WHERE user_id = ?`,
    [user_id]
  );
  return rows;
};

module.exports = {
  addPushSubscription,
  removePushSubscription,
  getPushSubscriptionsByUser,
};
