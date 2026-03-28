const { Sequelize } = require('sequelize');
const { initModels } = require('../models/init-models');
const loadEnvironment = require('./loadEnv');
const { logger } = require('../utils/logger');

loadEnvironment();

const sequelize = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USER,
	process.env.DB_PASS,
	{
		host: process.env.DB_HOST,
		dialect: 'postgres',
		port: process.env.DB_PORT,
		logging: false,
		define: {
			underscored: true,
			timestamps: true
		}
	}
);

const models = initModels(sequelize);

module.exports = { 
	sequelize, 
	models 
};