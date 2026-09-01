'use strict';

const { body } = require('express-validator');

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password is required')
];

module.exports = { loginRules };
