'use strict';

const QrCode = require('../models/QrCode');
const ScanLog = require('../models/ScanLog');
const geoService = require('../services/geoService');
const { parseUserAgent, clientIp } = require('../helpers/userAgent');
const { normalizeCode } = require('../helpers/strings');
const { buildSendLink, buildNativeSendLink, isTrustInAppBrowser } = require('../helpers/payment');
const logger = require('../utils/logger');

function nextScanPath(code) {
  const stamp = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `/r/${encodeURIComponent(code)}/s/${stamp}`;
}

async function logScan(req, qr) {
  const ip = clientIp(req);
  const geo = geoService.lookup(ip);
  const ua = parseUserAgent(req.headers['user-agent']);
  try {
    await QrCode.recordScan(qr.id);
    await ScanLog.create({
      qrCodeId: qr.id,
      ipAddress: ip,
      country: geo.country,
      city: geo.city,
      device: ua.device,
      browser: ua.browser,
      platform: ua.platform,
      userAgent: (req.headers['user-agent'] || '').slice(0, 512),
      referer: (req.get('referer') || '').slice(0, 512)
    });
  } catch (logError) {
    logger.warn('Scan logging failed', logError.message);
  }
}

function noCache(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  res.removeHeader('ETag');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Content-Security-Policy-Report-Only');
}

async function loadQr(req, res) {
  const code = normalizeCode(req.params.code);
  const qr = await QrCode.findByCode(code);
  if (!qr) {
    res.status(404).render('errors/404', { title: 'QR not found', code });
    return null;
  }
  if (qr.status !== 'ACTIVE') {
    res.status(410).render('errors/disabled', { title: 'QR disabled', qr });
    return null;
  }
  return qr;
}

async function entry(req, res, next) {
  try {
    const qr = await loadQr(req, res);
    if (!qr) return;
    await logScan(req, qr);
    noCache(res);
    return res.redirect(302, nextScanPath(qr.code));
  } catch (error) {
    next(error);
  }
}

async function serveScan(req, res, next) {
  try {
    const qr = await loadQr(req, res);
    if (!qr) return;
    noCache(res);

    if (qr.payload_type === 'CRYPTO_PAY' && qr.pay_address) {
      const sendOpts = {
        network: qr.pay_network || 'TRON',
        address: qr.pay_address,
        amount: qr.pay_amount,
        coinId: qr.tw_coin_id || '195',
        token: qr.pay_token
      };
      const sendLink = buildSendLink(sendOpts);
      const nativeSend = buildNativeSendLink(sendOpts);

      if (isTrustInAppBrowser(req.headers['user-agent'])) {
        return res.status(200).render('tw-pay', {
          title: 'Pay',
          qr,
          sendLink,
          nativeSend,
          nextScan: nextScanPath(qr.code),
          networkLabel: qr.pay_token === 'NATIVE' ? 'TRX' : 'USDT (TRC-20)'
        });
      }

      return res.redirect(302, sendLink);
    }

    return res.redirect(302, qr.redirect_url);
  } catch (error) {
    next(error);
  }
}

module.exports = { entry, serveScan, nextScanPath };
