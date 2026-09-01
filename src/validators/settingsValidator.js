'use strict';

const { body } = require('express-validator');

const settingsRules = [
  body('site_name').trim().isLength({ min: 1, max: 180 }).withMessage('Site name is required'),
  body('website_url')
    .trim()
    .isURL({ require_protocol: true, require_tld: false })
    .withMessage('Website URL must include http or https'),
  body('timezone').trim().isLength({ min: 1, max: 64 }).withMessage('Timezone is required')
];

module.exports = { settingsRules };
