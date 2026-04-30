const { sequelize, models } = require('./src/config/db');

process.env.JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'test-secret-key';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';

beforeAll(async () => {
    await sequelize.sync({ force: true });

    await models.preferred_lang.create({
        preferred_lang_id: 1,
        preferred_lang: 'en'
    });
});
