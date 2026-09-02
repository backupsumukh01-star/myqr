function typeOf() {
  return document.getElementById('payload_type').value;
}

function syncTypeUi() {
  const type = typeOf();
  document.querySelectorAll('.tw-only').forEach((el) => el.classList.toggle('d-none', type !== 'TRUST_WALLET'));
  document.querySelectorAll('.pay-only').forEach((el) => el.classList.toggle('d-none', type !== 'CRYPTO_PAY'));
  document.querySelectorAll('.web-fields').forEach((el) => el.classList.toggle('d-none', type === 'CRYPTO_PAY'));
  document.getElementById('pay_address').required = type === 'CRYPTO_PAY';
  document.getElementById('dest_base_url').required = type !== 'CRYPTO_PAY';
}

function composedDest() {
  const base = document.getElementById('dest_base_url').value.trim().replace(/\/+$/, '');
  const path = document.getElementById('dest_path').value.trim().replace(/^\/+/, '');
  if (!base) return '';
  return path ? `${base}/${path}` : base;
}

function updateHint() {
  const code = document.getElementById('code').value.trim() || '{code}';
  const origin = window.location.origin;
  const type = typeOf();
  if (type === 'CRYPTO_PAY') {
    document.getElementById('payloadHint').textContent =
      `https://link.trustwallet.com/open_url?coin_id=195&url=${origin}/r/${code}`;
  } else {
    document.getElementById('payloadHint').textContent = `${origin}/r/${code}`;
  }
  const preview = document.getElementById('destPreview');
  if (preview) preview.textContent = composedDest() || 'https://';
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = document.getElementById('qrId').value;
  document.getElementById('payload_type').addEventListener('change', () => {
    syncTypeUi();
    updateHint();
  });
  document.getElementById('code').addEventListener('input', updateHint);
  document.getElementById('dest_base_url').addEventListener('input', updateHint);
  document.getElementById('pay_address').addEventListener('input', updateHint);

  if (id) {
    const res = await api(`/api/qr/${id}`);
    const qr = res.data;
    document.getElementById('title').value = qr.title;
    document.getElementById('code').value = qr.code;
    document.getElementById('dest_base_url').value = qr.dest_base_url || '';
    document.getElementById('dest_path').value = qr.dest_path || '';
    document.getElementById('tw_coin_id').value = qr.tw_coin_id || '195';
    document.getElementById('payload_type').value = qr.payload_type || 'WEB';
    document.getElementById('pay_network').value = qr.pay_network || 'TRON';
    document.getElementById('pay_address').value = qr.pay_address || '';
    document.getElementById('pay_amount').value = qr.pay_amount || '';
    document.getElementById('pay_token').value = qr.pay_token === 'NATIVE' ? 'NATIVE' : 'USDT';
    document.getElementById('description').value = qr.description || '';
    document.getElementById('status').value = qr.status;
    document.getElementById('payloadHint').textContent = qr.encoded_payload;
  }

  syncTypeUi();
  updateHint();

  document.getElementById('qrForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const type = typeOf();
    const payload = {
      title: document.getElementById('title').value,
      code: document.getElementById('code').value,
      payload_type: type,
      description: document.getElementById('description').value,
      status: document.getElementById('status').value
    };
    if (type === 'CRYPTO_PAY') {
      payload.pay_network = document.getElementById('pay_network').value;
      payload.pay_address = document.getElementById('pay_address').value;
      payload.pay_amount = document.getElementById('pay_amount').value;
      payload.pay_token = document.getElementById('pay_token').value;
      payload.tw_coin_id = document.getElementById('tw_coin_id').value || undefined;
    } else {
      payload.dest_base_url = document.getElementById('dest_base_url').value;
      payload.dest_path = document.getElementById('dest_path').value;
      if (type === 'TRUST_WALLET') payload.tw_coin_id = document.getElementById('tw_coin_id').value;
    }
    try {
      if (id) {
        await api(`/api/qr/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        toast('Wallet saved. Printed QR is unchanged. Next scan uses the new address.');
        window.location.href = `/qr-codes/${id}`;
      } else {
        const res = await api('/api/qr', { method: 'POST', body: JSON.stringify(payload) });
        window.location.href = `/qr-codes/${res.data.id}`;
      }
    } catch (error) {
      toast(error.message || 'Could not save QR');
    }
  });
});
