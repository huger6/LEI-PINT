const { Pool } = require('pg');
const loadEnvironment = require('./loadEnv');
const { logger } = require('../utils/logger');

loadEnvironment();

const pool = new Pool({
	user: process.env.DB_USER,
	host: process.env.DB_HOST,
	database: process.env.DB_NAME,
	password: process.env.DB_PASS,
	port: process.env.DB_PORT,
});

pool.on('connect', () => {
	logger.info('PostgreSQL: DB pool connected');
});

module.exports = {
	query: (text, params) => pool.query(text, params),
	testConnection: async () => {
		await pool.query('SELECT 1');
	},
};