(() => {
  const VERSION = '20260406d';
  const form = document.getElementById('loginForm');
  const button = document.getElementById('loginButton');
  const errorEl = document.getElementById('loginError');
  const statusEl = document.getElementById('loginStatus');
  const debugEl = document.getElementById('loginDebug');
  let isRedirecting = false;

  function showDebug(message) {
    if (!debugEl) return;
    debugEl.textContent = message;
    debugEl.classList.remove('hidden');
  }

  function showError(message) {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    if (statusEl) statusEl.textContent = '';
  }

  function readBootError() {
    try {
      const value = sessionStorage.getItem('rs-admin-last-boot-error');
      if (value) showDebug('Último erro ao abrir o painel\n' + value);
    } catch (error) {
      console.error('Falha ao ler erro de boot:', error);
    }
  }

  async function tryRecoverExistingSession() {
    if (isRedirecting || !window.AdminAuth) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'auth') {
        if (statusEl) statusEl.textContent = '';
        return;
      }

      if (statusEl) statusEl.textContent = 'Verificando sessão existente...';
      const session = await window.AdminAuth.waitForSession(900);
      if (!session?.user) {
        if (statusEl) statusEl.textContent = '';
        return;
      }

      const admin = await window.AdminAuth.getAdminProfile(session.user.id);
      if (!admin?.is_active) {
        await window.AdminAuth.signOut();
        if (statusEl) statusEl.textContent = '';
        return;
      }

      isRedirecting = true;
      if (statusEl) statusEl.textContent = 'Sessão encontrada. Entrando no painel...';
      window.location.replace(`./index.html?v=${VERSION}`);
    } catch (error) {
      console.error('Falha ao recuperar sessão no login:', error);
      if (statusEl) statusEl.textContent = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    errorEl?.classList.add('hidden');
    if (errorEl) errorEl.textContent = '';
    if (statusEl) statusEl.textContent = 'Validando acesso...';
    if (button) {
      button.disabled = true;
      button.classList.add('opacity-70');
    }

    try {
      const email = document.getElementById('email')?.value?.trim() || '';
      const password = document.getElementById('password')?.value || '';
      await window.AdminAuth.signIn(email, password);
      isRedirecting = true;
      if (statusEl) statusEl.textContent = 'Login realizado. Redirecionando...';
      window.location.replace(`./index.html?v=${VERSION}`);
    } catch (error) {
      console.error('Erro no login:', error);
      showError(error?.message || 'Erro ao entrar.');
    } finally {
      if (button) {
        button.disabled = false;
        button.classList.remove('opacity-70');
      }
    }
  }

  function init() {
    readBootError();
    form?.addEventListener('submit', handleSubmit);
    tryRecoverExistingSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
