'use strict';

const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  charset: 'utf8mb4',
  timezone: 'Z'
});

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function ping() {
  const rows = await query('SELECT 1 AS ok');
  return rows[0].ok === 1;
}

pool.on('connection', () => {
  logger.debug('MySQL connection established');
});

module.exports = {
  pool,
  query,
  withTransaction,
  ping
};
