'use strict';

const NETWORKS = {
  TRON: { coinId: '195', label: 'Tron' },
  ETH: { coinId: '60', label: 'Ethereum' },
  BTC: { coinId: '0', label: 'Bitcoin' },
  BNB: { coinId: '20000714', label: 'BNB Smart Chain' }
};

const USDT_TRON = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
const USDT_ETH = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

function defaultCoinId(network) {
  return NETWORKS[String(network || 'TRON').toUpperCase()]?.coinId || '195';
}

function normalizeToken(token, network) {
  const t = String(token || '').toUpperCase();
  if (t === 'USDT' || t === 'USDT_TRON' || t === 'USDT_ETH') return 'USDT';
  if (t === 'TRX' || t === 'ETH' || t === 'BTC' || t === 'BNB' || t === 'NATIVE') return 'NATIVE';
  if (String(network || 'TRON').toUpperCase() === 'TRON') return 'USDT';
  return 'NATIVE';
}

/** Official Trust Wallet UAI: c195, c195_tTR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t */
function buildAssetId({ network, token, coinId }) {
  const net = String(network || 'TRON').toUpperCase();
  const kind = normalizeToken(token, net);
  if (kind === 'USDT') {
    if (net === 'ETH') return `c60_t${USDT_ETH}`;
    return `c195_t${USDT_TRON}`;
  }
  return `c${String(coinId || defaultCoinId(net) || '195')}`;
}

function normalizePayAddress(network, address) {
  let addr = String(address || '').replace(/\s+/g, '').trim();
  try {
    const parsed = new URL(addr);
    const fromQuery = parsed.searchParams.get('address');
    if (fromQuery) addr = fromQuery.replace(/\s+/g, '').trim();
  } catch {
    /* not a URL */
  }
  const net = String(network || 'TRON').toUpperCase();
  if (net === 'TRON') {
    if (addr.startsWith('t') && addr.length === 34) addr = `T${addr.slice(1)}`;
    if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(addr)) {
      const error = new Error(
        'Pay-to wallet must be a Tron address: 34 characters, starting with T. Copy it from Trust Wallet → Receive (USDT TRC20).'
      );
      error.status = 422;
      throw error;
    }
  }
  return addr;
}

function sendParams({ network, address, amount, coinId, token }) {
  const params = new URLSearchParams({
    asset: buildAssetId({ network, token, coinId }),
    address: normalizePayAddress(network, address)
  });
  if (amount) params.set('amount', String(amount));
  return params;
}

function buildSendLink(opts) {
  return `https://link.trustwallet.com/send?${sendParams(opts).toString()}`;
}

function buildNativeSendLink(opts) {
  return `trust://send?${sendParams(opts).toString()}`;
}

function isTrustInAppBrowser(userAgent) {
  const ua = String(userAgent || '');
  return /TrustWallet|\bTrust\//i.test(ua) || /Mobile\/\w+\s+Trust/i.test(ua);
}

module.exports = {
  NETWORKS,
  USDT_TRON,
  defaultCoinId,
  normalizeToken,
  buildAssetId,
  buildSendLink,
  buildNativeSendLink,
  isTrustInAppBrowser,
  normalizePayAddress
};
