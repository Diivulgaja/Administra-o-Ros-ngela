window.AdminState = (() => {
  const state = {
    activeSection: 'dashboard',
    search: '',
    dataSource: 'mock',
    connectionReady: false,
    lastSyncAt: null,
    adminUser: null,
    datasets: {
      appointments: [],
      customers: [],
      services: [],
      professionals: [],
      professionalServices: [],
      businessSettings: null,
      businessHours: [],
      blockedSlots: [],
      blockedPeriods: [],
      payments: [],
      campaigns: [],
      messages: [],
      adminProfile: null,
      dashboardToday: null,
      topServices: [],
      inventoryItems: [],
      inventoryMovements: [],
      serviceMaterials: [],
      reviews: [],
      reviewRequests: []
    }
  };

  function get() { return state; }
  function set(partial) { Object.assign(state, partial); }
  function updateDataset(key, value) {
    if (['businessSettings', 'adminProfile', 'dashboardToday'].includes(key)) {
      state.datasets[key] = value || null;
      return;
    }
    state.datasets[key] = Array.isArray(value) ? value : [];
  }

  return { get, set, updateDataset };
})();
