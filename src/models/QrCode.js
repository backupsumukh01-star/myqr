'use strict';

const { query, withTransaction } = require('../config/db');

const SORT_MAP = {
  newest: 'created_at DESC',
  oldest: 'created_at ASC',
  scans: 'scan_count DESC, id DESC',
  title: 'title ASC'
};

const QrCode = {
  async create({
    code,
    title,
    description,
    redirectUrl,
    status = 'ACTIVE',
    payloadType = 'WEB',
    twCoinId = null,
    destBaseUrl = null,
    destPath = '',
    payNetwork = null,
    payAddress = null,
    payAmount = null,
    payToken = null
  }) {
    const result = await query(
      `INSERT INTO qr_codes (
         code, title, description, redirect_url, status, payload_type, tw_coin_id,
         dest_base_url, dest_path, pay_network, pay_address, pay_amount, pay_token
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        title,
        description || null,
        redirectUrl,
        status,
        payloadType,
        twCoinId,
        destBaseUrl || null,
        destPath || '',
        payNetwork,
        payAddress,
        payAmount,
        payToken
      ]
    );
    return this.findById(result.insertId);
  },

  async findById(id) {
    const rows = await query('SELECT * FROM qr_codes WHERE id = ? LIMIT 1', [id]);
    return rows[0] || null;
  },

  async findByCode(code) {
    const rows = await query('SELECT * FROM qr_codes WHERE code = ? LIMIT 1', [code]);
    return rows[0] || null;
  },

  async update(id, fields) {
    const allowed = [
      'title',
      'description',
      'redirect_url',
      'status',
      'payload_type',
      'tw_coin_id',
      'dest_base_url',
      'dest_path',
      'pay_network',
      'pay_address',
      'pay_amount',
      'pay_token'
    ];
    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(fields)) {
      if (!allowed.includes(key) || value === undefined) continue;
      sets.push(`${key} = ?`);
      values.push(value);
    }
    if (!sets.length) return this.findById(id);
    values.push(id);
    await query(`UPDATE qr_codes SET ${sets.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  async remove(id) {
    await query('DELETE FROM qr_codes WHERE id = ?', [id]);
  },

  async list({ search, status, sort, page, limit }) {
    const where = [];
    const params = [];

    if (search) {
      where.push('(code LIKE ? OR title LIKE ? OR redirect_url LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (status === 'ACTIVE' || status === 'DISABLED') {
      where.push('status = ?');
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const orderSql = SORT_MAP[sort] || SORT_MAP.newest;
    const offset = (page - 1) * limit;

    const countRows = await query(
      `SELECT COUNT(*) AS total FROM qr_codes ${whereSql}`,
      params
    );
    const rows = await query(
      `SELECT * FROM qr_codes ${whereSql} ORDER BY ${orderSql} LIMIT ? OFFSET ?`,
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

  async stats() {
    const rows = await query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'ACTIVE') AS active,
        SUM(status = 'DISABLED') AS disabled,
        COALESCE(SUM(scan_count), 0) AS scans
      FROM qr_codes
    `);
    return rows[0];
  },

  async top(limit = 10) {
    return query(
      `SELECT id, code, title, scan_count, status
       FROM qr_codes
       ORDER BY scan_count DESC, id DESC
       LIMIT ?`,
      [limit]
    );
  },

  async recordScan(id) {
    await withTransaction(async (connection) => {
      await connection.query(
        `UPDATE qr_codes
         SET scan_count = scan_count + 1, last_scanned_at = UTC_TIMESTAMP()
         WHERE id = ?`,
        [id]
      );
    });
  }
};

module.exports = QrCode;
