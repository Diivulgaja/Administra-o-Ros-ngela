window.AdminUI = (() => {
  const { initials, statusClass, escapeHtml } = window.AdminUtils;
  let toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer && document.body.contains(toastContainer)) return toastContainer;
    toastContainer = document.getElementById('admin-toast-root');
    if (toastContainer) return toastContainer;
    toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-root';
    toastContainer.className = 'admin-toast-root';
    document.body.appendChild(toastContainer);
    return toastContainer;
  }

  function notify({ title = '', message = '', variant = 'info', duration = 4200 } = {}) {
    const root = ensureToastContainer();
    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${variant}`;
    toast.innerHTML = `
      <div class="admin-toast__icon">${variant === 'success' ? '✓' : variant === 'error' ? '!' : 'i'}</div>
      <div class="admin-toast__content">
        ${title ? `<p class="admin-toast__title">${escapeHtml(title)}</p>` : ''}
        <p class="admin-toast__message">${escapeHtml(message || title || 'Atualização realizada.')}</p>
      </div>
      <button type="button" class="admin-toast__close" aria-label="Fechar notificação">×</button>
    `;
    root.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const remove = () => {
      toast.classList.remove('is-visible');
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 220);
    };

    toast.querySelector('.admin-toast__close')?.addEventListener('click', remove);
    window.setTimeout(remove, duration);
    return toast;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => ensureToastContainer(), { once: true });
    window.alert = (message) => notify({ title: 'Atenção', message: String(message || ''), variant: 'error', duration: 5200 });
  }

  function panelTitle(eyebrow, title, extra = '') {
    return `
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p class="text-xs uppercase tracking-[0.16em] text-muted font-semibold">${escapeHtml(eyebrow)}</p>
          <h2 class="text-2xl font-bold mt-1">${escapeHtml(title)}</h2>
        </div>
        ${extra}
      </div>`;
  }

  function metricCard(icon, label, value, sublabel, badge = '') {
    return `
      <article class="metric-card">
        <div class="flex items-center justify-between">
          <div class="w-12 h-12 rounded-2xl bg-roseSoft flex items-center justify-center">
            <i data-lucide="${icon}" class="w-5 h-5 text-blush"></i>
          </div>
          ${badge}
        </div>
        <p class="text-sm text-muted mt-4">${escapeHtml(label)}</p>
        <h3 class="text-3xl font-bold mt-1">${escapeHtml(String(value))}</h3>
        <p class="text-sm text-muted mt-2">${escapeHtml(sublabel || '')}</p>
      </article>`;
  }

  function statusPill(status) {
    return `<span class="status-pill ${statusClass(status)}">${escapeHtml(status)}</span>`;
  }

  function emptyState(text) {
    return `<div class="empty-state"><p>${escapeHtml(text)}</p></div>`;
  }

  function personChip(name, subtitle, status) {
    return `
      <div class="flex items-center justify-between p-4 rounded-3xl bg-[#FCF8F8] border border-roseLine gap-4 flex-wrap">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-[#E7D4D4] flex items-center justify-center font-bold shrink-0">${escapeHtml(initials(name))}</div>
          <div class="min-w-0">
            <p class="font-semibold truncate">${escapeHtml(name)}</p>
            <p class="text-sm text-muted truncate">${escapeHtml(subtitle)}</p>
          </div>
        </div>
        ${statusPill(status)}
      </div>`;
  }

  function actionButton(label, attrs = '', variant = 'default') {
    const cls = variant === 'primary'
      ? 'px-3 py-2 rounded-2xl bg-blush text-white text-sm font-semibold'
      : variant === 'danger'
        ? 'px-3 py-2 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold border border-red-200'
        : 'px-3 py-2 rounded-2xl bg-white border border-roseLine text-sm font-medium';
    return `<button class="${cls}" ${attrs}>${escapeHtml(label)}</button>`;
  }

  function field(label, input) {
    return `<label class="field-block"><span class="field-label">${escapeHtml(label)}</span>${input}</label>`;
  }

  return { panelTitle, metricCard, statusPill, emptyState, personChip, actionButton, field, notify };
})();
