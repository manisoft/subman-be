// notifyDueSubscriptions.js
// Scheduled job to send push notifications for due subscriptions
require('dotenv').config();
const webpush = require('web-push');
const pool = require('./db');
const pushModel = require('./models/pushSubscription');
const subModel = require('./models/subscription');

webpush.setVapidDetails(
  'mailto:info@subman.org',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getUsersWithDueSubscriptions() {
  // Find all subscriptions due today or tomorrow
  const [rows] = await pool.query(`
    SELECT s.user_id, s.name, s.next_billing_date
    FROM subscriptions s
    WHERE s.next_billing_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
  `);
  // Group by user
  const userMap = {};
  for (const row of rows) {
    if (!userMap[row.user_id]) userMap[row.user_id] = [];
    userMap[row.user_id].push(row);
  }
  return userMap;
}

async function sendPushToUser(userId, message) {
  const subs = await pushModel.getPushSubscriptionsByUser(userId);
  for (const sub of subs) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth
        }
      }, JSON.stringify(message));
    } catch (err) {
      // Ignore failed push (unsubscribed, etc.)
      console.error('Push error:', err.message);
    }
  }
}

async function notifyDueSubscriptions() {
  const usersDue = await getUsersWithDueSubscriptions();
  for (const [userId, subs] of Object.entries(usersDue)) {
    let body = '';
    if (subs.length === 1) {
      body = `Your subscription "${subs[0].name}" is due on ${subs[0].next_billing_date}`;
    } else {
      body = `You have ${subs.length} subscriptions due soon!`;
    }
    await sendPushToUser(userId, {
      title: 'Subscription Due Reminder',
      body,
      url: 'https://subman.org/'
    });
  }
  console.log('Due subscription notifications sent.');
}

if (require.main === module) {
  notifyDueSubscriptions().then(() => process.exit(0));
}
