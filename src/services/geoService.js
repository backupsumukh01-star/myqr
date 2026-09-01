'use strict';

const geoip = require('geoip-lite');

function lookup(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('::ffff:127.')) {
    return { country: 'Local', city: 'Local' };
  }
  const normalized = ip.replace('::ffff:', '');
  const geo = geoip.lookup(normalized);
  if (!geo) return { country: null, city: null };
  return {
    country: geo.country || null,
    city: Array.isArray(geo.city) ? geo.city[0] : geo.city || null
  };
}

module.exports = { lookup };
