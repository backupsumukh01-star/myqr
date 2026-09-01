'use strict';

const Setting = require('../models/Setting');
const { lanBaseUrls } = require('../helpers/network');
const env = require('../config/env');
const QrCode = require('../models/QrCode');
const qrService = require('../services/qrService');
const { success } = require('../helpers/response');
const { stripTrailingSlash, sanitizeText } = require('../helpers/strings');

async function get(_req, res, next) {
  try {
    const settings = await Setting.get();
    return success(res, {
      ...settings,
      lan_urls: lanBaseUrls(env.port)
    });
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const current = await Setting.get();
    const websiteUrl = stripTrailingSlash(req.body.website_url.trim());
    const logoPath = req.file ? `/uploads/logo/${req.file.filename}` : current.logo_path;

    const settings = await Setting.update({
      siteName: sanitizeText(req.body.site_name, 180),
      websiteUrl,
      logoPath,
      timezone: sanitizeText(req.body.timezone, 64)
    });

    if (websiteUrl !== current.website_url) {
      const all = await QrCode.list({ search: '', status: '', sort: 'newest', page: 1, limit: 100000 });
      await qrService.regenerateAll(websiteUrl, all.items);
    }

    return success(res, settings, 'Settings saved');
  } catch (error) {
    next(error);
  }
}

module.exports = { get, update };
