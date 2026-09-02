'use strict';

const logger = require('../utils/logger');
const { fail } = require('../helpers/response');

function notFound(req, res, next) {
  if (req.path.startsWith('/api')) {
    return fail(res, 'Endpoint not found', 404);
  }
  return next();
}

function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) logger.error(err.message, err.stack);
  else logger.warn(err.message);

  if (err.code === 'ER_DUP_ENTRY') {
    return fail(res, 'Duplicate value. That short code already exists.', 409);
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return fail(res, 'File is too large', 413);
  }

  const message =
    status === 500 && process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  if (req.path.startsWith('/api') || req.xhr) {
    return fail(res, message, status);
  }

  return res.status(status).render('errors/500', {
    title: 'Server error',
    message
  });
}

module.exports = { notFound, errorHandler };
