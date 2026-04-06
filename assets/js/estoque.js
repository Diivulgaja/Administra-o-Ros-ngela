window.AdminEstoque = (() => {
  const { panelTitle, emptyState, field, statusPill } = window.AdminUI;

  async function saveItem(form) {
    const payload = {
      id: form.id.value || undefined,
      name: form.name.value.trim(),
      category: form.category.value.trim() || null,
      sku: form.sku.value.trim() || null,
      unit: form.unit.value.trim() || 'un',
      quantity_in_stock: Number(form.quantity_in_stock.value || 0),
      minimum_stock: Number(form.minimum_stock.value || 0),
      cost_price: form.cost_price.value ? Number(form.cost_price.value) : null,
      sale_price: form.sale_price.value ? Number(form.sale_price.value) : null,
      is_active: form.is_active.checked,
      notes: form.notes.value.trim() || null
    };
    if (!payload.name) return alert('Nome do item é obrigatório.');
    try {
      await window.AdminSupabase.saveInventoryItem(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível salvar o item.');
    }
  }

  async function saveMovement(form) {
    const payload = {
      item_id: form.item_id.value,
      movement_type: form.movement_type.value,
      quantity: Number(form.quantity.value || 0),
      reason: form.reason.value.trim() || null
    };
    if (!payload.item_id || payload.quantity <= 0) return alert('Selecione um item e informe quantidade válida.');
    try {
      await window.AdminSupabase.saveInventoryMovement(payload);
      form.reset();
      await window.AdminApp.reloadData();
    } catch (error) {
      alert(error.message || 'Não foi possível lançar a movimentação.');
    }
  }

  function render(root, state) {
    const items = state.datasets.inventoryItems || [];
    const moves = state.datasets.inventoryMovements || [];
    const low = items.filter((item) => item.quantity_in_stock <= item.minimum_stock);
    root.innerHTML = `
      <div class="grid xl:grid-cols-[1.2fr_0.8fr] gap-6">
        <div class="space-y-6">
          <div class="card-surface p-6">
            ${panelTitle('Estoque', 'Itens e alertas')}
            <div class="grid md:grid-cols-3 gap-4 mt-6">
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Itens ativos</p><p class="text-2xl font-bold mt-1">${items.filter((i) => i.is_active).length}</p></div>
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Baixo estoque</p><p class="text-2xl font-bold mt-1">${low.length}</p></div>
              <div class="rounded-3xl bg-[#FCF8F8] border border-roseLine p-4"><p class="text-sm text-muted">Movimentações</p><p class="text-2xl font-bold mt-1">${moves.length}</p></div>
            </div>
            <div class="table-wrap mt-6">
              ${items.length ? `<table class="data-table"><thead><tr><th>Item</th><th>Categoria</th><th>Saldo</th><th>Mínimo</th><th>Status</th></tr></thead><tbody>${items.map((item) => `<tr><td>${item.name}</td><td>${item.category || '-'}</td><td>${item.quantity_in_stock} ${item.unit}</td><td>${item.minimum_stock} ${item.unit}</td><td>${item.quantity_in_stock <= item.minimum_stock ? statusPill('Baixo estoque') : statusPill('OK')}</td></tr>`).join('')}</tbody></table>` : emptyState('Nenhum item no estoque.')}
            </div>
          </div>
          <div class="card-surface p-6">
            ${panelTitle('Movimentações', 'Histórico recente')}
            <div class="table-wrap mt-6">
              ${moves.length ? `<table class="data-table"><thead><tr><th>Data</th><th>Item</th><th>Tipo</th><th>Quantidade</th><th>Motivo</th></tr></thead><tbody>${moves.slice(0,12).map((m) => `<tr><td>${AdminUtils.dateTimeLabel(m.created_at)}</td><td>${items.find((i) => i.id === m.item_id)?.name || m.item_id}</td><td>${m.movement_type}</td><td>${m.quantity}</td><td>${m.reason || '-'}</td></tr>`).join('')}</tbody></table>` : emptyState('Nenhuma movimentação lançada.')}
            </div>
          </div>
        </div>
        <div class="space-y-6">
          <div class="card-surface p-6">
            ${panelTitle('Novo item', 'Cadastro de produto')}
            <form id="inventoryItemForm" class="space-y-4 mt-6">
              <input type="hidden" name="id" />
              ${field('Nome', '<input class="input-base" name="name" />')}
              <div class="grid form-grid-2 md:grid-cols-2 gap-4">
                ${field('Categoria', '<input class="input-base" name="category" />')}
                ${field('SKU', '<input class="input-base" name="sku" />')}
              </div>
              <div class="grid form-grid-3 md:grid-cols-3 gap-4">
                ${field('Unidade', '<input class="input-base" name="unit" value="un" />')}
                ${field('Saldo inicial', '<input class="input-base" type="number" step="0.01" min="0" name="quantity_in_stock" />')}
                ${field('Estoque mínimo', '<input class="input-base" type="number" step="0.01" min="0" name="minimum_stock" />')}
              </div>
              <div class="grid form-grid-2 md:grid-cols-2 gap-4">
                ${field('Custo', '<input class="input-base" type="number" step="0.01" min="0" name="cost_price" />')}
                ${field('Venda', '<input class="input-base" type="number" step="0.01" min="0" name="sale_price" />')}
              </div>
              ${field('Observações', '<textarea class="input-base min-h-[90px]" name="notes"></textarea>')}
              <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" checked /> Item ativo</label>
              <button class="px-4 py-3 rounded-2xl bg-blush text-white font-semibold">Salvar item</button>
            </form>
          </div>
          <div class="card-surface p-6">
            ${panelTitle('Lançar movimento', 'Entrada ou saída')}
            <form id="inventoryMovementForm" class="space-y-4 mt-6">
              ${field('Item', `<select name="item_id" class="input-base"><option value="">Selecione</option>${items.map((item) => `<option value="${item.id}">${item.name}</option>`).join('')}</select>`) }
              <div class="grid form-grid-2 md:grid-cols-2 gap-4">
                ${field('Tipo', `<select name="movement_type" class="input-base"><option value="in">Entrada</option><option value="out">Saída</option><option value="adjustment">Ajuste</option><option value="usage">Uso em serviço</option></select>`)}
                ${field('Quantidade', '<input class="input-base" type="number" step="0.01" min="0.01" name="quantity" />')}
              </div>
              ${field('Motivo', '<input class="input-base" name="reason" />')}
              <button class="px-4 py-3 rounded-2xl bg-ink text-white font-semibold">Registrar movimento</button>
            </form>
          </div>
        </div>
      </div>`;

    root.querySelector('#inventoryItemForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveItem(e.currentTarget); });
    root.querySelector('#inventoryMovementForm')?.addEventListener('submit', (e) => { e.preventDefault(); saveMovement(e.currentTarget); });
  }

  return { render };
})();
