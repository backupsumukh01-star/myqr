'use strict';

const express = require('express');
const qrController = require('../controllers/qrController');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { uploadCsv } = require('../middleware/upload');
const { createQrRules, updateQrRules, idParam, listQuery } = require('../validators/qrValidator');

const router = express.Router();

router.use(requireAuth);

router.get('/export.csv', qrController.exportCsv);
router.post('/bulk', qrController.bulkCreate);
router.post('/import', uploadCsv.single('file'), qrController.importCsv);
router.get('/', listQuery, validate, qrController.list);
router.post('/', createQrRules, validate, qrController.create);
router.get('/:id', idParam, validate, qrController.getOne);
router.put('/:id', updateQrRules, validate, qrController.update);
router.delete('/:id', idParam, validate, qrController.remove);
router.get('/:id/download/:format', idParam, validate, qrController.download);

module.exports = router;
