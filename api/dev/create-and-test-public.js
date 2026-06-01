require('../src/config/loadEnv')();
const { sequelize, models } = require('../src/config/db');
const { Op } = require('sequelize');
const crypto = require('crypto');

async function run() {
  try {
    await sequelize.authenticate();
    console.log('DB ok');

    const application = await models.badge_applications.findOne({ order: [['application_id', 'DESC']] });
    if (!application) {
      console.error('No badge_application found in DB to attach awarded_badges to.');
      process.exit(2);
    }

    const link = crypto.randomUUID();

    const awarded = await models.awarded_badges.create({
      application_id: application.application_id,
      user_id: application.user_id || null,
      awarded_at: new Date(),
      public_verification_link: link,
      is_published: true
    });

    console.log('Created awarded_badges with link:', link);

    // Now call the public controller directly
    const publicCtrl = require('../src/controllers/public.controller');

    // Mock req/res
    const req = { params: { link }, query: { format: 'json' }, get: (h) => 'application/json' };

    let output = null;
    const res = {
      status(code) { this._status = code; return this; },
      setHeader() {},
      json(obj) { output = obj; console.log('Controller JSON output:'); console.log(JSON.stringify(obj, null, 2)); },
      send(html) { output = html; console.log('Controller HTML output (truncated):'); console.log(String(html).slice(0, 1000)); }
    };

    await publicCtrl.viewPublicBadge(req, res);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message);
    process.exit(3);
  }
}

run();
