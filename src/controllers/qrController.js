'use strict';

const QrCode = require('../models/QrCode');
const Setting = require('../models/Setting');
const qrService = require('../services/qrService');
const csvService = require('../services/csvService');
const { success, fail } = require('../helpers/response');
const { normalizeCode, buildScanUrl, sanitizeText, isValidHttpUrl } = require('../helpers/strings');
const { resolveDestination, buildQrPayload, buildTrustWalletLink } = require('../helpers/trustWallet');
const { joinBasePath, splitDestination } = require('../helpers/destination');
const { buildSendLink, defaultCoinId, normalizeToken, normalizePayAddress } = require('../helpers/payment');

function decorate(qr, websiteUrl) {
  if (!qr) return null;
  const scanUrl = buildScanUrl(websiteUrl, qr.code);
  const encodedPayload = buildQrPayload({
    websiteUrl,
    code: qr.code,
    payloadType: qr.payload_type,
    twCoinId: qr.tw_coin_id,
    payAddress: qr.pay_address,
    payNetwork: qr.pay_network,
    payAmount: qr.pay_amount,
    payToken: qr.pay_token
  });
  const parts = qr.dest_base_url
    ? { destBaseUrl: qr.dest_base_url, destPath: qr.dest_path || '' }
    : splitDestination(qr.redirect_url);
  return {
    ...qr,
    scan_url: scanUrl,
    encoded_payload: encodedPayload,
    dest_base_url: parts.destBaseUrl,
    dest_path: parts.destPath,
    pay_send_link:
      qr.payload_type === 'CRYPTO_PAY' && qr.pay_address
        ? buildSendLink({
          network: qr.pay_network,
          address: qr.pay_address,
          amount: qr.pay_amount,
          coinId: qr.tw_coin_id,
          token: qr.pay_token
        })
        : null,
    tw_wallet_link:
      qr.payload_type === 'TRUST_WALLET' || qr.payload_type === 'CRYPTO_PAY'
        ? buildTrustWalletLink(qr.tw_coin_id || (qr.payload_type === 'CRYPTO_PAY' ? '195' : '60'), scanUrl)
        : null,
    png_url: `/api/qr/${qr.id}/download/png?v=${encodeURIComponent(qr.updated_at || qr.code)}`,
    svg_url: `/api/qr/${qr.id}/download/svg?v=${encodeURIComponent(qr.updated_at || qr.code)}`
  };
}

function destinationFromBody(body, current = {}) {
  const type = body.payload_type || current.payload_type || 'WEB';

  if (type === 'CRYPTO_PAY') {
    const address = normalizePayAddress(
      body.pay_network || current.pay_network || 'TRON',
      body.pay_address || current.pay_address || ''
    );
    const network = String(body.pay_network || current.pay_network || 'TRON').toUpperCase();
    const amount =
      body.pay_amount !== undefined
        ? String(body.pay_amount || '').trim()
        : String(current.pay_amount || '').trim();
    const twCoinId = body.tw_coin_id || current.tw_coin_id || defaultCoinId(network);
    const payToken = normalizeToken(body.pay_token || current.pay_token, network);
    return {
      payloadType: 'CRYPTO_PAY',
      twCoinId,
      destBaseUrl: null,
      destPath: '',
      payNetwork: network,
      payAddress: address,
      payAmount: amount || null,
      payToken,
      redirectUrl: buildSendLink({ network, address, amount, coinId: twCoinId, token: payToken })
    };
  }

  const dest = resolveDestination({
    payload_type: body.payload_type || current.payload_type,
    tw_coin_id: body.tw_coin_id ?? current.tw_coin_id,
    tw_open_url: body.tw_open_url,
    redirect_url: body.redirect_url || body.tw_open_url || current.redirect_url
  });

  let parts;
  if (body.dest_base_url !== undefined || body.dest_path !== undefined) {
    const fromCurrent = current.redirect_url
      ? splitDestination(current.redirect_url)
      : dest.redirectUrl
        ? splitDestination(dest.redirectUrl)
        : { destBaseUrl: '', destPath: '' };
    parts = joinBasePath(
      body.dest_base_url !== undefined ? body.dest_base_url : current.dest_base_url || fromCurrent.destBaseUrl,
      body.dest_path !== undefined ? body.dest_path : (current.dest_path ?? fromCurrent.destPath)
    );
  } else if (dest.redirectUrl) {
    parts = splitDestination(dest.redirectUrl);
  } else {
    parts = { destBaseUrl: '', destPath: '', redirectUrl: '' };
  }

  dest.redirectUrl = parts.redirectUrl;
  dest.destBaseUrl = parts.destBaseUrl;
  dest.destPath = parts.destPath;

  if (!dest.redirectUrl || !isValidHttpUrl(dest.redirectUrl)) {
    const error = new Error(
      'Enter the website (example https://1x.partners). After the QR is created you can change only the value after / such as 123 or 1234.'
    );
    error.status = 422;
    throw error;
  }
  return dest;
}

