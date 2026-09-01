document.addEventListener('DOMContentLoaded', async () => {
  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', window.toggleTheme);

  const sidebar = document.querySelector('.app-sidebar');
  const sidebarToggle = document.getElementById('sidebarToggle');
  if (sidebar && sidebarToggle) {
    sidebarToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await api('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    });
  }

  const adminName = document.getElementById('adminName');
  if (adminName) {
    try {
      const me = await api('/api/me');
      adminName.textContent = me.data.name;
    } catch {
      window.location.href = '/login';
    }
  }
});
