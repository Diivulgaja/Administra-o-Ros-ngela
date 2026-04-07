(function () {
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  let deferredPrompt = null;

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => console.warn('[PWA Admin] Service worker não registrado:', err));
    });
  }

  if (isStandalone) return;

  const button = document.createElement('button');
  button.id = 'pwaInstallButton';
  button.type = 'button';
  button.setAttribute('aria-label', 'Instalar painel administrativo');
  button.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999;display:none;align-items:center;justify-content:center;gap:8px;padding:14px 18px;border:none;border-radius:18px;background:linear-gradient(135deg,#d78686,#8f5c5c);color:#fff;font:700 14px Inter,system-ui,sans-serif;box-shadow:0 18px 40px rgba(109,73,73,0.26);cursor:pointer;';
  button.innerHTML = '<span style="font-size:16px;line-height:1">⬇</span><span>Instalar admin</span>';

  button.addEventListener('click', async () => {
    if (!deferredPrompt) {
      alert('No Android, abra o menu do navegador e toque em “Instalar app” ou “Adicionar à tela inicial”.');
      return;
    }
    deferredPrompt.prompt();
    try { await deferredPrompt.userChoice; } finally {
      deferredPrompt = null;
      button.style.display = 'none';
    }
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    if (!document.body.contains(button)) document.body.appendChild(button);
    button.style.display = 'inline-flex';
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    button.style.display = 'none';
  });

  window.addEventListener('load', () => {
    if (!document.body.contains(button)) document.body.appendChild(button);
  });
})();