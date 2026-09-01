'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Admin = require('../models/Admin');
const { success, fail } = require('../helpers/response');

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/'
  };
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      return fail(res, 'Invalid email or password', 401);
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      return fail(res, 'Invalid email or password', 401);
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name },
      env.jwt.secret,
      { expiresIn: env.jwt.expiresIn }
    );

    res.cookie(env.jwt.cookieName, token, cookieOptions());
    return success(res, {
      token,
      admin: { id: admin.id, name: admin.name, email: admin.email }
    }, 'Logged in');
  } catch (error) {
    next(error);
  }
}

function logout(_req, res) {
  res.clearCookie(env.jwt.cookieName, { path: '/' });
  return success(res, null, 'Logged out');
}

async function me(req, res, next) {
  try {
    const admin = await Admin.findById(req.user.id);
    if (!admin) return fail(res, 'Account not found', 404);
    return success(res, admin);
  } catch (error) {
    next(error);
  }
}

module.exports = { login, logout, me };
