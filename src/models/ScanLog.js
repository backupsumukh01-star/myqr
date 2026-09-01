'use strict';

const { query } = require('../config/db');

const ScanLog = {
  async create(entry) {
    const result = await query(
      `INSERT INTO scan_logs
        (qr_code_id, ip_address, country, city, device, browser, platform, user_agent, referer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.qrCodeId,
        entry.ipAddress || null,
        entry.country || null,
        entry.city || null,
        entry.device || null,
        entry.browser || null,
        entry.platform || null,
        entry.userAgent || null,
        entry.referer || null
      ]
    );
    return result.insertId;
  },

  async list({ search, page, limit, qrId }) {
    const where = [];
    const params = [];

    if (qrId) {
      where.push('s.qr_code_id = ?');
      params.push(qrId);
    }
    if (search) {
      where.push('(q.code LIKE ? OR q.title LIKE ? OR s.ip_address LIKE ? OR s.country LIKE ? OR s.browser LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const countRows = await query(
      `SELECT COUNT(*) AS total
       FROM scan_logs s
       INNER JOIN qr_codes q ON q.id = s.qr_code_id
       ${whereSql}`,
      params
    );

    const rows = await query(
      `SELECT
         s.id, s.qr_code_id, s.ip_address, s.country, s.city, s.device,
         s.browser, s.platform, s.user_agent, s.referer, s.created_at,
         q.code, q.title
       FROM scan_logs s
       INNER JOIN qr_codes q ON q.id = s.qr_code_id
       ${whereSql}
       ORDER BY s.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return {
      items: rows,
      total: countRows[0].total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(countRows[0].total / limit))
    };
  },

  async recent(limit = 8) {
    return query(
      `SELECT s.id, s.created_at, s.country, s.city, s.browser, s.platform, q.code, q.title
       FROM scan_logs s
       INNER JOIN qr_codes q ON q.id = s.qr_code_id
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [limit]
    );
  },

  async todayCount() {
    const rows = await query(
      `SELECT COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= UTC_DATE()`
    );
    return rows[0].total;
  },

  async monthCount() {
    const rows = await query(
      `SELECT COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= DATE_FORMAT(UTC_TIMESTAMP(), '%Y-%m-01')`
    );
    return rows[0].total;
  },

  async dailySeries(days = 14) {
    return query(
      `SELECT DATE(created_at) AS day, COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= DATE_SUB(UTC_DATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY day ASC`,
      [days]
    );
  },

  async monthlySeries(months = 12) {
    return query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= DATE_SUB(UTC_DATE(), INTERVAL ? MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month ASC`,
      [months]
    );
  }
};

module.exports = ScanLog;
