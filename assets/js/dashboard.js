window.AdminDashboard = (() => {
  const { money, number, todayIso, appointmentStatusLabel } = window.AdminUtils;
  const { metricCard, panelTitle, statusPill, emptyState, personChip } = window.AdminUI;

  function computeMetrics(data) {
    const today = todayIso();
    const appointments = data.appointments || [];
    const customers = data.customers || [];
    const services = data.services || [];
    const professionals = data.professionals || [];
    const blocked = (data.blockedSlots || []).length + (data.blockedPeriods || []).length;

    const todayAppointments = appointments.filter((item) => item.date === today);
    const confirmed = todayAppointments.filter((item) => item.status === 'confirmed').length;
    const pending = todayAppointments.filter((item) => item.status === 'pending').length;
    const cancelled = todayAppointments.filter((item) => item.status === 'cancelled').length;
    const monthlyRevenue = appointments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expectedToday = todayAppointments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    return {
      todayAppointments: todayAppointments.length,
      confirmed,
      pending,
      cancelled,
      monthlyRevenue,
      customers: customers.length,
      services: services.length,
      professionals: professionals.length,
      blocked,
      expectedToday
    };
  }

  function render(root, state) {
    const data = state.datasets;
    const metrics = data.dashboardToday || computeMetrics(data);
    const todayList = (data.appointments || []).filter((item) => item.date === todayIso()).slice(0, 6);
    const professionals = (data.professionals || []).slice(0, 4);
    const topServices = (data.topServices || []).slice(0, 5);
    const settings = data.businessSettings || {};

    root.innerHTML = `
      <section class="rounded-[32px] bg-hero text-white overflow-hidden shadow-soft">
        <div class="grid lg:grid-cols-[1.5fr_0.9fr] gap-6 p-6 md:p-8">
          <div>
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/10 text-xs font-semibold tracking-[0.15em] uppercase">
              <span class="w-2 h-2 rounded-full bg-[#F09898]"></span>
              operação em tempo real
            </div>
            <h1 class="mt-5 font-display text-4xl md:text-6xl leading-tight max-w-3xl">Painel da clínica com dados <span class="text-[#F3D8D8] italic">reais do banco.</span></h1>
            <p class="mt-4 text-white/75 max-w-2xl text-base md:text-lg">Visão consolidada da agenda, serviços, clientes, profissionais, bloqueios e configurações do negócio.</p>
            <div class="grid sm:grid-cols-3 gap-4 mt-8">
              <div class="rounded-3xl border border-white/12 bg-white/10 p-4"><p class="text-xs uppercase tracking-[0.18em] text-white/55">Receita mapeada</p><p class="text-3xl font-bold mt-2">${money(metrics.expected_revenue_today ?? metrics.expectedToday ?? 0)}</p><p class="text-sm text-white/70 mt-1">prevista para hoje</p></div>
              <div class="rounded-3xl border border-white/12 bg-white/10 p-4"><p class="text-xs uppercase tracking-[0.18em] text-white/55">Clientes</p><p class="text-3xl font-bold mt-2">${number(metrics.customers || data.customers?.length || 0)}</p><p class="text-sm text-white/70 mt-1">cadastros consolidados</p></div>
              <div class="rounded-3xl border border-white/12 bg-white/10 p-4"><p class="text-xs uppercase tracking-[0.18em] text-white/55">Funcionamento</p><p class="text-3xl font-bold mt-2">${settings.opens_at || '09:00'}–${settings.closes_at || '18:00'}</p><p class="text-sm text-white/70 mt-1">${settings.timezone || 'America/Sao_Paulo'}</p></div>
            </div>
          </div>
          <div class="glass rounded-[28px] border border-white/20 p-5 text-ink self-start">
            ${panelTitle('Resumo executivo', 'Leituras principais')}
            <div class="mt-6 space-y-3">
              <div class="flex items-start gap-3 p-3 rounded-2xl bg-white border border-roseLine"><span class="w-8 h-8 rounded-xl bg-blush text-white text-sm font-bold flex items-center justify-center">1</span><div><p class="font-semibold">Agenda de hoje</p><p class="text-sm text-muted">${number(metrics.total_today ?? metrics.todayAppointments ?? 0)} horários previstos.</p></div></div>
              <div class="flex items-start gap-3 p-3 rounded-2xl bg-white border border-roseLine"><span class="w-8 h-8 rounded-xl bg-[#EDE7E7] text-ink text-sm font-bold flex items-center justify-center">2</span><div><p class="font-semibold">Confirmações</p><p class="text-sm text-muted">${number(metrics.confirmed_today ?? metrics.confirmed ?? 0)} confirmados e ${number(metrics.pending_today ?? metrics.pending ?? 0)} pendentes.</p></div></div>
              <div class="flex items-start gap-3 p-3 rounded-2xl bg-white border border-roseLine"><span class="w-8 h-8 rounded-xl bg-[#EDE7E7] text-ink text-sm font-bold flex items-center justify-center">3</span><div><p class="font-semibold">Bloqueios</p><p class="text-sm text-muted">${number(metrics.blocked || 0)} bloqueios carregados para gestão da agenda.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        ${metricCard('calendar-check-2', 'Agendamentos de hoje', number(metrics.total_today ?? metrics.todayAppointments ?? 0), 'janela diária', '<span class="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600">ao vivo</span>')}
        ${metricCard('badge-check', 'Confirmados hoje', number(metrics.confirmed_today ?? metrics.confirmed ?? 0), 'status operacional')}
        ${metricCard('wallet', 'Receita consolidada', money(metrics.monthlyRevenue || 0), 'somando base carregada')}
        ${metricCard('users', 'Profissionais ativos', number((data.professionals || []).filter((item) => item.is_active).length), 'equipe disponível')}
      </section>

      <section class="grid grid-cols-1 2xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Próximos horários', 'Agenda do dia')}
          <div class="table-wrap mt-6">
            ${todayList.length ? `
              <table class="data-table">
                <thead><tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Profissional</th><th>Status</th></tr></thead>
                <tbody>
                  ${todayList.map((item) => `<tr><td>${item.time || '-'}</td><td>${item.customer_name || '-'}</td><td>${item.service_name || '-'}</td><td>${item.professional_name || '-'}</td><td>${statusPill(appointmentStatusLabel(item.status || 'pending'))}</td></tr>`).join('')}
                </tbody>
              </table>` : emptyState('Nenhum horário para hoje.')}
          </div>
        </div>
        <div class="space-y-6">
          <div class="card-surface p-6">
            ${panelTitle('Equipe', 'Profissionais')}
            <div class="mt-5 space-y-4">
              ${professionals.length ? professionals.map((item) => personChip(item.name, item.specialty || 'Profissional', item.status_label || 'Disponível')).join('') : emptyState('Nenhum profissional cadastrado.')}
            </div>
          </div>
          <div class="card-surface p-6">
            ${panelTitle('Serviços em destaque', 'Mais recorrentes')}
            <div class="mt-5 space-y-4">
              ${topServices.length ? topServices.map((item) => `<div><div class="flex justify-between text-sm mb-2"><span>${item.title}</span><span class="font-semibold">${number(item.total_bookings || 0)} agend.</span></div><div class="progress-track"><div class="progress-bar" style="width:${Math.min(100, Math.max(10, Number(item.total_bookings || 0) * 10))}%"></div></div><p class="text-xs text-muted mt-2">${money(item.total_revenue || 0)}</p></div>`).join('') : emptyState('Ainda não há ranking de serviços.')}
            </div>
          </div>
        </div>
      </section>`;
  }

  return { render, computeMetrics };
})();
