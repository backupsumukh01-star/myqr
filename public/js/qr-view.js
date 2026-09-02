document.addEventListener('DOMContentLoaded', async () => {
  const id = window.location.pathname.split('/')[2];
  const res = await api(`/api/qr/${id}`);
  const qr = res.data;
  const isPay = qr.payload_type === 'CRYPTO_PAY';

  const payForm = `
    <p>The printed QR only opens Trust Wallet on <code>${escapeHtml(qr.scan_url)}</code>. Change the wallet below. The sticker stays the same. Next scan uses the new address.</p>
    <form id="liveDestForm" class="mb-4">
      <label class="form-label" for="liveNetwork">Network</label>
      <select id="liveNetwork" class="form-select mb-3">
        <option value="TRON" ${qr.pay_network === 'TRON' ? 'selected' : ''}>Tron</option>
        <option value="ETH" ${qr.pay_network === 'ETH' ? 'selected' : ''}>Ethereum</option>
        <option value="BTC" ${qr.pay_network === 'BTC' ? 'selected' : ''}>Bitcoin</option>
        <option value="BNB" ${qr.pay_network === 'BNB' ? 'selected' : ''}>BNB Smart Chain</option>
      </select>
      <label class="form-label" for="liveToken">Coin</label>
      <select id="liveToken" class="form-select mb-3">
        <option value="USDT" ${qr.pay_token !== 'NATIVE' ? 'selected' : ''}>USDT (TRC-20)</option>
        <option value="NATIVE" ${qr.pay_token === 'NATIVE' ? 'selected' : ''}>TRX</option>
      </select>
      <label class="form-label" for="liveAddress">Pay-to wallet address (starts with T)</label>
      <input id="liveAddress" class="form-control mb-3" required value="${escapeHtml(qr.pay_address || '')}">
      <label class="form-label" for="liveAmount">Amount (optional)</label>
      <input id="liveAmount" class="form-control mb-3" value="${escapeHtml(qr.pay_amount || '')}">
      <button class="btn btn-brand" type="submit">Save wallet</button>
    </form>
  `;

  const webForm = `
    <p>Website stays <code>${escapeHtml(qr.dest_base_url || '')}</code>. Change only the value after <code>/</code>.</p>
    <form id="liveDestForm" class="mb-4">
      <label class="form-label" for="liveBase">Website</label>
      <input id="liveBase" class="form-control mb-3" type="url" required value="${escapeHtml(qr.dest_base_url || '')}">
      <label class="form-label" for="livePath">Value after /</label>
      <div class="input-group mb-2">
        <span class="input-group-text">/</span>
        <input id="livePath" class="form-control" value="${escapeHtml(qr.dest_path || '')}">
      </div>
      <button class="btn btn-brand" type="submit">Save</button>
    </form>
  `;

  document.getElementById('qrView').innerHTML = `
    <div class="col-lg-4">
      <div class="panel text-center">
        <img src="${qr.png_url}" alt="${escapeHtml(qr.code)}" class="img-fluid bg-white rounded">
        <code class="payload-box mt-3">${escapeHtml(qr.encoded_payload || qr.scan_url)}</code>
        <div class="d-flex justify-content-center gap-2 flex-wrap mt-3">
          <a class="btn btn-sm btn-outline-secondary" href="/api/qr/${qr.id}/download/png">PNG</a>
          <a class="btn btn-sm btn-outline-secondary" href="/api/qr/${qr.id}/download/svg">SVG</a>
          <button class="btn btn-sm btn-outline-secondary" id="copyLink">Copy</button>
        </div>
      </div>
    </div>
    <div class="col-lg-8">
      <div class="alert alert-secondary">
        Print the Trust Wallet <code>open_url</code> QR. It opens your site path, then Send. Set <strong>Settings → Website URL</strong> to your public HTTPS domain (example <code>https://xyz.com</code>), then download PNG once.
      </div>
      <div class="panel">
        <h2 class="h4">${escapeHtml(qr.title)}</h2>
        ${isPay ? payForm : webForm}
        <dl class="row mb-0">
          <dt class="col-sm-4">Code</dt><dd class="col-sm-8"><code>${escapeHtml(qr.code)}</code></dd>
          <dt class="col-sm-4">Site path</dt><dd class="col-sm-8"><code>${escapeHtml(qr.scan_url)}</code></dd>
          <dt class="col-sm-4">Type</dt><dd class="col-sm-8">${isPay ? 'Crypto payment' : qr.payload_type}</dd>
          <dt class="col-sm-4">Status</dt><dd class="col-sm-8">${qr.status}</dd>
          <dt class="col-sm-4">Scans</dt><dd class="col-sm-8">${qr.scan_count}</dd>
        </dl>
      </div>
    </div>
  `;

  document.getElementById('copyLink').addEventListener('click', () => copyText(qr.encoded_payload || qr.scan_url));

  document.getElementById('liveDestForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const body = isPay
      ? {
        payload_type: 'CRYPTO_PAY',
        pay_network: document.getElementById('liveNetwork').value,
        pay_token: document.getElementById('liveToken').value,
        pay_address: document.getElementById('liveAddress').value,
        pay_amount: document.getElementById('liveAmount').value
      }
      : {
        payload_type: qr.payload_type,
        dest_base_url: document.getElementById('liveBase').value,
        dest_path: document.getElementById('livePath').value
      };
    try {
      await api(`/api/qr/${qr.id}`, { method: 'PUT', body: JSON.stringify(body) });
      toast(isPay ? 'Wallet saved. Same printed QR.' : 'Saved.');
      window.location.reload();
    } catch (error) {
      toast(error.message || 'Could not save');
    }
  });
});
