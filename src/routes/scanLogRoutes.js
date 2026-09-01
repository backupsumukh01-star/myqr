'use strict';

const express = require('express');
const scanLogController = require('../controllers/scanLogController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.get('/', scanLogController.list);

module.exports = router;
