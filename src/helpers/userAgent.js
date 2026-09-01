'use strict';

const UAParser = require('ua-parser-js');

function parseUserAgent(userAgent) {
  const parser = new UAParser(userAgent || '');
  const result = parser.getResult();
  const deviceType = result.device.type || 'desktop';
  const deviceModel = [result.device.vendor, result.device.model].filter(Boolean).join(' ');

  return {
    browser: [result.browser.name, result.browser.version].filter(Boolean).join(' ') || 'Unknown',
    platform: result.os.name ? [result.os.name, result.os.version].filter(Boolean).join(' ') : 'Unknown',
    device: deviceModel || deviceType
  };
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || null;
}

module.exports = { parseUserAgent, clientIp };
