const state = { page: 1 };

async function loadLogs() {
  const params = new URLSearchParams({
    page: String(state.page),
    limit: document.getElementById('limitFilter').value,
    search: document.getElementById('searchInput').value.trim()
  });
  const res = await api(`/api/logs?${params}`);
  const { items, page, pages } = res.data;
  document.getElementById('logTable').innerHTML = items.map((row) => `
    <tr>
      <td>${formatDate(row.created_at)}</td>
      <td><code>${escapeHtml(row.code)}</code><div class="text-muted">${escapeHtml(row.title)}</div></td>
      <td>${escapeHtml(row.ip_address || '—')}</td>
      <td>${escapeHtml([row.country, row.city].filter(Boolean).join(', ') || '—')}</td>
      <td>${escapeHtml(row.browser || '—')}</td>
      <td>${escapeHtml(row.platform || '—')}</td>
      <td class="text-break">${escapeHtml(row.referer || '—')}</td>
    </tr>
  `).join('') || '<tr><td colspan="7">No scans yet</td></tr>';

  document.getElementById('pager').innerHTML = `
    <button class="btn btn-sm btn-outline-secondary" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">Prev</button>
    <span>Page ${page} / ${pages}</span>
    <button class="btn btn-sm btn-outline-secondary" ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">Next</button>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('limitFilter').addEventListener('change', () => {
    state.page = 1;
    loadLogs();
  });
  document.getElementById('searchInput').addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      state.page = 1;
      loadLogs();
    }
  });
  document.getElementById('pager').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-page]');
    if (!btn) return;
    state.page = Number(btn.getAttribute('data-page'));
    loadLogs();
  });
  loadLogs();
});
