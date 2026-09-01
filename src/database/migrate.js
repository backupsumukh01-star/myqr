'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const env = require('../config/env');
const logger = require('../utils/logger');
const { logDbConnectionError } = require('../helpers/dbErrors');

async function migrate() {
  const sqlPath = path.join(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const connection = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: true
  });

  await connection.query(sql);

  const alters = [
    "ALTER TABLE dynamic_qr.qr_codes MODIFY COLUMN payload_type ENUM('WEB', 'TRUST_WALLET', 'CRYPTO_PAY') NOT NULL DEFAULT 'WEB'",
    'ALTER TABLE dynamic_qr.qr_codes ADD COLUMN tw_coin_id VARCHAR(16) NULL',
    'ALTER TABLE dynamic_qr.qr_codes ADD COLUMN dest_base_url VARCHAR(1024) NULL',
    "ALTER TABLE dynamic_qr.qr_codes ADD COLUMN dest_path VARCHAR(1024) NOT NULL DEFAULT ''",
    'ALTER TABLE dynamic_qr.qr_codes ADD COLUMN pay_network VARCHAR(32) NULL',
    'ALTER TABLE dynamic_qr.qr_codes ADD COLUMN pay_address VARCHAR(256) NULL',
    'ALTER TABLE dynamic_qr.qr_codes ADD COLUMN pay_amount VARCHAR(64) NULL',
    "ALTER TABLE dynamic_qr.qr_codes ADD COLUMN pay_token VARCHAR(32) NULL"
  ];
  for (const statement of alters) {
    try {
      await connection.query(statement);
    } catch (error) {
      if (error.errno !== 1060) throw error;
    }
  }

  await connection.end();
  logger.info('Database schema applied');
}

if (require.main === module) {
  migrate().catch((error) => {
    logDbConnectionError(logger, error);
    process.exit(1);
  });
}

module.exports = migrate;
