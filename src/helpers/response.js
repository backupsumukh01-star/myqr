'use strict';

function success(res, data, message = 'OK', status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function fail(res, message = 'Request failed', status = 400, errors = null) {
  return res.status(status).json({
    success: false,
    message,
    errors
  });
}

module.exports = { success, fail };
