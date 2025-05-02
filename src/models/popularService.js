const pool = require('../db');
const { v4: uuidv4 } = require('uuid');

const getAllPopularServices = async () => {
  const [rows] = await pool.query('SELECT * FROM popular_services');
  return rows;
};

const getPopularServiceById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM popular_services WHERE id = ?', [id]);
  return rows[0];
};

const addPopularService = async (service) => {
  const { name, logo, color, categories, version } = service;
  const id = uuidv4();
  await pool.query(
    'INSERT INTO popular_services (id, name, logo, color, categories, version) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, logo, color, categories, version || null]
  );
};

const updatePopularService = async (id, service) => {
  const { name, logo, color, categories } = service;
  await pool.query(
    'UPDATE popular_services SET name = ?, logo = ?, color = ?, categories = ? WHERE id = ?',
    [name, logo, color, categories, id]
  );
};

const deletePopularService = async (id) => {
  await pool.query('DELETE FROM popular_services WHERE id = ?', [id]);
};

module.exports = {
  getAllPopularServices,
  getPopularServiceById,
  addPopularService,
  updatePopularService,
  deletePopularService,
};
