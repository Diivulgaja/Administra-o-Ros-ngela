window.AdminAgenda = (() => {
  const { dateLabel, todayIso, normalize, appointmentStatusLabel, attendanceStatusLabel, paymentStatusLabel } = window.AdminUtils;
  const { statusPill, emptyState, actionButton, notify } = window.AdminUI;

  function filterAppointments(list, filter, search) {
    const today = todayIso();
    let items = [...list];
    if (filter === 'today') items = items.filter((item) => item.date === today);
    if (filter === 'pending') items = items.filter((item) => item.status === 'pending');
    if (filter === 'confirmed') items = items.filter((item) => item.status === 'confirmed');
    if (filter === 'completed') items = items.filter((item) => ['completed', 'attended'].includes(item.attendance_status));
    if (search) {
      const q = normalize(search);
      items = items.filter((item) => normalize([item.customer_name, item.service_name, item.professional_name, item.channel, item.status].join(' ')).includes(q));
    }
    return items.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  async function runAction(id, patch, after) {
    try {
      await window.AdminSupabase.updateAppointment(id, patch);
      if (after) await after();
      await window.AdminApp.reloadData();
      return true;
    } catch (error) {
      notify({ title: 'Falha ao atualizar', message: error.message || 'Não foi possível atualizar o agendamento.', variant: 'error' });
      return false;
    }
  }

  async function completeAppointment(id) {
    try {
      await window.AdminSupabase.concludeAppointment(id);
      await window.AdminApp.reloadData();
      notify({ title: 'Atendimento concluído', message: 'Agora a avaliação pode ser liberada manualmente no perfil da cliente.', variant: 'success' });
    } catch (error) {
      notify({ title: 'Falha ao concluir', message: error.message || 'Não foi possível concluir o atendimento.', variant: 'error' });
    }
  }

  async function releaseReview(id) {
    try {
      await window.AdminSupabase.releaseAppointmentReview(id);
      await window.AdminApp.reloadData();
      notify({ title: 'Avaliação liberada', message: 'A cliente já pode avaliar diretamente no perfil dela.', variant: 'success' });
    } catch (error) {
      notify({ title: 'Falha ao liberar', message: error.message || 'Não foi possível liberar a avaliação para a cliente.', variant: 'error' });
    }
  }

  function render(root, state) {
    const activeFilter = root.dataset.filter || 'today';
    const appointments = filterAppointments(state.datasets.appointments || [], activeFilter, state.search);
    const liveMode = state.dataSource === 'supabase';
    const hasUuid = (id) => window.AdminSupabase?.isUuid?.(id);

    root.innerHTML = `
      <div class="card-surface overflow-hidden">
        <div class="p-6 border-b border-roseLine flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.16em] text-muted font-semibold">Agenda operacional</p>
            <h2 class="text-2xl font-bold mt-1">Agendamentos e reservas</h2>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button data-agenda-filter="today" class="agenda-filter px-4 py-2 rounded-2xl ${activeFilter === 'today' ? 'bg-ink text-white' : 'border border-roseLine'}">Hoje</button>
            <button data-agenda-filter="all" class="agenda-filter px-4 py-2 rounded-2xl ${activeFilter === 'all' ? 'bg-ink text-white' : 'border border-roseLine'}">Todos</button>
            <button data-agenda-filter="pending" class="agenda-filter px-4 py-2 rounded-2xl ${activeFilter === 'pending' ? 'bg-ink text-white' : 'border border-roseLine'}">Pendentes</button>
            <button data-agenda-filter="confirmed" class="agenda-filter px-4 py-2 rounded-2xl ${activeFilter === 'confirmed' ? 'bg-ink text-white' : 'border border-roseLine'}">Confirmados</button>
            <button data-agenda-filter="completed" class="agenda-filter px-4 py-2 rounded-2xl ${activeFilter === 'completed' ? 'bg-ink text-white' : 'border border-roseLine'}">Concluídos</button>
          </div>
        </div>
        <div class="table-wrap">
          ${appointments.length ? `
            <table class="data-table">
              <thead>
                <tr><th>Data</th><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th><th>Pagamento</th><th>Ações</th></tr>
              </thead>
              <tbody>
                ${appointments.map((item) => {
                  const isCompleted = ['completed', 'attended'].includes(item.attendance_status);
                  const reviewAvailable = item.can_review === true && !item.reviewed_at;
                  const reviewEligible = isCompleted && !reviewAvailable && !item.reviewed_at;

                  return `
                  <tr>
                    <td>${dateLabel(item.date)}</td>
                    <td>${item.time || '-'}</td>
                    <td><div class="font-semibold">${item.customer_name || '-'}</div><div class="text-xs text-muted">${item.customer_phone || '-'}</div></td>
                    <td><div>${item.service_name || '-'}</div><div class="text-xs text-muted">${item.service_category || '-'}</div></td>
                    <td>${item.professional_name || '-'}</td>
                    <td><div class="flex flex-col gap-2">${statusPill(appointmentStatusLabel(item.status || 'pending'))}${statusPill(attendanceStatusLabel(item.attendance_status || 'scheduled'))}${reviewAvailable ? statusPill('Avaliação liberada') : ''}</div></td>
                    <td>${statusPill(paymentStatusLabel(item.payment_status || 'pending'))}<div class="text-xs text-muted mt-2">${AdminUtils.money(item.amount || 0)}</div></td>
                    <td>
                      <div class="flex flex-wrap gap-2">
                        ${liveMode && hasUuid(item.id) && item.status !== 'confirmed' ? actionButton('Confirmar', `data-action="confirm" data-id="${item.id}"`, 'primary') : ''}
                        ${liveMode && hasUuid(item.id) && !isCompleted ? actionButton('Concluir atendimento', `data-action="complete" data-id="${item.id}"`) : ''}
                        ${liveMode && hasUuid(item.id) && reviewEligible ? actionButton('Liberar no perfil', `data-action="release-review" data-id="${item.id}"`) : ''}
                        ${liveMode && hasUuid(item.id) && item.status !== 'cancelled' ? actionButton('Cancelar', `data-action="cancel" data-id="${item.id}"`, 'danger') : ''}
                        ${(!liveMode || !hasUuid(item.id)) ? '<span class="text-xs text-muted">Somente leitura</span>' : ''}
                      </div>
                    </td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>` : emptyState('Nenhum agendamento encontrado para este filtro.')}
        </div>
      </div>`;

    root.querySelectorAll('.agenda-filter').forEach((button) => {
      button.addEventListener('click', () => {
        root.dataset.filter = button.dataset.agendaFilter;
        render(root, AdminState.get());
        lucide.createIcons();
      });
    });

    root.querySelectorAll('[data-action="confirm"]').forEach((button) => {
      button.addEventListener('click', async () => { const ok = await runAction(button.dataset.id, { status: 'confirmed', confirmed_at: new Date().toISOString() }); if (ok) notify({ title: 'Reserva confirmada', message: 'O agendamento foi atualizado com sucesso.', variant: 'success' }); });
    });

    root.querySelectorAll('[data-action="complete"]').forEach((button) => {
      button.addEventListener('click', () => completeAppointment(button.dataset.id));
    });

    root.querySelectorAll('[data-action="cancel"]').forEach((button) => {
      button.addEventListener('click', async () => { const ok = await runAction(button.dataset.id, { status: 'cancelled', attendance_status: 'cancelled', cancelled_at: new Date().toISOString() }); if (ok) notify({ title: 'Agendamento cancelado', message: 'O status foi atualizado no painel.', variant: 'success' }); });
    });

    root.querySelectorAll('[data-action="release-review"]').forEach((button) => {
      button.addEventListener('click', () => releaseReview(button.dataset.id));
    });
  }

  return { render };
})();
