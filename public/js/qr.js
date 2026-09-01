const state = { page: 1 };

function query() {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: document.getElementById('limitFilter').value,
    search: document.getElementById('searchInput').value.trim(),
    status: document.getElementById('statusFilter').value,
    sort: document.getElementById('sortFilter').value
  });
  return params.toString();
}

async function loadQr() {
  const res = await api(`/api/qr?${query()}`);
  const { items, page, pages } = res.data;
  document.getElementById('qrTable').innerHTML = items.map((qr) => `
    <tr>
      <td><img class="qr-thumb" src="${qr.png_url}" alt="${escapeHtml(qr.code)}"></td>
      <td><code>${escapeHtml(qr.code)}</code></td>
      <td>${escapeHtml(qr.title)}</td>
      <td class="text-break">${escapeHtml(qr.redirect_url)}</td>
      <td><span class="badge ${qr.status === 'ACTIVE' ? 'badge-active' : 'badge-disabled'}">${qr.status}</span></td>
      <td>${qr.scan_count}</td>
      <td>${formatDate(qr.created_at)}</td>
      <td>
        <div class="actions">
          <a class="btn btn-sm btn-outline-secondary" href="/qr-codes/${qr.id}">View</a>
          <a class="btn btn-sm btn-outline-secondary" href="/qr-codes/${qr.id}/edit">Edit</a>
          <button class="btn btn-sm btn-outline-secondary" data-copy="${escapeHtml(qr.encoded_payload || qr.scan_url)}">Copy URL</button>
          <a class="btn btn-sm btn-outline-secondary" href="/api/qr/${qr.id}/download/png">PNG</a>
          <a class="btn btn-sm btn-outline-secondary" href="/api/qr/${qr.id}/download/svg">SVG</a>
          <button class="btn btn-sm btn-outline-warning" data-toggle="${qr.id}" data-status="${qr.status}">
            ${qr.status === 'ACTIVE' ? 'Disable' : 'Enable'}
          </button>
          <button class="btn btn-sm btn-outline-danger" data-del="${qr.id}">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="8">No QR codes yet</td></tr>';

  document.getElementById('pager').innerHTML = `
    <button class="btn btn-sm btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Prev</button>
    <span>Page ${page} / ${pages}</span>
    <button class="btn btn-sm btn-outline-secondary" ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">Next</button>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  ['searchInput', 'statusFilter', 'sortFilter', 'limitFilter'].forEach((id) => {
    document.getElementById(id).addEventListener('change', () => {
      state.page = 1;
      loadQr();
    });
  });
  document.getElementById('searchInput').addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
      state.page = 1;
      loadQr();
    }
  });

  document.getElementById('qrTable').addEventListener('click', async (event) => {
    const copy = event.target.closest('[data-copy]');
    const del = event.target.closest('[data-del]');
    const toggle = event.target.closest('[data-toggle]');
    if (copy) await copyText(copy.getAttribute('data-copy'));
    if (del && confirm('Delete this QR? Printed codes will stop working.')) {
      await api(`/api/qr/${del.getAttribute('data-del')}`, { method: 'DELETE' });
      toast('Deleted');
      loadQr();
    }
    if (toggle) {
      const id = toggle.getAttribute('data-toggle');
      const next = toggle.getAttribute('data-status') === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
      await api(`/api/qr/${id}`, { method: 'PUT', body: JSON.stringify({ status: next }) });
      loadQr();
    }
  });

  document.getElementById('pager').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-page]');
    if (!btn || btn.disabled) return;
    state.page = Number(btn.getAttribute('data-page'));
    loadQr();
  });

  document.getElementById('csvForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await api('/api/qr/import', { method: 'POST', body: form });
    toast('CSV imported');
    bootstrap.Modal.getInstance(document.getElementById('bulkModal')).hide();
    loadQr();
  });

  document.getElementById('bulkJsonBtn').addEventListener('click', async () => {
    const items = JSON.parse(document.getElementById('bulkJson').value);
    await api('/api/qr/bulk', { method: 'POST', body: JSON.stringify({ items }) });
    toast('Bulk generation complete');
    loadQr();
  });

  loadQr();
});
