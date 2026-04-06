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

  function showFatalError(error) {
    const panel = document.getElementById('fatalErrorPanel');
    const title = document.getElementById('fatalErrorTitle');
    const details = document.getElementById('fatalErrorDetails');
    const connectionTitle = document.getElementById('connectionTitle');
    const connectionDescription = document.getElementById('connectionDescription');
    const connectionBadge = document.getElementById('connectionBadge');

    console.error('Falha fatal no painel:', error);

    if (connectionTitle) connectionTitle.textContent = 'Painel carregado com falha';
    if (connectionDescription) connectionDescription.textContent = error?.message || 'Erro inesperado ao iniciar o painel.';
    if (connectionBadge) {
      connectionBadge.textContent = 'Erro de inicialização';
      connectionBadge.className = 'px-4 py-2 rounded-full bg-red-50 text-red-600 font-semibold text-sm';
    }

    if (!panel) return;

    const message = error?.message || 'Erro inesperado ao iniciar o painel.';
    const stack = String(error?.stack || '').split('\n').slice(0, 8).join('\n');

    if (title) title.textContent = 'O painel encontrou um erro de inicialização';
    if (details) details.textContent = stack ? `${message}\n\n${stack}` : message;
    panel.classList.remove('hidden');
  }

  async function init() {
    const statusEl = document.getElementById('bootStatus');
    try {
      if (statusEl) statusEl.textContent = 'Validando sessão administrativa...';
      const auth = await window.AdminAuth.requireAdmin();
      AdminState.set({ adminUser: auth.admin });

      bindEvents();
      lucide.createIcons();
      if (statusEl) statusEl.textContent = 'Carregando dados do painel...';
      await loadData();
      document.body.classList.remove('admin-loading');
      if (statusEl) statusEl.remove();
      sessionStorage.removeItem('rs-admin-last-boot-error');
    } catch (error) {
      const message = String(error?.message || error || '');
      const isAuthError = /sessão|permissão|admin|autentic|token|jwt/i.test(message);
      sessionStorage.setItem('rs-admin-last-boot-error', message);
      if (isAuthError) {
        console.error('Falha de autenticação no painel:', error);
        window.location.replace('./login.html?reason=auth');
        return;
      }
      showFatalError(error);
    }
  }

  return { init, reloadData, renderSection, showFatalError };
})();

window.addEventListener('error', (event) => {
  if (window.AdminApp?.showFatalError) {
    window.AdminApp.showFatalError(event.error || new Error(event.message || 'Erro de runtime'));
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.AdminApp?.showFatalError) {
    window.AdminApp.showFatalError(event.reason || new Error('Promise rejeitada sem tratamento'));
  }
});

document.addEventListener('DOMContentLoaded', () => {
  window.AdminApp.init();
});