function writeQrFiles(base, qr) {
  return qrService.generateQrFiles(base, qr.code, {
    payloadType: qr.payload_type,
    twCoinId: qr.tw_coin_id,
    payAddress: qr.pay_address,
    payNetwork: qr.pay_network,
    payAmount: qr.pay_amount,
    payToken: qr.pay_token
  });
}

async function websiteUrl() {
  const settings = await Setting.get();
  return settings.website_url;
}

async function create(req, res, next) {
  try {
    const code = normalizeCode(req.body.code);
    const existing = await QrCode.findByCode(code);
    if (existing) {
      return fail(res, 'That short code already exists', 409);
    }

    const dest = destinationFromBody(req.body);

    const qr = await QrCode.create({
      code,
      title: sanitizeText(req.body.title, 180),
      description: sanitizeText(req.body.description, 2000),
      redirectUrl: dest.redirectUrl,
      status: req.body.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
      payloadType: dest.payloadType,
      twCoinId: dest.twCoinId,
      destBaseUrl: dest.destBaseUrl,
      destPath: dest.destPath,
      payNetwork: dest.payNetwork || null,
      payAddress: dest.payAddress || null,
      payAmount: dest.payAmount || null,
      payToken: dest.payToken || null
    });

    const base = await websiteUrl();
    await writeQrFiles(base, qr);
    return success(res, decorate(qr, base), 'QR created', 201);
  } catch (error) {
    next(error);
  }
}

async function list(req, res, next) {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 10);
    const result = await QrCode.list({
      search: req.query.search || '',
      status: req.query.status || '',
      sort: req.query.sort || 'newest',
      page,
      limit
    });
    const base = await websiteUrl();
    result.items = result.items.map((item) => decorate(item, base));
    return success(res, result);
  } catch (error) {
    next(error);
  }
}

async function getOne(req, res, next) {
  try {
    const qr = await QrCode.findById(req.params.id);
    if (!qr) return fail(res, 'QR code not found', 404);
    const base = await websiteUrl();
    return success(res, decorate(qr, base));
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const current = await QrCode.findById(req.params.id);
    if (!current) return fail(res, 'QR code not found', 404);

    const fields = {};
    if (req.body.title !== undefined) fields.title = sanitizeText(req.body.title, 180);
    if (req.body.description !== undefined) fields.description = sanitizeText(req.body.description, 2000);
    if (req.body.status !== undefined) fields.status = req.body.status;

    const changingDestination =
      req.body.redirect_url !== undefined ||
      req.body.tw_open_url !== undefined ||
      req.body.payload_type !== undefined ||
      req.body.tw_coin_id !== undefined ||
      req.body.dest_base_url !== undefined ||
      req.body.dest_path !== undefined ||
      req.body.pay_address !== undefined ||
      req.body.pay_network !== undefined ||
      req.body.pay_amount !== undefined ||
      req.body.pay_token !== undefined;

    if (changingDestination) {
      const dest = destinationFromBody(req.body, current);
      fields.redirect_url = dest.redirectUrl;
      fields.payload_type = dest.payloadType;
      fields.tw_coin_id = dest.twCoinId;
      fields.dest_base_url = dest.destBaseUrl;
      fields.dest_path = dest.destPath;
      if (dest.payloadType === 'CRYPTO_PAY') {
        fields.pay_network = dest.payNetwork;
        fields.pay_address = dest.payAddress;
        fields.pay_amount = dest.payAmount;
        fields.pay_token = dest.payToken;
      }
    }

    const qr = await QrCode.update(current.id, fields);
    const base = await websiteUrl();
    const payloadChanged =
      qr.payload_type !== current.payload_type ||
      ((qr.payload_type === 'TRUST_WALLET' || qr.payload_type === 'CRYPTO_PAY') &&
        String(qr.tw_coin_id || '') !== String(current.tw_coin_id || ''));
    if (payloadChanged) {
      await writeQrFiles(base, qr);
    }
    return success(res, decorate(qr, base), 'QR updated');
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const qr = await QrCode.findById(req.params.id);
    if (!qr) return fail(res, 'QR code not found', 404);
    await QrCode.remove(qr.id);
    await qrService.removeQrFiles(qr.code);
    return success(res, null, 'QR deleted');
  } catch (error) {
    next(error);
  }
}

