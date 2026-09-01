'use strict';

const express = require('express');
const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadLogo } = require('../middleware/upload');
const { settingsRules } = require('../validators/settingsValidator');

const router = express.Router();

router.use(requireAuth);
router.get('/', settingsController.get);
router.put('/', uploadLogo.single('logo'), settingsRules, validate, settingsController.update);

module.exports = router;
