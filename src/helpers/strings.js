'use strict';

function normalizeCode(code) {
  return String(code || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '');
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/+$/, '');
}

function buildScanUrl(websiteUrl, code) {
  return `${stripTrailingSlash(websiteUrl)}/r/${code}`;
}

function sanitizeText(value, max = 2000) {
  if (value === undefined || value === null) return null;
  return String(value).replace(/[<>]/g, '').trim().slice(0, max);
}

module.exports = {
  normalizeCode,
  isValidHttpUrl,
  stripTrailingSlash,
  buildScanUrl,
  sanitizeText
};
