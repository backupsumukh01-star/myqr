'use strict';

const { query } = require('../config/db');

const Admin = {
  async findByEmail(email) {
    const rows = await query('SELECT * FROM admins WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const rows = await query(
      'SELECT id, name, email, created_at, updated_at FROM admins WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ name, email, password }) {
    const result = await query(
      'INSERT INTO admins (name, email, password) VALUES (?, ?, ?)',
      [name, email, password]
    );
    return result.insertId;
  },

  async count() {
    const rows = await query('SELECT COUNT(*) AS total FROM admins');
    return rows[0].total;
  }
};

module.exports = Admin;
