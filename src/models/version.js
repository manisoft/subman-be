const db = require('../db');

async function getLatestVersion() {
  const [rows] = await db.query('SELECT version, release_date FROM version_history ORDER BY release_date DESC LIMIT 1');
  return rows[0];
}

module.exports = {
  getLatestVersion,
};
