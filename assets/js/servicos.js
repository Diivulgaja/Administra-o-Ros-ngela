window.AdminServicos = (() => {
  const { panelTitle, emptyState, actionButton, field, statusPill } = window.AdminUI;

  async function saveService(form) {
    const payload = {
      id: form.id.value ? Number(form.id.value) : undefined,
      title: form.title.value.trim(),
      category: form.category.value.trim(),
      description: form.description.value.trim() || null,
      duration_minutes: Number(form.duration_minutes.value || 0),
      price: Number(form.price.value || 0),
      is_active: form.is_active.checked,
      sort_order: Number(form.sort_order.value || 0)
    };
    if (!payload.title || !payload.category || !payload.duration_minutes) {
      alert('Preencha título, categoria e duração.');
      return;
    }
    try {
      await window.AdminSupabase.saveService(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível salvar o serviço.');
    }
  }

  function fillForm(root, item) {
    const form = root.querySelector('#serviceForm');
    form.id.value = item.id || '';
    form.title.value = item.title || '';
    form.category.value = item.category || '';
    form.description.value = item.description || '';
    form.duration_minutes.value = item.duration_minutes || '';
    form.price.value = item.price || '';
    form.sort_order.value = item.sort_order || 0;
    form.is_active.checked = item.is_active !== false;
  }

  async function deleteService(id) {
    if (!confirm('Excluir este serviço?')) return;
    try {
      await window.AdminSupabase.deleteService(id);
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir o serviço.');
    }
  }

  function render(root, state) {
    const items = state.datasets.services || [];
    root.innerHTML = `
      <div class="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Serviços', 'Catálogo ativo')}
          <div class="mt-6 space-y-4">
            ${items.length ? items.map((item) => `
              <div class="rounded-3xl border border-roseLine p-4 bg-[#FCF8F8]">
                <div class="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div class="flex items-center gap-2 flex-wrap"><p class="font-semibold">${item.title}</p>${statusPill(item.is_active ? 'Ativo' : 'Inativo')}</div>
                    <p class="text-sm text-muted mt-1">${item.category} · ${item.duration_minutes} min · ${AdminUtils.money(item.price)}</p>
                    <p class="text-sm text-muted mt-2">${item.description || 'Sem descrição.'}</p>
                  </div>
                  <div class="flex gap-2">${actionButton('Editar', `data-edit-service="${item.id}"`)}${actionButton('Excluir', `data-delete-service="${item.id}"`, 'danger')}</div>
                </div>
              </div>`).join('') : emptyState('Nenhum serviço disponível.')}
          </div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Cadastro', 'Criar ou editar serviço')}
          <form id="serviceForm" class="mt-6 space-y-4">
            <input type="hidden" name="id">
            ${field('Título', '<input name="title" class="input-base" required>')}
            ${field('Categoria', '<input name="category" class="input-base" required>')}
            ${field('Descrição', '<textarea name="description" rows="4" class="input-base"></textarea>')}
            <div class="grid form-grid-3 md:grid-cols-3 gap-3">
              ${field('Duração (min)', '<input name="duration_minutes" type="number" min="5" class="input-base" required>')}
              ${field('Preço', '<input name="price" type="number" min="0" step="0.01" class="input-base">')}
              ${field('Ordem', '<input name="sort_order" type="number" min="0" class="input-base">')}
            </div>
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked> Serviço ativo</label>
            <div class="flex gap-3">${actionButton('Salvar serviço', 'type="submit"', 'primary')}${actionButton('Limpar', 'type="button" id="serviceClear"')}</div>
          </form>
        </div>
      </div>`;

    const form = root.querySelector('#serviceForm');
    form.addEventListener('submit', (event) => { event.preventDefault(); saveService(form); });
    root.querySelector('#serviceClear').addEventListener('click', () => form.reset());
    root.querySelectorAll('[data-edit-service]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((entry) => String(entry.id) === button.dataset.editService);
      if (item) fillForm(root, item);
    }));
    root.querySelectorAll('[data-delete-service]').forEach((button) => button.addEventListener('click', () => deleteService(Number(button.dataset.deleteService))));
  }
  return { render };
})();
