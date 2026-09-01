'use strict';

const { query } = require('../src/config/db');
const { buildSendLink } = require('../src/helpers/payment');

const ADDRESS = 'TLjNziA6414ZqbbcYsLJYVCajfqquRtjHk';

async function main() {
  const sendLink = buildSendLink({
    network: 'TRON',
    address: ADDRESS,
    coinId: '195'
  });
  await query(
    `UPDATE qr_codes
     SET pay_address = ?, tw_coin_id = '195', pay_network = 'TRON', redirect_url = ?
     WHERE code = 'nnnnn'`,
    [ADDRESS, sendLink]
  );
  console.log(sendLink);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
