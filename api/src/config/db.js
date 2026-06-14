const { Sequelize } = require('sequelize');
const { initModels } = require('../models/init-models');
const loadEnvironment = require('./loadEnv');
const { logger } = require('../utils/logger');

loadEnvironment();

let sequelize;

const sanitizeModelsForTest = (modelsObject) => {
	for (const model of Object.values(modelsObject)) {
		model.options.schema = undefined;
		model._schema = undefined;
		model._schemaDelimiter = '';

		for (const attribute of Object.values(model.rawAttributes)) {
			delete attribute.references;
			delete attribute.onDelete;
			delete attribute.onUpdate;

			if (attribute.defaultValue && attribute.defaultValue.constructor && attribute.defaultValue.constructor.name === 'Fn') {
				attribute.defaultValue = Sequelize.literal('CURRENT_TIMESTAMP');
			}
		}

		model.options.indexes = [];
		model.refreshAttributes();
	}
};

if (process.env.NODE_ENV === 'test') {
	sequelize = new Sequelize({
		dialect: 'sqlite',
		storage: ':memory:',
		logging: false,
		define: {
			underscored: true,
			timestamps: true
		}
	});
} else {
	const useSSL = process.env.DB_SSL !== 'false' && (
		process.env.DB_SSL === 'true' ||
		(process.env.DB_HOST && (
			process.env.DB_HOST.includes('.neon.tech') ||
			process.env.DB_HOST.includes('.amazonaws.com') ||
			process.env.DB_HOST.includes('.azure.com')
		))
	);

	sequelize = new Sequelize(
		process.env.DB_NAME,
		process.env.DB_USER,
		process.env.DB_PASSWORD,
		{
			host: process.env.DB_HOST,
			dialect: 'postgres',
			port: process.env.DB_PORT || 5432,
			logging: false,
			...(useSSL && {
				dialectOptions: {
					ssl: {
						require: true,
						rejectUnauthorized: true
					}
				}
			}),
			define: {
				underscored: true,
				timestamps: true
			}
		}
	);
}

const models = initModels(sequelize);

if (process.env.NODE_ENV === 'test') {
	sanitizeModelsForTest(models);
}

module.exports = {
sequelize,
models
};
