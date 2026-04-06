window.AdminMarketing = (() => {
  const { panelTitle, emptyState, statusPill } = window.AdminUI;
  function render(root, state) {
    const campaigns = state.datasets.campaigns || [];
    const bySource = (state.datasets.appointments || []).reduce((acc, item) => {
      const key = item.channel || 'Sem origem';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    root.innerHTML = `
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Marketing', 'Campanhas ativas')}
          <div class="mt-5 grid gap-4">
            ${campaigns.length ? campaigns.map((item) => `
              <div class="rounded-3xl p-4 bg-roseSoft border border-roseLine">
                <div class="flex items-center justify-between gap-4">
                  <p class="font-semibold">${item.title}</p>
                  ${statusPill(item.is_active === false ? 'Inativa' : 'Ativa')}
                </div>
                <p class="text-sm text-muted mt-1">${item.channel || 'Sem canal'} · ${item.description || 'Sem descrição'}</p>
              </div>`).join('') : emptyState('Nenhuma campanha cadastrada.')}
          </div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Origem dos agendamentos', 'Leitura rápida por canal')}
          <div class="mt-5 space-y-4">
            ${Object.keys(bySource).length ? Object.entries(bySource).map(([source, total]) => `<div><div class="flex justify-between text-sm mb-2"><span>${source}</span><span class="font-semibold">${total}</span></div><div class="progress-track"><div class="progress-bar" style="width:${Math.min(100, total * 12)}%"></div></div></div>`).join('') : emptyState('Ainda não há canais suficientes para leitura.')}
          </div>
        </div>
      </div>`;
  }
  return { render };
})();
