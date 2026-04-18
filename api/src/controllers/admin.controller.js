const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { emailRule, loginSchema } = require('../validations/auth.validation');
const { logger } = require('../utils/logger');


module.exports = {

};