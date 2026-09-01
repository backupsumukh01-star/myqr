'use strict';

const { buildScanUrl } = require('./strings');

const TRUST_HOST = 'link.trustwallet.com';

function parseTrustWalletLink(value) {
  try {
    const url = new URL(String(value || ''));
    if (!url.hostname.endsWith('trustwallet.com')) return null;
    if (!/open_url/i.test(`${url.pathname}${url.search}`)) return null;
    return {
      coinId: url.searchParams.get('coin_id') || '60',
      openUrl: url.searchParams.get('url') || ''
    };
  } catch {
    return null;
  }
}

function normalizeCoinId(value, fallback = '60') {
  const digits = String(value ?? '').replace(/[^\d]/g, '');
  return digits || fallback;
}

function buildTrustWalletLink(coinId, openUrl) {
  const params = new URLSearchParams({
    coin_id: normalizeCoinId(coinId),
    url: openUrl
  });
  return `https://${TRUST_HOST}/open_url?${params.toString()}`;
}

/**
 * CRYPTO_PAY pack QR: Trust Wallet open_url → your /r/{code} page (wallet is NOT in the QR).
 * TRUST_WALLET: same open_url wrapper for a generic website destination.
 */
function buildQrPayload({
  websiteUrl,
  code,
  payloadType,
  twCoinId
}) {
  const scanUrl = buildScanUrl(websiteUrl, code);
  if (payloadType === 'CRYPTO_PAY' || payloadType === 'TRUST_WALLET') {
    const coin = payloadType === 'CRYPTO_PAY' ? twCoinId || '195' : twCoinId;
    return buildTrustWalletLink(coin, scanUrl);
  }
  return scanUrl;
}

function resolveDestination(body) {
  const pasted = parseTrustWalletLink(body.redirect_url) || parseTrustWalletLink(body.tw_open_url);
  const trustMode = body.payload_type === 'TRUST_WALLET' || Boolean(pasted);

  if (!trustMode) {
    return {
      payloadType: 'WEB',
      twCoinId: null,
      redirectUrl: String(body.redirect_url || '').trim()
    };
  }

  let inner = String(body.tw_open_url || '').trim();
  if (!inner && pasted?.openUrl) inner = pasted.openUrl;
  if (!inner && body.redirect_url && !parseTrustWalletLink(body.redirect_url)) {
    inner = String(body.redirect_url).trim();
  }

  return {
    payloadType: 'TRUST_WALLET',
    twCoinId: normalizeCoinId(body.tw_coin_id || pasted?.coinId, '60'),
    redirectUrl: inner
  };
}

module.exports = {
  parseTrustWalletLink,
  normalizeCoinId,
  buildTrustWalletLink,
  buildQrPayload,
  resolveDestination
};
