window.AdminConfiguracoes = (() => {
  const { panelTitle, actionButton, field, emptyState } = window.AdminUI;
  const { weekdayLabel } = window.AdminUtils;

  async function saveAll(root) {
    const settingsForm = root.querySelector('#settingsForm');
    const hoursForm = root.querySelector('#hoursForm');
    const settingsPayload = {
      business_name: settingsForm.business_name.value.trim(),
      timezone: settingsForm.timezone.value.trim(),
      pending_hold_minutes: Number(settingsForm.pending_hold_minutes.value || 15),
      booking_window_days: Number(settingsForm.booking_window_days.value || 20),
      whatsapp_number: settingsForm.whatsapp_number.value.trim() || null,
      slot_interval_minutes: Number(settingsForm.slot_interval_minutes.value || 30),
      opens_at: settingsForm.opens_at.value || null,
      closes_at: settingsForm.closes_at.value || null,
      address: settingsForm.address.value.trim() || null
    };

    const hoursPayload = Array.from(hoursForm.querySelectorAll('[data-weekday-row]')).map((row) => ({
      weekday: Number(row.dataset.weekdayRow),
      is_open: row.querySelector('[name="is_open"]').checked,
      open_time: row.querySelector('[name="open_time"]').value || null,
      close_time: row.querySelector('[name="close_time"]').value || null,
      slot_interval_minutes: Number(row.querySelector('[name="slot_interval_minutes"]').value || 30)
    }));

    try {
      await window.AdminSupabase.saveBusinessSettings(settingsPayload);
      await window.AdminSupabase.saveBusinessHours(hoursPayload);
      await window.AdminApp.reloadData();
      alert('Configurações salvas com sucesso.');
    } catch (error) {
      alert(error.message || 'Não foi possível salvar as configurações.');
    }
  }

  function render(root, state) {
    const app = state.datasets.businessSettings || window.APP_CONFIG || {};
    const hours = state.datasets.businessHours || [];
    root.innerHTML = `
      <div class="grid xl:grid-cols-[1fr_1fr] gap-6">
        <div class="card-surface p-6">
          ${panelTitle('Configuração', 'Dados do negócio')}
          <form id="settingsForm" class="mt-6 space-y-4">
            ${field('Nome do negócio', `<input name="business_name" value="${app.business_name || app.businessName || ''}" class="input-base">`)}
            <div class="grid form-grid-2 md:grid-cols-2 gap-3">
              ${field('Timezone', `<input name="timezone" value="${app.timezone || app.businessTimezone || 'America/Sao_Paulo'}" class="input-base">`)}
              ${field('WhatsApp', `<input name="whatsapp_number" value="${app.whatsapp_number || app.whatsappNumber || ''}" class="input-base">`)}
            </div>
            <div class="grid form-grid-2 md:grid-cols-2 gap-3">
              ${field('Hold pendente (min)', `<input name="pending_hold_minutes" type="number" value="${app.pending_hold_minutes || app.pendingHoldMinutes || 15}" class="input-base">`)}
              ${field('Janela de agendamento (dias)', `<input name="booking_window_days" type="number" value="${app.booking_window_days || 20}" class="input-base">`)}
            </div>
            <div class="grid form-grid-3 md:grid-cols-3 gap-3">
              ${field('Intervalo padrão', `<input name="slot_interval_minutes" type="number" value="${app.slot_interval_minutes || 30}" class="input-base">`)}
              ${field('Abre às', `<input name="opens_at" type="time" value="${app.opens_at || ''}" class="input-base">`)}
              ${field('Fecha às', `<input name="closes_at" type="time" value="${app.closes_at || ''}" class="input-base">`)}
            </div>
            ${field('Endereço', `<input name="address" value="${app.address || ''}" class="input-base">`)}
          </form>
        </div>
        <div class="card-surface p-6">
          ${panelTitle('Funcionamento', 'Horários por dia')}
          <form id="hoursForm" class="mt-6 space-y-3">
            ${hours.length ? hours.map((row) => `
              <div class="grid hours-grid md:grid-cols-[80px_100px_1fr_1fr_120px] gap-3 items-center rounded-3xl border border-roseLine p-4 bg-[#FCF8F8]" data-weekday-row="${row.weekday}">
                <div class="font-semibold">${weekdayLabel(row.weekday)}</div>
                <label class="text-sm flex items-center gap-2"><input name="is_open" type="checkbox" ${row.is_open ? 'checked' : ''}> Aberto</label>
                <input name="open_time" type="time" value="${row.open_time || ''}" class="input-base">
                <input name="close_time" type="time" value="${row.close_time || ''}" class="input-base">
                <input name="slot_interval_minutes" type="number" value="${row.slot_interval_minutes || 30}" class="input-base">
              </div>`).join('') : emptyState('Nenhum horário cadastrado.')}
          </form>
          <div class="mt-6 flex gap-3">${actionButton('Salvar configurações', 'type="button" id="saveSettingsButton"', 'primary')}</div>
        </div>
      </div>`;

    root.querySelector('#saveSettingsButton')?.addEventListener('click', () => saveAll(root));
  }
  return { render };
})();
