'use strict';

const ScanLog = require('../models/ScanLog');
const { success } = require('../helpers/response');

async function list(req, res, next) {
  try {
    const result = await ScanLog.list({
      search: req.query.search || '',
      qrId: req.query.qr_id || null,
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 25)
    });
    return success(res, result);
  } catch (error) {
    next(error);
  }
}

module.exports = { list };
