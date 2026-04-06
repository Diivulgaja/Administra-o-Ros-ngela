window.AdminMensagens = (() => {
  const { panelTitle, emptyState } = window.AdminUI;
  function render(root, state) {
    const customers = state.datasets.customers || [];
    const pending = (state.datasets.appointments || []).filter((item) => item.status === 'pending');
    root.innerHTML = `
      <div class="card-surface p-6">
        ${panelTitle('Mensagens', 'Pendências para contato')}
        <div class="mt-5 space-y-3">
          ${pending.length ? pending.map((item) => `<div class="p-4 rounded-3xl border border-roseLine bg-[#FCF8F8]"><div class="flex items-center justify-between gap-4"><p class="font-semibold">${item.customer_name} · confirmação pendente</p><span class="text-xs text-muted">${item.date} ${item.time}</span></div><p class="text-sm text-muted mt-1">${item.customer_phone || 'Sem telefone'} · ${item.service_name}</p></div>`).join('') : emptyState('Sem confirmações pendentes.')}        
        </div>
        <p class="text-sm text-muted mt-5">Como ainda não existe integração nativa com WhatsApp nesta base, este módulo mostra quem precisa de contato a partir dos agendamentos pendentes.</p>
      </div>`;
  }
  return { render };
})();
