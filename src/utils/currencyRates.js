const axios = require('axios');
const pool = require('../db');
const CURRENCIES = require('../currencies.json');
const APP_ID = process.env.OPENEXCHANGERATES_APP_ID;
const API_URL = `https://openexchangerates.org/api/latest.json?app_id=${APP_ID}`;

async function updateExchangeRatesIfNeeded() {
    // Get last update time
    const [rows] = await pool.query('SELECT MAX(last_updated) as last_updated FROM currencies');
    const lastUpdated = rows[0]?.last_updated;
    const now = new Date();
    if (lastUpdated && (now - new Date(lastUpdated)) < 12 * 60 * 60 * 1000) {
        // Less than 12 hours old, skip update
        return;
    }
    // Fetch from openexchangerates.org
    const res = await axios.get(API_URL);
    const rates = res.data.rates;
    const base = res.data.base || 'USD';
    const updated = new Date();
    // Update each currency in DB
    for (const code of Object.keys(CURRENCIES)) {
        const rate = rates[code];
        if (!rate) continue;
        await pool.query(
            'INSERT INTO currencies (code, name, rate_to_usd, last_updated) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE rate_to_usd = VALUES(rate_to_usd), last_updated = VALUES(last_updated), name = VALUES(name)',
            [code, CURRENCIES[code], rate, updated]
        );
    }
}

async function getAllCurrencies() {
    await updateExchangeRatesIfNeeded();
    const [rows] = await pool.query('SELECT code, name, rate_to_usd, last_updated FROM currencies');
    return rows;
}

module.exports = {
    updateExchangeRatesIfNeeded,
    getAllCurrencies,
};
