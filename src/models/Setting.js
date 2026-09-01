'use strict';

const { query } = require('../config/db');

const Setting = {
  async get() {
    const rows = await query('SELECT * FROM settings WHERE id = 1 LIMIT 1');
    return rows[0] || null;
  },

  async update({ siteName, websiteUrl, logoPath, timezone }) {
    const current = await this.get();
    await query(
      `UPDATE settings
       SET site_name = ?, website_url = ?, logo_path = ?, timezone = ?
       WHERE id = 1`,
      [
        siteName ?? current.site_name,
        websiteUrl ?? current.website_url,
        logoPath === undefined ? current.logo_path : logoPath,
        timezone ?? current.timezone
      ]
    );
    return this.get();
  }
};

module.exports = Setting;