async function download(req, res, next) {
  try {
    const qr = await QrCode.findById(req.params.id);
    if (!qr) return fail(res, 'QR code not found', 404);
    const format = req.params.format === 'svg' ? 'svg' : 'png';
    const base = await websiteUrl();
    const options = {
      payloadType: qr.payload_type,
      twCoinId: qr.tw_coin_id,
      payAddress: qr.pay_address,
      payNetwork: qr.pay_network,
      payAmount: qr.pay_amount,
      payToken: qr.pay_token
    };
    if (format === 'svg') {
      const svg = await qrService.renderSvg(base, qr.code, options);
      res.set('Content-Type', 'image/svg+xml');
      res.set('Content-Disposition', `attachment; filename="${qr.code}.svg"`);
      res.set('Cache-Control', 'no-store');
      return res.send(svg);
    }
    const png = await qrService.renderPng(base, qr.code, options);
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `inline; filename="${qr.code}.png"`);
    res.set('Cache-Control', 'no-store');
    return res.send(png);
  } catch (error) {
    next(error);
  }
}

async function bulkCreate(req, res, next) {
  try {
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return fail(res, 'Provide an items array', 400);

    const base = await websiteUrl();
    const created = [];
    const errors = [];

    for (const item of items) {
      const code = normalizeCode(item.code);
      try {
        if (!code) throw new Error('Invalid code');
        const exists = await QrCode.findByCode(code);
        if (exists) throw new Error('Duplicate code');
        const dest = destinationFromBody(item);
        const qr = await QrCode.create({
          code,
          title: sanitizeText(item.title || code, 180),
          description: sanitizeText(item.description, 2000),
          redirectUrl: dest.redirectUrl,
          status: item.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE',
          payloadType: dest.payloadType,
          twCoinId: dest.twCoinId,
          destBaseUrl: dest.destBaseUrl,
          destPath: dest.destPath,
          payNetwork: dest.payNetwork || null,
          payAddress: dest.payAddress || null,
          payAmount: dest.payAmount || null
        });
        await writeQrFiles(base, qr);
        created.push(decorate(qr, base));
      } catch (error) {
        errors.push({ code: item.code, message: error.message });
      }
    }

    return success(res, { created, errors }, 'Bulk generation complete', 201);
  } catch (error) {
    next(error);
  }
}

async function importCsv(req, res, next) {
  try {
    if (!req.file) return fail(res, 'CSV file is required', 400);
    const rows = csvService.parseCsv(req.file.buffer.toString('utf8'));
    req.body.items = rows.map((row) => ({
      title: row.title,
      code: row.code,
      redirect_url: row.redirect_url || row.url,
      description: row.description,
      status: (row.status || 'ACTIVE').toUpperCase()
    }));
    return bulkCreate(req, res, next);
  } catch (error) {
    next(error);
  }
}

async function exportCsv(req, res, next) {
  try {
    const result = await QrCode.list({
      search: req.query.search || '',
      status: req.query.status || '',
      sort: req.query.sort || 'newest',
      page: 1,
      limit: 100000
    });
    const base = await websiteUrl();
    const csv = csvService.toCsv(
      result.items.map((item) => ({
        ...item,
        scan_url: buildScanUrl(base, item.code)
      })),
      [
        { key: 'id', label: 'id' },
        { key: 'code', label: 'code' },
        { key: 'title', label: 'title' },
        { key: 'description', label: 'description' },
        { key: 'redirect_url', label: 'redirect_url' },
        { key: 'scan_url', label: 'scan_url' },
        { key: 'status', label: 'status' },
        { key: 'scan_count', label: 'scan_count' },
        { key: 'created_at', label: 'created_at' }
      ]
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="qr-codes.csv"');
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove,
  download,
  bulkCreate,
  importCsv,
  exportCsv
};
