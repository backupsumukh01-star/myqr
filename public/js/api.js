async function api(path, options = {}) {
  const headers = options.headers || {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const res = await fetch(path, {
    credentials: 'same-origin',
    ...options,
    headers
  });
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = payload && payload.message ? payload.message : 'Request failed';
    const error = new Error(message);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function toast(message) {
  const host = document.getElementById('toastHost');
  if (!host) {
    alert(message);
    return;
  }
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
  toast('Copied');
}

window.api = api;
window.toast = toast;
window.escapeHtml = escapeHtml;
window.formatDate = formatDate;
window.copyText = copyText;
