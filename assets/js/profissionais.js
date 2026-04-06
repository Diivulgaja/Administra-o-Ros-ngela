window.AdminProfissionais = (() => {
  const { panelTitle, personChip, emptyState, actionButton, field } = window.AdminUI;

  async function saveProfessional(form) {
    const payload = {
      id: form.id.value || undefined,
      full_name: form.full_name.value.trim(),
      role: form.role.value.trim() || null,
      phone: form.phone.value.trim() || null,
      email: form.email.value.trim() || null,
      bio: form.bio.value.trim() || null,
      is_active: form.is_active.checked
    };
    if (!payload.full_name) {
      alert('Nome da profissional é obrigatório.');
      return;
    }
    try {
      await window.AdminSupabase.saveProfessional(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível salvar a profissional.');
    }
  }

  function fillForm(root, item) {
    const form = root.querySelector('#professionalForm');
    form.id.value = item.id || '';
    form.full_name.value = item.full_name || item.name || '';
    form.role.value = item.role || item.specialty || '';
    form.phone.value = item.phone || '';
    form.email.value = item.email || '';
    form.bio.value = item.bio || '';
    form.is_active.checked = item.is_active !== false;
  }

  async function deleteProfessional(id) {
    if (!confirm('Excluir esta profissional?')) return;
    try {
      await window.AdminSupabase.deleteProfessional(id);
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível excluir a profissional.');
    }
  }

  function render(root, state) {
    const items = state.datasets.professionals || [];
    root.innerHTML = `
      <div class="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Equipe', 'Profissionais e disponibilidade')}
          <div class="mt-5 space-y-4">
            ${items.length ? items.map((item) => `<div>${personChip(item.full_name || item.name, item.role || item.specialty || 'Profissional', item.status_label || 'Disponível')}<div class="mt-3 flex gap-2">${actionButton('Editar', `data-edit-professional="${item.id}"`)}${actionButton('Excluir', `data-delete-professional="${item.id}"`, 'danger')}</div></div>`).join('') : emptyState('Nenhum profissional cadastrado.')}
          </div>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Cadastro', 'Criar ou editar profissional')}
          <form id="professionalForm" class="mt-6 space-y-4">
            <input type="hidden" name="id">
            ${field('Nome completo', '<input name="full_name" class="input-base" required>')}
            ${field('Especialidade / função', '<input name="role" class="input-base">')}
            <div class="grid form-grid-2 md:grid-cols-2 gap-3">
              ${field('Telefone', '<input name="phone" class="input-base">')}
              ${field('E-mail', '<input name="email" type="email" class="input-base">')}
            </div>
            ${field('Bio', '<textarea name="bio" rows="4" class="input-base"></textarea>')}
            <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked> Profissional ativa</label>
            <div class="flex gap-3">${actionButton('Salvar profissional', 'type="submit"', 'primary')}${actionButton('Limpar', 'type="button" id="professionalClear"')}</div>
          </form>
        </div>
      </div>`;

    const form = root.querySelector('#professionalForm');
    form.addEventListener('submit', (event) => { event.preventDefault(); saveProfessional(form); });
    root.querySelector('#professionalClear').addEventListener('click', () => form.reset());
    root.querySelectorAll('[data-edit-professional]').forEach((button) => button.addEventListener('click', () => {
      const item = items.find((entry) => entry.id === button.dataset.editProfessional);
      if (item) fillForm(root, item);
    }));
    root.querySelectorAll('[data-delete-professional]').forEach((button) => button.addEventListener('click', () => deleteProfessional(button.dataset.deleteProfessional)));
  }
  return { render };
})();
