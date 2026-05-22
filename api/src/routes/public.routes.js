const express = require('express');
const router = express.Router();
const publicCtrl = require('../controllers/public.controller');

/**
 * Public badge verification page
 * GET /public/badge/:link
 */
router.get('/badge/:link', publicCtrl.viewPublicBadge);

// Public certificate verification
router.get('/certificate/:applicationGuid', publicCtrl.viewPublicCertificate);

// Simple test route that does not hit the database — useful for local dev
router.get('/test', (req, res) => {
	const sampleVerifyUrl = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`) + '/public/badge/SAMPLE_LINK';
	if (req.query.format === 'json' || req.get('accept') === 'application/json') {
		return res.json({
			message: 'sample public badge',
			verification_url: sampleVerifyUrl,
			badge: { title: 'Sample Badge', description: 'This is a sample badge for local testing', image: 'https://via.placeholder.com/140', points: 10 },
			user: { full_name: 'Test User' }
		});
	}

	const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sample Badge</title></head><body><h1>Sample Badge</h1><p>A sample public badge page for local testing.</p><p>Verify URL: <a href="${sampleVerifyUrl}">${sampleVerifyUrl}</a></p></body></html>`;
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	res.send(html);
});

module.exports = router;
