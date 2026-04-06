(function(){
  const form = document.getElementById('loginForm');
  const button = document.getElementById('loginButton');
  const errorEl = document.getElementById('loginError');
  const statusEl = document.getElementById('loginStatus');
  let isRedirecting = false;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    statusEl.textContent = '';
  }

  async function tryRecoverExistingSession() {
    if (isRedirecting) return;
    try {
      statusEl.textContent = 'Verificando sessão existente...';
      const session = await window.AdminAuth.waitForSession(900);
      if (!session || !session.user) {
        statusEl.textContent = '';
        return;
      }
      const admin = await window.AdminAuth.getAdminProfile(session.user.id);
      if (!admin || !admin.is_active) {
        await window.AdminAuth.signOut();
        statusEl.textContent = '';
        return;
      }
      isRedirecting = true;
      statusEl.textContent = 'Sessão encontrada. Entrando no painel...';
      window.location.replace('./index.html?v=20260406e');
    } catch (error) {
      console.error('Falha ao recuperar sessão no login:', error);
      statusEl.textContent = '';
    }
  }

  form.addEventListener('submit', async function(event) {
    event.preventDefault();
    errorEl.classList.add('hidden');
    errorEl.textContent = '';
    statusEl.textContent = 'Validando acesso...';
    button.disabled = true;
    button.classList.add('opacity-70');
    try {
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      await window.AdminAuth.signIn(email, password);
      isRedirecting = true;
      statusEl.textContent = 'Login realizado. Redirecionando...';
      window.location.replace('./index.html?v=20260406e');
    } catch (error) {
      console.error(error);
      showError(error.message || 'Erro ao entrar.');
    } finally {
      button.disabled = false;
      button.classList.remove('opacity-70');
    }
  });

  document.addEventListener('DOMContentLoaded', tryRecoverExistingSession);
})();
