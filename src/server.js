'use strict';

const fs = require('fs/promises');
const path = require('path');
const env = require('./config/env');
const { ping } = require('./config/db');
const logger = require('./utils/logger');
const createApp = require('./app');
const seed = require('./database/seed');
const { logDbConnectionError } = require('./helpers/dbErrors');

async function start() {
  await fs.mkdir(path.join(__dirname, '../uploads/qr'), { recursive: true });
  await fs.mkdir(path.join(__dirname, '../uploads/logo'), { recursive: true });
  await ping();
  logger.info(`PostgreSQL connected`);
  await seed();

  const app = createApp();
  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`Dynamic QR running on ${env.appBaseUrl}`);
    logger.info(`API docs: ${env.appBaseUrl}/docs`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server');
  logDbConnectionError(logger, error);
  process.exit(1);
});
