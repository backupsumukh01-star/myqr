(() => {
  const stored = localStorage.getItem('dqr-theme') || 'light';
  document.documentElement.setAttribute('data-theme', stored);

  window.toggleTheme = function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dqr-theme', next);
  };
})();
