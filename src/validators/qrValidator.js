'use strict';

const { body, param, query } = require('express-validator');

const codePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]{1,62}$/;

const sharedDest = [
  body('payload_type').optional().isIn(['WEB', 'TRUST_WALLET', 'CRYPTO_PAY']),
  body('tw_coin_id').optional({ checkFalsy: true }).trim().matches(/^\d{1,16}$/),
  body('dest_base_url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true, require_tld: false }),
  body('dest_path').optional({ nullable: true }).trim().isLength({ max: 1024 }),
  body('pay_network').optional({ checkFalsy: true }).trim().isIn(['TRON', 'ETH', 'BTC', 'BNB']),
  body('pay_address').optional({ checkFalsy: true }).trim().isLength({ min: 8, max: 256 }),
  body('pay_amount').optional({ checkFalsy: true }).trim().isLength({ max: 64 }),
  body('pay_token').optional({ checkFalsy: true }).trim().isIn(['NATIVE', 'USDT', 'TRX']),
  body('redirect_url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true, require_tld: false }),
  body('tw_open_url')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: true, require_tld: false })
];

const createQrRules = [
  body('title').trim().isLength({ min: 1, max: 180 }).withMessage('Title is required'),
  body('code')
    .trim()
    .matches(codePattern)
    .withMessage('Code must be 2-63 characters: letters, numbers, dash or underscore'),
  ...sharedDest,
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('status').optional().isIn(['ACTIVE', 'DISABLED'])
];

const updateQrRules = [
  param('id').isInt({ min: 1 }),
  body('title').optional().trim().isLength({ min: 1, max: 180 }),
  body('description').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 2000 }),
  ...sharedDest,
  body('status').optional().isIn(['ACTIVE', 'DISABLED'])
];

const idParam = [param('id').isInt({ min: 1 }).withMessage('Invalid id')];

const listQuery = [
  query('search').optional().trim().isLength({ max: 180 }),
  query('status').optional().isIn(['ACTIVE', 'DISABLED', '']),
  query('sort').optional().isIn(['newest', 'oldest', 'scans', 'title']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isIn(['10', '25', '50', '100'])
];

module.exports = { createQrRules, updateQrRules, idParam, listQuery };
