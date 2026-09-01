'use strict';

const Setting = require('../models/Setting');

async function render(view, extra = {}) {
  const settings = await Setting.get();
  return { settings, ...extra };
}

async function loginPage(_req, res, next) {
  try {
    res.render('login', await render('login', { title: 'Sign in', layout: false }));
  } catch (error) {
    next(error);
  }
}

async function dashboardPage(_req, res, next) {
  try {
    res.render('dashboard', await render('dashboard', { title: 'Dashboard', page: 'dashboard' }));
  } catch (error) {
    next(error);
  }
}

async function qrPage(_req, res, next) {
  try {
    res.render('qr/index', await render('qr', { title: 'QR Codes', page: 'qr' }));
  } catch (error) {
    next(error);
  }
}

async function qrFormPage(req, res, next) {
  try {
    const isEdit = Boolean(req.params.id);
    res.render('qr/form', await render('qr-form', {
      title: isEdit ? 'Edit QR' : 'Create QR',
      page: 'qr',
      qrId: req.params.id || ''
    }));
  } catch (error) {
    next(error);
  }
}

async function qrViewPage(req, res, next) {
  try {
    res.render('qr/view', await render('qr-view', {
      title: 'QR details',
      page: 'qr',
      qrId: req.params.id
    }));
  } catch (error) {
    next(error);
  }
}

async function logsPage(_req, res, next) {
  try {
    res.render('logs/index', await render('logs', { title: 'Scan logs', page: 'logs' }));
  } catch (error) {
    next(error);
  }
}

async function settingsPage(_req, res, next) {
  try {
    res.render('settings/index', await render('settings', { title: 'Settings', page: 'settings' }));
  } catch (error) {
    next(error);
  }
}

module.exports = {
  loginPage,
  dashboardPage,
  qrPage,
  qrFormPage,
  qrViewPage,
  logsPage,
  settingsPage
};
