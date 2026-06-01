require('../src/config/loadEnv')();
const { sequelize, models } = require('../src/config/db');
const { Op } = require('sequelize');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Database OK');

    const awarded = await models.awarded_badges.findOne({
      where: { public_verification_link: { [Op.ne]: null } },
      attributes: ['awarded_badges_id', 'public_verification_link', 'awarded_at'],
      order: [['awarded_badges_id', 'DESC']]
    });

    if (!awarded) {
      console.log('No awarded_badges found with public_verification_link');
      process.exit(0);
    }

    console.log('Found:', awarded.public_verification_link);
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err && err.message);
    process.exit(2);
  }
}

run();
