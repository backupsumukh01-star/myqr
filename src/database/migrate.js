'use strict';

const fs = require('fs');
const path = require('path');
const env = require('../config/env');
const logger = require('../utils/logger');
const { logDbConnectionError } = require('../helpers/dbErrors');
const { pool } = require('../config/db');

async function migrate() {
  const sqlPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  await pool.query(sql);

  const extras = [
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS tw_coin_id VARCHAR(16) NULL',
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS dest_base_url VARCHAR(1024) NULL',
    "ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS dest_path VARCHAR(1024) NOT NULL DEFAULT ''",
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS pay_network VARCHAR(32) NULL',
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS pay_address VARCHAR(256) NULL',
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS pay_amount VARCHAR(64) NULL',
    'ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS pay_token VARCHAR(32) NULL'
  ];
  for (const statement of extras) {
    await pool.query(statement);
  }

  logger.info(`PostgreSQL schema applied (${env.db.url ? 'DATABASE_URL' : env.db.host})`);
}

if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch((error) => {
      logDbConnectionError(logger, error);
      process.exit(1);
    });
}

module.exports = migrate;
