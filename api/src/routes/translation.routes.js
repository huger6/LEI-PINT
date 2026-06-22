const express = require('express');
const { loginRequired } = require('../middlewares/auth.middleware');
const translationCtrl = require('../controllers/translation.controller');

const router = express.Router();

router.post('/', loginRequired, translationCtrl.translate);

module.exports = router;
