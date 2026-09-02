'use strict';

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const databaseUrl = process.env.DATABASE_URL || '';
const sslEnv = String(process.env.DB_SSL || '').toLowerCase();
const ssl =
  sslEnv === 'true' || sslEnv === '1'
    ? true
    : sslEnv === 'false' || sslEnv === '0'
      ? false
      : Boolean(databaseUrl) || process.env.NODE_ENV === 'production';

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  appBaseUrl: (process.env.APP_BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  trustProxy: String(process.env.TRUST_PROXY || 'false') === 'true',
  db: {
    url: databaseUrl,
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'dynamic_qr',
    ssl
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev_only_change_me'),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    cookieName: process.env.COOKIE_NAME || 'dqr_token'
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 12),
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX || 200),
    loginMax: Number(process.env.LOGIN_RATE_LIMIT_MAX || 10)
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123'
  }
};

module.exports = env;
