const pool = require('../db');

const getAllPopularServices = async () => {
  const [rows] = await pool.query('SELECT * FROM popular_services');
  return rows;
};

module.exports = {
  getAllPopularServices,
};
