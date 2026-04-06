window.AdminAvaliacoes = (() => {
  const { panelTitle, emptyState, actionButton, field, statusPill } = window.AdminUI;

  async function moderate(id, patch) {
    try {
      await window.AdminSupabase.saveReviewModeration(id, patch);
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível atualizar a avaliação.');
    }
  }

  function render(root, state) {
    const reviews = state.datasets.reviews || [];
    const appointments = state.datasets.appointments || [];
    const pending = reviews.filter((r) => r.status === 'pending');
    const approved = reviews.filter((r) => r.status === 'approved');
    const featured = reviews.filter((r) => r.is_featured).length;

    root.innerHTML = `
      <div class="space-y-6">
        <div class="grid md:grid-cols-3 gap-4">
          <div class="rounded-3xl bg-white border border-roseLine p-5 shadow-soft"><p class="text-sm text-muted">Pendentes</p><p class="text-3xl font-bold mt-1">${pending.length}</p></div>
          <div class="rounded-3xl bg-white border border-roseLine p-5 shadow-soft"><p class="text-sm text-muted">Aprovadas</p><p class="text-3xl font-bold mt-1">${approved.length}</p></div>
          <div class="rounded-3xl bg-white border border-roseLine p-5 shadow-soft"><p class="text-sm text-muted">Destacadas</p><p class="text-3xl font-bold mt-1">${featured}</p></div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Avaliações', 'Moderação e publicação', '<div class="text-sm text-muted">As clientes avaliam pelo site principal depois que o atendimento é concluído.</div>')}
          <div class="grid gap-4 mt-6">
            ${reviews.length ? reviews.map((review) => {
              const appt = appointments.find((a) => String(a.id) === String(review.appointment_id));
              return `<div class="rounded-3xl border border-roseLine p-4 bg-[#FFFDFC]"><div class="flex items-start justify-between gap-4 flex-wrap"><div><p class="font-semibold">${'★'.repeat(review.rating)}${'☆'.repeat(5-review.rating)} · ${review.customer_name || review.public_name || 'Cliente'}</p><p class="text-sm text-muted mt-1">${review.service_title || appt?.service_name || 'Serviço'} · ${AdminUtils.dateTimeLabel(review.created_at)}</p></div><div class="flex gap-2 flex-wrap">${statusPill(review.status)}${review.is_featured ? statusPill('Destaque') : ''}</div></div><p class="mt-3 font-medium">${review.title || 'Sem título'}</p><p class="text-sm text-muted mt-2">${review.comment || 'Sem comentário.'}</p>${review.admin_reply ? `<div class="mt-3 rounded-2xl bg-roseSoft p-3 text-sm"><strong>Resposta:</strong> ${review.admin_reply}</div>` : ''}<div class="mt-4 flex flex-wrap gap-2">${review.status !== 'approved' ? actionButton('Aprovar', `data-approve="${review.id}"`, 'primary') : ''}${review.status !== 'hidden' ? actionButton('Ocultar', `data-hide="${review.id}"`) : ''}${!review.is_featured ? actionButton('Destacar', `data-feature="${review.id}"`) : actionButton('Remover destaque', `data-unfeature="${review.id}"`)}${actionButton('Responder', `data-reply="${review.id}"`)}</div><div class="mt-4 hidden" id="reply-box-${review.id}">${field('Resposta da empresa', `<textarea class="input-base min-h-[120px]" data-reply-text="${review.id}">${review.admin_reply || ''}</textarea>`)}<button class="mt-2 px-4 py-2 rounded-2xl bg-ink text-white text-sm font-semibold" data-save-reply="${review.id}">Salvar resposta</button></div></div>`;
            }).join('') : emptyState('Nenhuma avaliação recebida ainda.')}
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.approve, { status: 'approved' })));
    root.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.hide, { status: 'hidden', is_featured: false })));
    root.querySelectorAll('[data-feature]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.feature, { is_featured: true, status: 'approved' })));
    root.querySelectorAll('[data-unfeature]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.unfeature, { is_featured: false })));
    root.querySelectorAll('[data-reply]').forEach((btn) => btn.addEventListener('click', () => root.querySelector(`#reply-box-${btn.dataset.reply}`)?.classList.toggle('hidden')));
    root.querySelectorAll('[data-save-reply]').forEach((btn) => btn.addEventListener('click', () => {
      const text = root.querySelector(`[data-reply-text="${btn.dataset.saveReply}"]`)?.value || '';
      moderate(btn.dataset.saveReply, { admin_reply: text, replied_at: new Date().toISOString() });
    }));
  }

  return { render };
})();
