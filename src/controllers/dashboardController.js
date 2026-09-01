'use strict';

const QrCode = require('../models/QrCode');
const ScanLog = require('../models/ScanLog');
const { success } = require('../helpers/response');

async function stats(_req, res, next) {
  try {
    const summary = await QrCode.stats();
    const today = await ScanLog.todayCount();
    const monthly = await ScanLog.monthCount();
    return success(res, {
      totalQr: Number(summary.total || 0),
      totalActive: Number(summary.active || 0),
      totalDisabled: Number(summary.disabled || 0),
      totalScans: Number(summary.scans || 0),
      todayScans: Number(today || 0),
      monthlyScans: Number(monthly || 0)
    });
  } catch (error) {
    next(error);
  }
}

async function charts(_req, res, next) {
  try {
    const [daily, monthly, top, recent] = await Promise.all([
      ScanLog.dailySeries(14),
      ScanLog.monthlySeries(12),
      QrCode.top(10),
      ScanLog.recent(10)
    ]);
    return success(res, { daily, monthly, top, recent });
  } catch (error) {
    next(error);
  }
}

module.exports = { stats, charts };
