'use strict';

const express = require('express');
const redirectController = require('../controllers/redirectController');
const { redirectLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/:code/s/:stamp', redirectLimiter, redirectController.serveScan);
router.get('/:code', redirectLimiter, redirectController.entry);

module.exports = router;
