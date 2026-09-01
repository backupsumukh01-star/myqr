'use strict';

const { stripTrailingSlash } = require('./strings');

function splitDestination(fullUrl) {
  const raw = String(fullUrl || '').trim();
  try {
    const url = new URL(raw);
    const destPath = `${url.pathname.replace(/^\/+|\/+$/g, '')}${url.search || ''}${url.hash || ''}`;
    return {
      destBaseUrl: url.origin,
      destPath,
      redirectUrl: raw
    };
  } catch {
    return { destBaseUrl: raw, destPath: '', redirectUrl: raw };
  }
}

function joinBasePath(base, pathValue) {
  const destBaseUrl = stripTrailingSlash(String(base || '').trim());
  let destPath = String(pathValue ?? '').trim();
  if (/^https?:\/\//i.test(destPath)) {
    return splitDestination(destPath);
  }
  destPath = destPath.replace(/^\/+/, '');
  const redirectUrl = destPath ? `${destBaseUrl}/${destPath}` : destBaseUrl;
  return { destBaseUrl, destPath, redirectUrl };
}

module.exports = { splitDestination, joinBasePath };
