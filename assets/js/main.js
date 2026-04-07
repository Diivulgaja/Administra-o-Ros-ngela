console.info('Admin build 20260406e — fluxo de link desativado.');
window.AdminApp = (() => {
  const sections = ['dashboard', 'agenda', 'clientes', 'servicos', 'profissionais', 'financeiro', 'estoque', 'avaliacoes', 'mensagens', 'marketing', 'configuracoes'];

  function $(selector) { return document.querySelector(selector); }
  function $all(selector) { return Array.from(document.querySelectorAll(selector)); }

  function setConnectionUi(source, errors = []) {
    const title = $('#connectionTitle');
    const description = $('#connectionDescription');
    const badge = $('#connectionBadge');

    if (source === 'supabase') {
      title.textContent = 'Integração conectada ao Supabase';
      description.textContent = errors.length ? `Alguns módulos ainda falharam: ${errors.join(' | ')}` : 'Os módulos carregaram dados reais da base do projeto.';
      badge.textContent = 'Supabase ativo';
      badge.className = 'px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-semibold text-sm';
      return;
    }

    title.textContent = 'Modo local com dados base';
    description.textContent = window.AdminSupabase.hasConfig() ? `Há conexão, mas ocorreram falhas: ${errors.join(' | ') || 'sem detalhes'}` : 'Sem Supabase configurado, o painel usa fallback local.';
    badge.textContent = 'Fallback local';
    badge.className = 'px-4 py-2 rounded-full bg-[#F5EBEB] text-[#8E5F5F] font-semibold text-sm';
  }

  function updateSidebarSummary() {
    const state = AdminState.get();
    const metrics = AdminDashboard.computeMetrics(state.datasets);
    const occupancy = Math.min(100, Math.round(((metrics.todayAppointments || 0) / ADMIN_CONFIG.occupancyCapacityPerDay) * 100));
    $('#sidebarAppointmentsToday').textContent = metrics.todayAppointments || 0;
    $('#sidebarOccupancyText').textContent = `${occupancy}%`;
    $('#sidebarOccupancyBar').style.width = `${occupancy}%`;
  }

  function updateHeaderProfile() {
    const state = AdminState.get();
    const admin = state.adminUser || state.datasets.adminProfile || null;
    const nameEl = $('#adminName');
    const roleEl = $('#adminRole');
    const initialsEl = $('#adminInitials');
    if (!nameEl || !roleEl || !initialsEl) return;

    const fullName = admin?.full_name || 'Administrador';
    const role = admin?.role || 'admin';
    const initials = fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'AD';

    nameEl.textContent = fullName;
    roleEl.textContent = role;
    initialsEl.textContent = initials;
  }

  function renderSection(sectionName) {
    const state = AdminState.get();
    const renderMap = {
      dashboard: AdminDashboard.render,
      agenda: AdminAgenda.render,
      clientes: AdminClientes.render,
      servicos: AdminServicos.render,
      profissionais: AdminProfissionais.render,
      financeiro: AdminFinanceiro.render,
      estoque: AdminEstoque.render,
      avaliacoes: AdminAvaliacoes.render,
      mensagens: AdminMensagens.render,
      marketing: AdminMarketing.render,
      configuracoes: AdminConfiguracoes.render
    };

    sections.forEach((name) => document.getElementById(name).classList.toggle('active', name === sectionName));
    renderMap[sectionName]?.(document.getElementById(sectionName), state);
    lucide.createIcons();
  }

  function renderAll() {
    updateHeaderProfile();
    updateSidebarSummary();
    renderSection(AdminState.get().activeSection);
  }

  async function loadData() {
    const result = await AdminSupabase.loadDatasets();
    Object.entries(result.datasets).forEach(([key, value]) => AdminState.updateDataset(key, value));
    AdminState.set({ dataSource: result.source, connectionReady: true, lastSyncAt: new Date().toISOString() });
    setConnectionUi(result.source, result.errors);
    renderAll();
  }

  async function reloadData() {
    await loadData();
  }

  function setActiveSection(sectionName) {
    AdminState.set({ activeSection: sectionName });
    $all('.nav-link').forEach((button) => button.classList.toggle('is-active', button.dataset.section === sectionName));
    renderSection(sectionName);
    closeSidebar();
  }

  function openSidebar() { $('#sidebar').classList.add('sidebar-open'); $('#mobileOverlay').classList.remove('hidden'); }
  function closeSidebar() { $('#sidebar').classList.remove('sidebar-open'); $('#mobileOverlay').classList.add('hidden'); }

  async function logout() {
    try { await window.AdminAuth.signOut(); } finally { window.location.replace('./login.html'); }
  }

  function bindEvents() {
    $all('.nav-link').forEach((button) => button.addEventListener('click', () => setActiveSection(button.dataset.section)));
    $('#mobileMenuButton').addEventListener('click', openSidebar);
    $('#mobileOverlay').addEventListener('click', closeSidebar);
    $('#syncButton').addEventListener('click', loadData);
    $('#newAppointmentButton').addEventListener('click', () => setActiveSection('agenda'));
    $('#globalSearchInput').addEventListener('input', (event) => {
      AdminState.set({ search: event.target.value.trim() });
      renderSection(AdminState.get().activeSection);
    });
    $('#logoutButton')?.addEventListener('click', logout);
  }

  function isAuthFailure(error) {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('sessão não encontrada')
      || message.includes('sessao não encontrada')
      || message.includes('sessao nao encontrada')
      || message.includes('sessão nao encontrada')
      || message.includes('usuário sem permissão administrativa')
      || message.includes('usuario sem permissão administrativa')
      || message.includes('usuario sem permissao administrativa')
      || message.includes('refresh token')
      || message.includes('jwt')
      || message.includes('auth');
  }

  async function init() {
    const statusEl = document.getElementById('bootStatus');
    try {
      if (statusEl) statusEl.textContent = 'Validando sessão administrativa...';
      const auth = await window.AdminAuth.requireAdmin();
      AdminState.set({ adminUser: auth.admin });

      bindEvents();
      lucide.createIcons();
      renderAll();

      if (statusEl) statusEl.textContent = 'Carregando dados do painel...';
      try {
        await loadData();
      } catch (loadError) {
        console.error('Falha ao carregar datasets do painel:', loadError);
        setConnectionUi('mock', [loadError.message || 'Falha ao carregar dados do painel.']);
        renderAll();
      }

      document.body.classList.remove('admin-loading');
      if (statusEl) statusEl.remove();
    } catch (error) {
      console.error('Falha ao iniciar painel:', error);
      if (isAuthFailure(error)) {
        window.location.replace('./login.html?reason=session');
        return;
      }
      document.body.classList.remove('admin-loading');
      if (statusEl) {
        statusEl.textContent = `Falha ao iniciar o painel: ${error.message || 'erro desconhecido'}`;
      }
    }
  }

  return { init, reloadData, renderSection };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.AdminApp.init();
});
