document.getElementById('loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const errorBox = document.getElementById('loginError');
  errorBox.classList.add('d-none');
  try {
    await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
      })
    });
    window.location.href = '/dashboard';
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.classList.remove('d-none');
  }
});
