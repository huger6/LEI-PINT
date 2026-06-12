const { sequelize, models } = require('./src/config/db');

process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

beforeAll(async () => {
    await sequelize.sync({ force: true });

    await models.languages.create({
        language_id: 1,
        language_iso: 'en-GB',
        language_name: 'English (UK)'
    });
});

