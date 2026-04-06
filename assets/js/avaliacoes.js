window.AdminAvaliacoes = (() => {
  const { panelTitle, emptyState, actionButton, field, statusPill, notify } = window.AdminUI;
  const { dateTimeLabel, escapeHtml, initials } = window.AdminUtils;

  function getStatusLabel(status) {
    return ({ pending: 'Pendente', approved: 'Aprovada', hidden: 'Oculta' }[status] || status || 'Pendente');
  }

  function buildStars(rating) {
    const value = Math.max(0, Math.min(5, Number(rating || 0)));
    return `${'★'.repeat(value)}${'☆'.repeat(Math.max(0, 5 - value))}`;
  }

  function getQueueLabel(review) {
    if (review.status === 'pending') return 'Aguardando aprovação';
    if (review.status === 'hidden') return 'Oculta do site';
    if (review.is_featured) return 'Em destaque no site';
    return 'Publicado no site';
  }

  function sortReviews(reviews) {
    const statusOrder = { pending: 0, approved: 1, hidden: 2 };
    return [...reviews].sort((a, b) => {
      const byStatus = (statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99);
      if (byStatus !== 0) return byStatus;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }

  async function moderate(id, patch, successMessage) {
    try {
      await window.AdminSupabase.saveReviewModeration(id, patch);
      notify({
        title: 'Avaliação atualizada',
        message: successMessage || 'A alteração foi salva com sucesso.',
        variant: 'success'
      });
      await window.AdminApp.reloadData();
    } catch (error) {
      notify({
        title: 'Falha ao atualizar',
        message: error.message || 'Não foi possível atualizar a avaliação.',
        variant: 'error',
        duration: 5600
      });
    }
  }

  function render(root, state) {
    const reviews = sortReviews(state.datasets.reviews || []);
    const appointments = state.datasets.appointments || [];
    const pending = reviews.filter((r) => r.status === 'pending');
    const approved = reviews.filter((r) => r.status === 'approved');
    const hidden = reviews.filter((r) => r.status === 'hidden');
    const featured = reviews.filter((r) => r.is_featured).length;

    root.innerHTML = `
      <div class="space-y-6 review-moderation-page">
        <div class="grid md:grid-cols-4 gap-4">
          <div class="review-summary-card review-summary-card--pending"><p class="review-summary-label">Pendentes</p><p class="review-summary-value">${pending.length}</p><span>Esperando sua aprovação</span></div>
          <div class="review-summary-card review-summary-card--approved"><p class="review-summary-label">Publicadas</p><p class="review-summary-value">${approved.length}</p><span>Já visíveis no site</span></div>
          <div class="review-summary-card review-summary-card--featured"><p class="review-summary-label">Destaques</p><p class="review-summary-value">${featured}</p><span>Priorizadas na área pública</span></div>
          <div class="review-summary-card review-summary-card--hidden"><p class="review-summary-label">Ocultas</p><p class="review-summary-value">${hidden.length}</p><span>Fora da vitrine pública</span></div>
        </div>

        <div class="card-surface p-6">
          ${panelTitle(
            'Avaliações',
            'Moderação e publicação',
            `<div class="review-moderation-hint">Cliente envia a avaliação pela área autenticada. Depois da sua aprovação, ela passa a aparecer no site principal.</div>`
          )}

          <div class="review-moderation-toolbar mt-6">
            <div class="review-toolbar-chip">${pending.length} aguardando ação</div>
            <div class="review-toolbar-chip">${approved.length} no ar</div>
            <div class="review-toolbar-chip">${featured} em destaque</div>
          </div>

          <div class="grid gap-5 mt-6">
            ${reviews.length ? reviews.map((review) => {
              const appt = appointments.find((a) => String(a.id) === String(review.appointment_id));
              const customerName = review.customer_name || review.public_name || 'Cliente';
              const serviceTitle = review.service_title || appt?.service_name || 'Serviço';
              const queueLabel = getQueueLabel(review);
              const reply = review.admin_reply || '';
              const createdLabel = dateTimeLabel(review.created_at);
              const appointmentLabel = appt?.booking_reference ? `Reserva ${escapeHtml(appt.booking_reference)}` : 'Sem referência vinculada';
              return `
                <article class="review-card-admin ${review.status === 'pending' ? 'review-card-admin--pending' : ''}">
                  <div class="review-card-admin__top">
                    <div class="review-card-admin__identity">
                      <div class="review-card-admin__avatar">${escapeHtml(initials(customerName) || 'CL')}</div>
                      <div class="min-w-0">
                        <div class="review-card-admin__headline-row">
                          <p class="review-card-admin__name">${escapeHtml(customerName)}</p>
                          ${statusPill(getStatusLabel(review.status))}
                          ${review.is_featured ? statusPill('Destaque') : ''}
                        </div>
                        <p class="review-card-admin__meta">${escapeHtml(serviceTitle)} • ${escapeHtml(createdLabel)}</p>
                        <p class="review-card-admin__submeta">${appointmentLabel} • ${escapeHtml(queueLabel)}</p>
                      </div>
                    </div>
                    <div class="review-card-admin__rating">${escapeHtml(buildStars(review.rating))}<span>${Number(review.rating || 0).toFixed(1).replace('.0','')}</span></div>
                  </div>

                  <div class="review-card-admin__body">
                    <div class="review-card-admin__copy">
                      <p class="review-card-admin__label">Depoimento da cliente</p>
                      <p class="review-card-admin__comment">${escapeHtml(review.comment || 'Cliente avaliou positivamente, mas não deixou comentário escrito.')}</p>
                    </div>

                    ${reply ? `
                      <div class="review-card-admin__reply-preview">
                        <p class="review-card-admin__label">Resposta publicada</p>
                        <p>${escapeHtml(reply)}</p>
                      </div>` : ''}
                  </div>

                  <div class="review-card-admin__actions">
                    ${review.status !== 'approved' ? actionButton('Aprovar e publicar', `data-approve="${review.id}"`, 'primary') : ''}
                    ${review.status !== 'hidden' ? actionButton('Ocultar do site', `data-hide="${review.id}"`) : actionButton('Restaurar publicação', `data-unhide="${review.id}"`, 'primary')}
                    ${!review.is_featured ? actionButton('Colocar em destaque', `data-feature="${review.id}"`) : actionButton('Remover destaque', `data-unfeature="${review.id}"`)}
                    ${actionButton(reply ? 'Editar resposta' : 'Responder como empresa', `data-reply="${review.id}"`)}
                  </div>

                  <div class="review-card-admin__reply-box hidden" id="reply-box-${review.id}">
                    ${field('Resposta da empresa', `<textarea class="input-base min-h-[120px]" data-reply-text="${review.id}" placeholder="Escreva uma resposta curta, acolhedora e profissional para aparecer no site.">${escapeHtml(reply)}</textarea>`) }
                    <div class="form-actions mt-3">
                      <button class="px-4 py-2 rounded-2xl bg-ink text-white text-sm font-semibold" data-save-reply="${review.id}">Salvar resposta</button>
                    </div>
                  </div>
                </article>`;
            }).join('') : emptyState('Nenhuma avaliação recebida ainda.')}
          </div>
        </div>
      </div>`;

    root.querySelectorAll('[data-approve]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.approve, { status: 'approved' }, 'A avaliação foi aprovada e já pode aparecer no site.')));
    root.querySelectorAll('[data-hide]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.hide, { status: 'hidden', is_featured: false }, 'A avaliação foi ocultada da vitrine pública.')));
    root.querySelectorAll('[data-unhide]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.unhide, { status: 'approved' }, 'A avaliação voltou a ficar pública no site.')));
    root.querySelectorAll('[data-feature]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.feature, { is_featured: true, status: 'approved' }, 'A avaliação foi destacada e priorizada na área pública.')));
    root.querySelectorAll('[data-unfeature]').forEach((btn) => btn.addEventListener('click', () => moderate(btn.dataset.unfeature, { is_featured: false }, 'O destaque foi removido, mas a avaliação continua salva.')));
    root.querySelectorAll('[data-reply]').forEach((btn) => btn.addEventListener('click', () => root.querySelector(`#reply-box-${btn.dataset.reply}`)?.classList.toggle('hidden')));
    root.querySelectorAll('[data-save-reply]').forEach((btn) => btn.addEventListener('click', () => {
      const text = root.querySelector(`[data-reply-text="${btn.dataset.saveReply}"]`)?.value || '';
      moderate(btn.dataset.saveReply, { admin_reply: text.trim(), replied_at: new Date().toISOString() }, 'A resposta da empresa foi salva com sucesso.');
    }));
  }

  return { render };
})();
