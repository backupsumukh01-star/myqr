'use strict';

const { query } = require('../config/db');

function num(value) {
  return Number(value || 0);
}

const ScanLog = {
  async create(entry) {
    const rows = await query(
      `INSERT INTO scan_logs
        (qr_code_id, ip_address, country, city, device, browser, platform, user_agent, referer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
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
    return rows[0].id;
  },

  async list({ search, page, limit, qrId }) {
    const where = [];
    const params = [];

    if (qrId) {
      where.push('s.qr_code_id = ?');
      params.push(qrId);
    }
    if (search) {
      where.push(
        '(q.code ILIKE ? OR q.title ILIKE ? OR s.ip_address ILIKE ? OR s.country ILIKE ? OR s.browser ILIKE ?)'
      );
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
    const total = num(countRows[0].total);

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
      [...params, Number(limit), Number(offset)]
    );

    return {
      items: rows,
      total,
      page,
      limit,
      pages: Math.max(1, Math.ceil(total / limit))
    };
  },

  async recent(limit = 8) {
    return query(
      `SELECT s.id, s.created_at, s.country, s.city, s.browser, s.platform, q.code, q.title
       FROM scan_logs s
       INNER JOIN qr_codes q ON q.id = s.qr_code_id
       ORDER BY s.created_at DESC
       LIMIT ?`,
      [Number(limit)]
    );
  },

  async todayCount() {
    const rows = await query(
      `SELECT COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= DATE_TRUNC('day', NOW())`
    );
    return num(rows[0].total);
  },

  async monthCount() {
    const rows = await query(
      `SELECT COUNT(*) AS total
       FROM scan_logs
       WHERE created_at >= DATE_TRUNC('month', NOW())`
    );
    return num(rows[0].total);
  },

  async dailySeries(days = 14) {
    return query(
      `SELECT to_char(created_at::date, 'YYYY-MM-DD') AS day, COUNT(*)::int AS total
       FROM scan_logs
       WHERE created_at >= (CURRENT_DATE - (? || ' days')::interval)
       GROUP BY created_at::date
       ORDER BY day ASC`,
      [String(days)]
    );
  },

  async monthlySeries(months = 12) {
    return query(
      `SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)::int AS total
       FROM scan_logs
       WHERE created_at >= (CURRENT_DATE - (? || ' months')::interval)
       GROUP BY date_trunc('month', created_at)
       ORDER BY month ASC`,
      [String(months)]
    );
  }
};

module.exports = ScanLog;
