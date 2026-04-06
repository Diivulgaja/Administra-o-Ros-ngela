window.AdminClientes = (() => {
  const { normalize, initials, dateTimeLabel } = window.AdminUtils;
  const { panelTitle, emptyState, actionButton, field } = window.AdminUI;

  async function saveCustomer(form) {
    const payload = {
      id: form.id.value || undefined,
      full_name: form.full_name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim() || null,
      notes: form.notes.value.trim() || null,
      is_active: form.is_active.checked
    };
    if (!payload.full_name || !payload.phone) {
      alert('Nome e telefone são obrigatórios.');
      return;
    }
    try {
      await window.AdminSupabase.saveCustomer(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível salvar a cliente.');
    }
  }

  function fillForm(root, item) {
    const form = root.querySelector('#customerForm');
    form.id.value = item.id || '';
    form.full_name.value = item.full_name || item.name || '';
    form.phone.value = item.phone || '';
    form.email.value = item.email || '';
    form.notes.value = item.notes || '';
    form.is_active.checked = item.is_active !== false;
  }

  function render(root, state) {
    const q = normalize(state.search);
    const items = (state.datasets.customers || []).filter((item) => !q || normalize([item.full_name, item.name, item.phone, item.email].join(' ')).includes(q));

    root.innerHTML = `
      <div class="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Clientes', 'Relacionamento e CRM')}
          <div class="mt-6 grid gap-4">
            ${items.length ? items.map((item) => `
              <div class="flex items-center gap-4 p-4 rounded-3xl bg-[#FCF8F8] border border-roseLine flex-wrap">
                <div class="w-12 h-12 rounded-2xl bg-[#E8D6D6] flex items-center justify-center font-bold">${initials(item.full_name || item.name)}</div>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold truncate">${item.full_name || item.name}</p>
                  <p class="text-sm text-muted truncate">${item.phone || '-'} · ${item.email || 'sem e-mail'} · ${item.visits_count ?? item.visits ?? 0} visitas</p>
                  <p class="text-xs text-muted mt-1">Última visita: ${dateTimeLabel(item.last_visit_at) || '-'}</p>
                </div>
                ${actionButton('Editar', `data-edit-customer="${item.id}"`)}
              </div>`).join('') : emptyState('Nenhum cliente encontrado.')}
          </div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Cadastro', 'Criar ou editar cliente')}
          <form id="customerForm" class="mt-6 space-y-4">
            <input type="hidden" name="id">
            ${field('Nome completo', '<input name="full_name" class="w-full rounded-2xl border border-roseLine px-4 py-3" required>')}
            ${field('Telefone', '<input name="phone" class="w-full rounded-2xl border border-roseLine px-4 py-3" required>')}
            ${field('E-mail', '<input name="email" type="email" class="w-full rounded-2xl border border-roseLine px-4 py-3">')}
            ${field('Observações', '<textarea name="notes" rows="4" class="w-full rounded-2xl border border-roseLine px-4 py-3"></textarea>')}
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked> Cliente ativa</label>
            <div class="flex gap-3">${actionButton('Salvar cliente', 'type="submit"', 'primary')}${actionButton('Limpar', 'type="button" id="customerClear"')}</div>
          </form>
        </div>
      </div>`;

    const form = root.querySelector('#customerForm');
    form.addEventListener('submit', (event) => { event.preventDefault(); saveCustomer(form); });
    root.querySelector('#customerClear').addEventListener('click', () => form.reset());
    root.querySelectorAll('[data-edit-customer]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((entry) => entry.id === button.dataset.editCustomer);
      if (item) fillForm(root, item);
    }));
  }

  return { render };
})();
