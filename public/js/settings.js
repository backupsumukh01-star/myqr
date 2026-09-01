document.addEventListener('DOMContentLoaded', async () => {
  const res = await api('/api/settings');
  const s = res.data;
  document.getElementById('site_name').value = s.site_name;
  document.getElementById('website_url').value = s.website_url;
  document.getElementById('timezone').value = s.timezone;
  if (s.logo_path) {
    document.getElementById('logoPreview').innerHTML = `<img src="${s.logo_path}" alt="Logo" style="max-height:64px">`;
  }

  const host = document.getElementById('lanButtons');
  (s.lan_urls || []).forEach((url) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-sm btn-outline-secondary';
    btn.textContent = `Use ${url}`;
    btn.addEventListener('click', () => {
      document.getElementById('website_url').value = url;
    });
    host.appendChild(btn);
  });

  document.getElementById('settingsForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    await api('/api/settings', { method: 'PUT', body: form });
    toast('Settings saved. QR images regenerated.');
    window.location.reload();
  });
});
