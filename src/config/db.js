'use strict';

const { Pool } = require('pg');
const env = require('./env');
const logger = require('../utils/logger');

function toPg(sql) {
  let index = 0;
  return String(sql).replace(/\?/g, () => `$${++index}`);
}

function poolConfig() {
  const ssl =
    env.db.ssl === true
      ? { rejectUnauthorized: false }
      : env.db.ssl === false
        ? false
        : undefined;

  if (env.db.url) {
    return {
      connectionString: env.db.url,
      ssl: ssl === undefined ? { rejectUnauthorized: false } : ssl,
      max: 10
    };
  }

  return {
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    ssl: ssl || false,
    max: 10
  };
}

const pool = new Pool(poolConfig());

pool.on('connect', () => {
  logger.debug('PostgreSQL connection established');
});

async function query(sql, params = []) {
  const result = await pool.query(toPg(sql), params);
  return result.rows;
}

async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work({
      query: async (sql, params = []) => {
        const res = await client.query(toPg(sql), params);
        return res.rows;
      }
    });
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function ping() {
  const rows = await query('SELECT 1 AS ok');
  return Number(rows[0].ok) === 1;
}

module.exports = {
  pool,
  query,
  withTransaction,
  ping
};
