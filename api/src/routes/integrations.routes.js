const express = require('express');
const router = express.Router();

const { loginRequired, isAdmin } = require('../middlewares/auth.middleware');
const integrationsCtrl = require('../controllers/integrations.controller');

router.get('/', loginRequired, isAdmin, integrationsCtrl.listWebhooks);
router.post('/', loginRequired, isAdmin, integrationsCtrl.createWebhook);
router.delete('/:id', loginRequired, isAdmin, integrationsCtrl.deleteWebhook);
router.patch('/:id/toggle', loginRequired, isAdmin, integrationsCtrl.toggleWebhook);
router.post('/:id/test', loginRequired, isAdmin, integrationsCtrl.testWebhook);

module.exports = router;
