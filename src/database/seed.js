'use strict';

const bcrypt = require('bcryptjs');
const env = require('../config/env');
const { ping } = require('../config/db');
const Admin = require('../models/Admin');
const logger = require('../utils/logger');
const { logDbConnectionError } = require('../helpers/dbErrors');

async function seed() {
  await ping();
  const existing = await Admin.findByEmail(env.admin.email);
  if (existing) {
    logger.info(`Admin already exists: ${env.admin.email}`);
    return;
  }

  const password = await bcrypt.hash(env.admin.password, env.bcryptRounds);
  await Admin.create({
    name: env.admin.name,
    email: env.admin.email,
    password
  });
  logger.info(`Seeded admin ${env.admin.email}`);
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((error) => {
      logDbConnectionError(logger, error);
      process.exit(1);
    });
}

module.exports = seed;
