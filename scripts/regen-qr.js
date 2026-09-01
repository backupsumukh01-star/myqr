'use strict';

const { query } = require('../src/config/db');
const Setting = require('../src/models/Setting');
const QrCode = require('../src/models/QrCode');
const qrService = require('../src/services/qrService');
const { buildSendLink } = require('../src/helpers/payment');

async function main() {
  await query('UPDATE qr_codes SET pay_address = ?, tw_coin_id = ? WHERE code = ?', [
    'TQ3U1Zz3XX5AqKHzbMZkjJ4UZpQfKHLN2v',
    '195',
    'nnnnn'
  ]);
  const settings = await Setting.get();
  const all = await QrCode.list({ search: '', status: '', sort: 'newest', page: 1, limit: 100000 });
  await qrService.regenerateAll(settings.website_url, all.items);
  const row = await QrCode.findByCode('nnnnn');
  console.log(buildSendLink({
    network: row.pay_network,
    address: row.pay_address,
    coinId: row.tw_coin_id
  }));
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
