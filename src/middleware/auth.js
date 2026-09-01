'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { fail } = require('../helpers/response');

function readToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return req.cookies?.[env.jwt.cookieName] || null;
}

function requireAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return fail(res, 'Authentication required', 401);
  }
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    return next();
  } catch {
    return fail(res, 'Invalid or expired session', 401);
  }
}

function optionalAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.jwt.secret);
  } catch {
    req.user = null;
  }
  next();
}

function requirePageAuth(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.redirect('/login');
  }
  try {
    req.user = jwt.verify(token, env.jwt.secret);
    return next();
  } catch {
    res.clearCookie(env.jwt.cookieName);
    return res.redirect('/login');
  }
}

function redirectIfAuthed(req, res, next) {
  const token = readToken(req);
  if (!token) return next();
  try {
    jwt.verify(token, env.jwt.secret);
    return res.redirect('/dashboard');
  } catch {
    return next();
  }
}

module.exports = {
  requireAuth,
  optionalAuth,
  requirePageAuth,
  redirectIfAuthed,
  readToken
};
