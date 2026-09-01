'use strict';

const { validationResult } = require('express-validator');
const { fail } = require('../helpers/response');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  return fail(
    res,
    'Validation failed',
    422,
    errors.array().map((e) => ({ field: e.path, message: e.msg }))
  );
}

module.exports = { validate };
