require('../src/config/loadEnv')();
const { sequelize, models } = require('../src/config/db');
const certificateService = require('../src/services/certificate.service');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB ok');

    // Find an Accepted application, or pick any and temporarily mark as Accepted
    let app = await models.badge_applications.findOne({ where: { application_state: 'Accepted' }, order: [['application_id','DESC']] });
    let restored = false;
    if (!app) {
      app = await models.badge_applications.findOne({ order: [['application_id','DESC']] });
      if (!app) {
        console.error('No application at all found in DB to generate certificate for');
        process.exit(2);
      }
      // Save original state
      const originalState = app.application_state;
      await app.update({ application_state: 'Accepted', closed_at: new Date() });
      restored = true;
      // reload
      app = await models.badge_applications.findByPk(app.application_id);
      console.log('Temporarily promoted application to Accepted for testing (will restore).');
      // store originalState on instance for later
      app._original_state = originalState;
    }

    const applicationGuid = app.application_guid;
    console.log('Using applicationGuid:', applicationGuid);

    const result = await certificateService.getOrCreateCertificate(applicationGuid, 'pt', null);
    console.log('Certificate result:', result);

    // Restore original state if we modified it
    if (app._original_state) {
      await app.update({ application_state: app._original_state });
      console.log('Restored original application state.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message);
    process.exit(3);
  }
}

run();
