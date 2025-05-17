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
  // Find all subscriptions due today or tomorrow, with details for notification
  const [rows] = await pool.query(`
    SELECT s.user_id, s.id as subscription_id, s.name, s.price, s.logo, s.next_billing_date, s.auto_renew
    FROM subscriptions s
    WHERE s.next_billing_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 1 DAY)
      AND (s.auto_renew IS NULL OR s.auto_renew = 0)
  `);
  // Group by user
  const userMap = {};
  for (const row of rows) {
    if (!userMap[row.user_id]) userMap[row.user_id] = [];
    userMap[row.user_id].push(row);
  }
  return userMap;
}

async function sendPushToUser(userId, subs) {
  const pushSubs = await pushModel.getPushSubscriptionsByUser(userId);
  for (const sub of subs) {
    // Determine if due today or tomorrow
    const diffDays = Math.floor((new Date(sub.next_billing_date) - new Date()) / (1000 * 60 * 60 * 24));
    let title = '';
    if (diffDays === 1) {
      title = `Upcoming payment: ${sub.name}`;
    } else if (diffDays === 0) {
      title = `Payment due today: ${sub.name}`;
    } else {
      continue;
    }
    const payload = {
      title,
      body: `Amount: $${Number(sub.price).toFixed(2)}`,
      icon: sub.logo || '/icon-192x192.png',
      tag: `subman-payment-${sub.subscription_id}`,
      data: { url: `/subscription/${sub.subscription_id}` },
      badge: '/badge-72x72.png',
      requireInteraction: true
    };
    for (const pushSub of pushSubs) {
      try {
        await webpush.sendNotification({
          endpoint: pushSub.endpoint,
          keys: {
            p256dh: pushSub.p256dh,
            auth: pushSub.auth
          }
        }, JSON.stringify(payload));
      } catch (err) {
        // Ignore failed push (unsubscribed, etc.)
        console.error('Push error:', err.message);
      }
    }
  }
}

async function notifyDueSubscriptions() {
  const usersDue = await getUsersWithDueSubscriptions();
  for (const [userId, subs] of Object.entries(usersDue)) {
    await sendPushToUser(userId, subs);
  }
  console.log('Due subscription notifications sent.');
}

if (require.main === module) {
  notifyDueSubscriptions()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error sending due subscription notifications:', err);
      process.exit(1);
    });
}
