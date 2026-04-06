window.AdminFinanceiro = (() => {
  const { panelTitle, emptyState, statusPill, field } = window.AdminUI;

  async function savePayment(form) {
    const payload = {
      appointment_id: form.appointment_id.value,
      amount: Number(form.amount.value || 0),
      payment_method: form.payment_method.value,
      payment_status: form.payment_status.value,
      notes: form.notes.value.trim() || null,
      paid_at: new Date().toISOString()
    };
    if (!payload.appointment_id || payload.amount <= 0) {
      alert('Selecione um agendamento e informe um valor válido.');
      return;
    }
    try {
      await window.AdminSupabase.savePayment(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível registrar o pagamento.');
    }
  }

  function render(root, state) {
    const appointments = state.datasets.appointments || [];
    const payments = state.datasets.payments || [];
    const totalAppointments = appointments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const paid = payments.filter((item) => item.payment_status === 'paid').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const partial = payments.filter((item) => item.payment_status === 'partial').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const pending = appointments.filter((item) => item.payment_status === 'pending').reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const rows = payments.slice(0, 10);

    root.innerHTML = `
      <div class="grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="space-y-6">
          <div class="card-surface p-6">
            ${panelTitle('Financeiro', 'Receita consolidada')}
            <div class="grid md:grid-cols-2 gap-4 mt-6">
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Previsto</p><p class="text-2xl font-bold mt-1">${AdminUtils.money(totalAppointments)}</p></div>
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Recebido</p><p class="text-2xl font-bold mt-1">${AdminUtils.money(paid)}</p></div>
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Parcial</p><p class="text-2xl font-bold mt-1">${AdminUtils.money(partial)}</p></div>
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Pendente</p><p class="text-2xl font-bold mt-1">${AdminUtils.money(pending)}</p></div>
            </div>
          </div>
          <div class="card-surface p-6">
            ${panelTitle('Pagamentos lançados', 'Histórico recente')}
            <div class="table-wrap mt-6">
              ${rows.length ? `<table class="data-table"><thead><tr><th>Data</th><th>Agendamento</th><th>Valor</th><th>Método</th><th>Status</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${AdminUtils.dateTimeLabel(item.paid_at || item.created_at)}</td><td>${item.appointment_id}</td><td>${AdminUtils.money(item.amount || 0)}</td><td>${item.payment_method || '-'}</td><td>${statusPill(AdminUtils.paymentStatusLabel(item.payment_status || 'pending'))}</td></tr>`).join('')}</tbody></table>` : emptyState('Nenhum pagamento lançado.')}
            </div>
          </div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Registrar pagamento', 'Lançamento manual')}
          <form id="paymentForm" class="space-y-4 mt-6">
            ${field('Agendamento', `<select name="appointment_id" class="input-base"><option value="">Selecione</option>${appointments.map((item) => `<option value="${item.id}">${item.customer_name} · ${item.service_name} · ${item.date}</option>`).join('')}</select>`) }
            <div class="grid form-grid-2 md:grid-cols-2 gap-4">
              ${field('Valor', '<input class="input-base" name="amount" type="number" step="0.01" min="0" />')}
              ${field('Método', `<select name="payment_method" class="input-base"><option value="pix">Pix</option><option value="dinheiro">Dinheiro</option><option value="cartao">Cartão</option><option value="transferencia">Transferência</option></select>`)}
            </div>
            ${field('Status', `<select name="payment_status" class="input-base"><option value="paid">Pago</option><option value="partial">Parcial</option><option value="pending">Pendente</option><option value="refunded">Reembolsado</option><option value="failed">Falhou</option></select>`)}
            ${field('Observações', '<textarea class="input-base min-h-[110px]" name="notes"></textarea>')}
            <button class="px-4 py-3 rounded-2xl bg-blush text-white font-semibold">Salvar pagamento</button>
          </form>
        </div>
      </div>`;

    root.querySelector('#paymentForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      savePayment(event.currentTarget);
    });
  }

  return { render };
})();
