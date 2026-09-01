'use strict';

const fs = require('fs/promises');
const path = require('path');
const QRCode = require('qrcode');
const { buildQrPayload } = require('../helpers/trustWallet');

const QR_DIR = path.join(__dirname, '../../uploads/qr');

async function ensureDir() {
  await fs.mkdir(QR_DIR, { recursive: true });
}

function filePaths(code) {
  return {
    png: path.join(QR_DIR, `${code}.png`),
    svg: path.join(QR_DIR, `${code}.svg`)
  };
}

/**
 * CRYPTO_PAY encodes official Trust Wallet send:
 * https://link.trustwallet.com/send?asset=c195_tTR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t&address=...
 */
async function generateQrFiles(websiteUrl, code, options = {}) {
  await ensureDir();
  const payload = buildQrPayload({
    websiteUrl,
    code,
    payloadType: options.payloadType || 'WEB',
    twCoinId: options.twCoinId,
    payAddress: options.payAddress,
    payNetwork: options.payNetwork,
    payAmount: options.payAmount,
    payToken: options.payToken
  });
  const files = filePaths(code);

  await QRCode.toFile(files.png, payload, {
    type: 'png',
    width: 1024,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#0f172a', light: '#ffffff' }
  });

  const svg = await QRCode.toString(payload, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#0f172a', light: '#ffffff' }
  });
  await fs.writeFile(files.svg, svg, 'utf8');

  return { payload, ...files };
}

async function removeQrFiles(code) {
  const files = filePaths(code);
  await Promise.allSettled([fs.unlink(files.png), fs.unlink(files.svg)]);
}

async function regenerateAll(websiteUrl, records) {
  for (const record of records) {
    const code = typeof record === 'string' ? record : record.code;
    await generateQrFiles(websiteUrl, code, {
      payloadType: record.payload_type,
      twCoinId: record.tw_coin_id,
      payAddress: record.pay_address,
      payNetwork: record.pay_network,
      payAmount: record.pay_amount,
      payToken: record.pay_token
    });
  }
}

module.exports = {
  QR_DIR,
  filePaths,
  generateQrFiles,
  removeQrFiles,
  regenerateAll
};
