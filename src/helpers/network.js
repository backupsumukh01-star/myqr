'use strict';

const os = require('os');

function lanBaseUrls(port = 3000) {
  const urls = [];
  const nets = os.networkInterfaces();
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.family !== 'IPv4' || net.internal) continue;
      urls.push(`http://${net.address}:${port}`);
    }
  }
  return urls;
}

module.exports = { lanBaseUrls };
