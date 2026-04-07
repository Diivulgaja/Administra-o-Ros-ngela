window.AdminSupabase = (() => {
  let client = null;
  const STORAGE_KEY = 'rs-admin-auth';

  function hasConfig() {
    const config = window.APP_CONFIG || {};
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !String(config.supabaseUrl).includes('COLE_AQUI') &&
      !String(config.supabaseAnonKey).includes('COLE_AQUI')
    );
  }

  function getClient() {
    if (client) return client;
    if (!hasConfig() || !window.supabase?.createClient) return null;

    client = window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: STORAGE_KEY
        }
      }
    );

    return client;
  }

  function isUuid(value) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
  }

  function randomToken() {
    const raw = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    return String(raw).replace(/-/g, '');
  }

  function publicReviewLink() { return null; }

  function mapService(row) {
    return {
      id: row.id,
      title: row.title,
      name: row.title,
      category: row.category,
      description: row.description || '',
      duration_minutes: Number(row.duration_minutes || 0),
      duration: Number(row.duration_minutes || 0),
      price: Number(row.price || 0),
      is_active: Boolean(row.is_active),
      sort_order: Number(row.sort_order || 0),
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function mapCustomer(row, appointments = []) {
    const history = appointments
      .filter((item) => item.customer_id === row.id || item.customer_phone === row.phone)
      .sort((a, b) => String(b.start_at || '').localeCompare(String(a.start_at || '')));
    return {
      id: row.id,
      full_name: row.full_name,
      name: row.full_name,
      phone: row.phone,
      email: row.email || '',
      notes: row.notes || '',
      birth_date: row.birth_date || null,
      is_active: Boolean(row.is_active),
      visits_count: history.length,
      visits: history.length,
      last_visit_at: history.length ? history[0].start_at : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  function mapProfessional(row, appointments = []) {
    const future = appointments.filter((item) => item.professional_id === row.id);
    const statusLabel = row.is_active ? (future.length ? `${future.length} agenda(s)` : 'Disponível') : 'Inativo';
    return {
      id: row.id,
      full_name: row.full_name,
      name: row.full_name,
      role: row.role || '',
      specialty: row.role || '',
      phone: row.phone || '',
      email: row.email || '',
      bio: row.bio || '',
      is_active: Boolean(row.is_active),
      status_label: statusLabel
    };
  }

  function mapAppointmentRow(row) {
    return {
      id: row.id,
      booking_reference: row.booking_reference,
      customer_id: row.customer_id || null,
      professional_id: row.professional_id || null,
      customer_name: row.customer_full_name || row.customer_name,
      customer_phone: row.customer_phone_linked || row.customer_phone,
      customer_notes: row.customer_notes,
      status: row.status,
      attendance_status: (row.attendance_status === 'attended' ? 'completed' : (row.attendance_status || 'scheduled')),
      can_review: row.can_review === true,
      reviewed_at: row.reviewed_at || null,
      payment_status: row.payment_status || 'pending',
      source: row.source,
      date: row.booking_date || (row.start_at ? String(row.start_at).slice(0, 10) : ''),
      time: row.start_at ? AdminUtils.timeLabel(row.start_at) : (row.slot_time || '-'),
      start_at: row.start_at,
      end_at: row.end_at,
      service_id: row.service_id,
      service_name: row.service_title || `Serviço #${row.service_id ?? '-'}`,
      service_category: row.service_category || '',
      professional_name: row.professional_full_name || '-',
      professional_role: row.professional_role || '',
      channel: row.source || '-',
      amount: Number(row.final_price || row.price || row.quoted_price || row.service_base_price || 0),
      price: Number(row.final_price || row.price || row.quoted_price || row.service_base_price || 0)
    };
  }

  function mapInventoryItem(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category || '',
      sku: row.sku || '',
      unit: row.unit || 'un',
      quantity_in_stock: Number(row.quantity_in_stock || 0),
      minimum_stock: Number(row.minimum_stock || 0),
      cost_price: row.cost_price == null ? null : Number(row.cost_price),
      sale_price: row.sale_price == null ? null : Number(row.sale_price),
      is_active: Boolean(row.is_active),
      notes: row.notes || ''
    };
  }

  function mapReview(row) {
    return {
      id: row.id,
      appointment_id: row.appointment_id,
      customer_id: row.customer_id,
      service_id: row.service_id,
      rating: Number(row.rating || 0),
      title: row.title || '',
      comment: row.comment || '',
      status: row.status || 'pending',
      is_featured: Boolean(row.is_featured),
      public_name: row.public_name || row.customer_name || row.customers?.full_name || 'Cliente',
      admin_reply: row.admin_reply || row.reply || '',
      replied_at: row.replied_at || null,
      created_at: row.created_at,
      customer_name: row.customer_name || row.customers?.full_name || row.public_name || 'Cliente',
      service_title: row.service_title || row.services?.title || ''
    };
  }

  async function safeSelect(table, queryBuilder) {
    const supabase = getClient();
    if (!supabase) {
      return { data: null, error: new Error('Cliente Supabase indisponível.') };
    }
    if (!table) {
      return { data: null, error: new Error('Tabela não configurada.') };
    }

    try {
      const base = supabase.from(table);
      return await queryBuilder(base);
    } catch (error) {
      return { data: null, error };
    }
  }

  async function getCurrentSessionUserId() {
    const supabase = getClient();
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) return null;
      return data?.session?.user?.id || null;
    } catch (_error) {
      return null;
    }
  }

  async function loadReviewsIntoDatasets(datasets, result) {
    let response = await safeSelect(
      ADMIN_CONFIG.tables.reviews,
      (q) => q.select('id, appointment_id, customer_id, service_id, rating, title, comment, status, created_at, admin_reply, replied_at, is_featured, public_name, customers(full_name), services(title)').order('created_at', { ascending: false })
    );

    if (response.error) {
      result.errors.push(`service_reviews(join): ${response.error.message}`);
      response = await safeSelect(
        ADMIN_CONFIG.tables.reviews,
        (q) => q.select('*').order('created_at', { ascending: false })
      );
    }

    if (!response.error) {
      datasets.reviews = (response.data || []).map((row) => {
        const mapped = mapReview(row);
        const appt = (datasets.appointments || []).find((item) => String(item.id) === String(mapped.appointment_id));
        return {
          ...mapped,
          customer_name: mapped.customer_name || appt?.customer_name || 'Cliente',
          service_title: mapped.service_title || appt?.service_name || ''
        };
      });
      return true;
    }

    result.errors.push(`service_reviews: ${response.error.message}`);

    const legacy = await safeSelect('reviews', (q) => q.select('*').order('created_at', { ascending: false }));
    if (!legacy.error) {
      datasets.reviews = (legacy.data || []).map((row) => {
        const appt = (datasets.appointments || []).find((item) => String(item.id) === String(row.appointment_id));
        return {
          id: row.id,
          appointment_id: row.appointment_id,
          customer_id: row.customer_id,
          service_id: row.service_id,
          rating: Number(row.rating || 0),
          title: row.title || '',
          comment: row.comment || '',
          status: row.status || 'pending',
          is_featured: Boolean(row.is_featured),
          public_name: row.public_name || appt?.customer_name || 'Cliente',
          admin_reply: row.admin_reply || '',
          replied_at: row.replied_at || null,
          created_at: row.created_at,
          customer_name: row.public_name || appt?.customer_name || 'Cliente',
          service_title: appt?.service_name || ''
        };
      });
      return true;
    }

    result.errors.push(`reviews: ${legacy.error.message}`);
    return false;
  }

  async function loadDatasets() {
    const mock = window.ADMIN_MOCK_DATA;
    if (!hasConfig()) {
      return { source: 'mock', datasets: { ...mock }, errors: [] };
    }
    const supabase = getClient();
    if (!supabase) {
      return { source: 'mock', datasets: { ...mock }, errors: ['Cliente Supabase indisponível.'] };
    }

    const datasets = {
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
      reviews: []
    };
    const result = { source: 'supabase', datasets, errors: [] };
    let successCount = 0;

    const servicesRes = await safeSelect(ADMIN_CONFIG.tables.services, (q) => q.select('*').order('sort_order', { ascending: true }).order('id', { ascending: true }));
    if (servicesRes.error) result.errors.push(`services: ${servicesRes.error.message}`);
    else { datasets.services = (servicesRes.data || []).map(mapService); successCount += 1; }

    const appointmentsViewRes = await safeSelect(ADMIN_CONFIG.tables.appointmentsView, (q) => q.select('*').order('start_at', { ascending: true }));
    if (appointmentsViewRes.error) {
      result.errors.push(`admin_appointments_view: ${appointmentsViewRes.error.message}`);
      const fallbackRes = await safeSelect(ADMIN_CONFIG.tables.appointments, (q) => q.select('*').order('start_at', { ascending: true }));
      if (fallbackRes.error) result.errors.push(`appointments: ${fallbackRes.error.message}`);
      else { datasets.appointments = (fallbackRes.data || []).map(mapAppointmentRow); successCount += 1; }
    } else {
      datasets.appointments = (appointmentsViewRes.data || []).map(mapAppointmentRow);
      successCount += 1;
    }

    const customersRes = await safeSelect(ADMIN_CONFIG.tables.customers, (q) => q.select('*').order('created_at', { ascending: false }));
    if (customersRes.error) result.errors.push(`customers: ${customersRes.error.message}`);
    else { datasets.customers = (customersRes.data || []).map((row) => mapCustomer(row, datasets.appointments)); successCount += 1; }

    const professionalsRes = await safeSelect(ADMIN_CONFIG.tables.professionals, (q) => q.select('*').order('full_name', { ascending: true }));
    if (professionalsRes.error) result.errors.push(`professionals: ${professionalsRes.error.message}`);
    else { datasets.professionals = (professionalsRes.data || []).map((row) => mapProfessional(row, datasets.appointments)); successCount += 1; }

    const businessSettingsRes = await safeSelect(ADMIN_CONFIG.tables.businessSettings, (q) => q.select('*').limit(1).maybeSingle());
    if (!businessSettingsRes.error && businessSettingsRes.data) { datasets.businessSettings = businessSettingsRes.data; successCount += 1; }
    else if (businessSettingsRes.error) result.errors.push(`business_settings: ${businessSettingsRes.error.message}`);

    const businessHoursRes = await safeSelect(ADMIN_CONFIG.tables.businessHours, (q) => q.select('*').order('weekday', { ascending: true }));
    if (!businessHoursRes.error) { datasets.businessHours = businessHoursRes.data || []; successCount += 1; }
    else result.errors.push(`business_hours: ${businessHoursRes.error.message}`);

    const blockedSlotsRes = await safeSelect(ADMIN_CONFIG.tables.blockedSlots, (q) => q.select('*').order('start_at', { ascending: true }));
    if (!blockedSlotsRes.error) { datasets.blockedSlots = blockedSlotsRes.data || []; successCount += 1; }
    else result.errors.push(`blocked_slots: ${blockedSlotsRes.error.message}`);

    const blockedPeriodsRes = await safeSelect(ADMIN_CONFIG.tables.blockedPeriods, (q) => q.select('*').order('starts_at', { ascending: true }));
    if (!blockedPeriodsRes.error) { datasets.blockedPeriods = blockedPeriodsRes.data || []; successCount += 1; }
    else result.errors.push(`blocked_periods: ${blockedPeriodsRes.error.message}`);

    const paymentsRes = await safeSelect(ADMIN_CONFIG.tables.payments, (q) => q.select('*').order('created_at', { ascending: false }));
    if (!paymentsRes.error) { datasets.payments = paymentsRes.data || []; successCount += 1; }
    else result.errors.push(`payments: ${paymentsRes.error.message}`);

    const campaignsRes = await safeSelect(ADMIN_CONFIG.tables.campaigns, (q) => q.select('*').order('created_at', { ascending: false }));
    if (!campaignsRes.error) { datasets.campaigns = campaignsRes.data || []; successCount += 1; }

    const inventoryItemsRes = await safeSelect(ADMIN_CONFIG.tables.inventoryItems, (q) => q.select('*').order('name', { ascending: true }));
    if (!inventoryItemsRes.error) { datasets.inventoryItems = (inventoryItemsRes.data || []).map(mapInventoryItem); successCount += 1; }
    else result.errors.push(`inventory_items: ${inventoryItemsRes.error.message}`);

    const inventoryMovementsRes = await safeSelect(ADMIN_CONFIG.tables.inventoryMovements, (q) => q.select('*').order('created_at', { ascending: false }));
    if (!inventoryMovementsRes.error) { datasets.inventoryMovements = inventoryMovementsRes.data || []; successCount += 1; }
    else result.errors.push(`inventory_movements: ${inventoryMovementsRes.error.message}`);

    const serviceMaterialsRes = await safeSelect(ADMIN_CONFIG.tables.serviceMaterials, (q) => q.select('*'));
    if (!serviceMaterialsRes.error) { datasets.serviceMaterials = serviceMaterialsRes.data || []; successCount += 1; }
    else result.errors.push(`service_materials: ${serviceMaterialsRes.error.message}`);

    const reviewsLoaded = await loadReviewsIntoDatasets(datasets, result);
    if (reviewsLoaded) successCount += 1;

    const dashboardRes = await safeSelect(ADMIN_CONFIG.tables.dashboardToday, (q) => q.select('*').limit(1).maybeSingle());
    if (!dashboardRes.error && dashboardRes.data) { datasets.dashboardToday = dashboardRes.data; successCount += 1; }

    const topRes = await safeSelect(ADMIN_CONFIG.tables.topServices, (q) => q.select('*').limit(8));
    if (!topRes.error) { datasets.topServices = topRes.data || []; successCount += 1; }

    const profServRes = await safeSelect(ADMIN_CONFIG.tables.professionalServices, (q) => q.select('*'));
    if (!profServRes.error) { datasets.professionalServices = profServRes.data || []; successCount += 1; }

    const currentUserId = await getCurrentSessionUserId();
    if (currentUserId) {
      const adminRes = await supabase.from('admin_users').select('full_name, role, is_active').eq('user_id', currentUserId).maybeSingle();
      if (!adminRes.error && adminRes.data) { datasets.adminProfile = adminRes.data; successCount += 1; }
      else if (adminRes.error) result.errors.push(`admin_users: ${adminRes.error.message}`);
    }

    return { source: successCount > 0 ? 'supabase' : 'supabase', datasets, errors: result.errors };
  }

  async function updateAppointment(id, patch) {
    const supabase = getClient();
    if (!isUuid(id)) {
      throw new Error('Este item ainda não é um agendamento real do banco. Recarregue os dados e confirme se a agenda está conectada ao Supabase.');
    }
    const { error } = await supabase.from(ADMIN_CONFIG.tables.appointments).update(patch).eq('id', id);
    if (error) throw error;
  }

  async function concludeAppointment(id) {
    const supabase = getClient();
    if (!isUuid(id)) {
      throw new Error('Este item ainda não é um agendamento real do banco.');
    }

    const timestamp = new Date().toISOString();
    const direct = await supabase
      .from(ADMIN_CONFIG.tables.appointments)
      .update({
        attendance_status: 'completed',
        can_review: false,
        reviewed_at: null,
        status: 'confirmed',
        confirmed_at: timestamp
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!direct.error) return direct.data;

    const rpc = await supabase.rpc('complete_appointment_without_releasing_review', { p_appointment_id: id });
    if (!rpc.error) return rpc.data;

    throw direct.error || rpc.error;
  }

  async function releaseAppointmentReview(id) {
    const supabase = getClient();
    if (!isUuid(id)) {
      throw new Error('Este item ainda não é um agendamento real do banco.');
    }

    const timestamp = new Date().toISOString();
    const direct = await supabase
      .from(ADMIN_CONFIG.tables.appointments)
      .update({
        attendance_status: 'completed',
        can_review: true,
        reviewed_at: null,
        status: 'confirmed',
        confirmed_at: timestamp
      })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (!direct.error) return direct.data;

    const rpc = await supabase.rpc('release_appointment_review', { p_appointment_id: id });
    if (!rpc.error) return rpc.data;

    throw direct.error || rpc.error;
  }

  async function savePayment(payload) {
    const supabase = getClient();
    const clean = {
      appointment_id: payload.appointment_id,
      amount: Number(payload.amount || 0),
      payment_method: payload.payment_method || null,
      payment_status: payload.payment_status || 'paid',
      paid_at: payload.paid_at || new Date().toISOString(),
      notes: payload.notes || null
    };
    const { error } = await supabase.from(ADMIN_CONFIG.tables.payments).insert(clean);
    if (error) throw error;
    const apptPatch = { payment_status: clean.payment_status };
    if (clean.amount > 0) apptPatch.final_price = clean.amount;
    const { error: apptError } = await supabase.from(ADMIN_CONFIG.tables.appointments).update(apptPatch).eq('id', clean.appointment_id);
    if (apptError) throw apptError;
  }

  async function saveService(payload) {
    const supabase = getClient();
    if (payload.id) {
      const { error } = await supabase.from(ADMIN_CONFIG.tables.services).update(payload).eq('id', payload.id);
      if (error) throw error;
      return;
    }
    const insertPayload = { ...payload };
    delete insertPayload.id;
    const { error } = await supabase.from(ADMIN_CONFIG.tables.services).insert(insertPayload);
    if (error) throw error;
  }

  async function deleteService(id) {
    const supabase = getClient();
    const { error } = await supabase.from(ADMIN_CONFIG.tables.services).delete().eq('id', id);
    if (error) throw error;
  }

  async function saveProfessional(payload) {
    const supabase = getClient();
    if (payload.id) {
      const { error } = await supabase.from(ADMIN_CONFIG.tables.professionals).update(payload).eq('id', payload.id);
      if (error) throw error;
      return;
    }
    const insertPayload = { ...payload };
    delete insertPayload.id;
    const { error } = await supabase.from(ADMIN_CONFIG.tables.professionals).insert(insertPayload);
    if (error) throw error;
  }

  async function deleteProfessional(id) {
    const supabase = getClient();
    const { error } = await supabase.from(ADMIN_CONFIG.tables.professionals).delete().eq('id', id);
    if (error) throw error;
  }

  async function saveCustomer(payload) {
    const supabase = getClient();
    if (payload.id) {
      const { error } = await supabase.from(ADMIN_CONFIG.tables.customers).update(payload).eq('id', payload.id);
      if (error) throw error;
      return;
    }
    const insertPayload = { ...payload };
    delete insertPayload.id;
    const { error } = await supabase.from(ADMIN_CONFIG.tables.customers).insert(insertPayload);
    if (error) throw error;
  }

  async function saveBusinessSettings(payload) {
    const supabase = getClient();
    const { error } = await supabase.from(ADMIN_CONFIG.tables.businessSettings).upsert({ id: true, ...payload });
    if (error) throw error;
  }

  async function saveBusinessHours(payloads) {
    const supabase = getClient();
    const { error } = await supabase.from(ADMIN_CONFIG.tables.businessHours).upsert(payloads, { onConflict: 'weekday' });
    if (error) throw error;
  }

  async function saveInventoryItem(payload) {
    const supabase = getClient();
    if (payload.id) {
      const { error } = await supabase.from(ADMIN_CONFIG.tables.inventoryItems).update(payload).eq('id', payload.id);
      if (error) throw error;
      return;
    }
    const clean = { ...payload };
    delete clean.id;
    const { error } = await supabase.from(ADMIN_CONFIG.tables.inventoryItems).insert(clean);
    if (error) throw error;
  }

  async function saveInventoryMovement(payload) {
    const supabase = getClient();
    const { data: item, error: itemError } = await supabase.from(ADMIN_CONFIG.tables.inventoryItems).select('id, quantity_in_stock').eq('id', payload.item_id).single();
    if (itemError) throw itemError;
    let nextQty = Number(item.quantity_in_stock || 0);
    const qty = Number(payload.quantity || 0);
    if (['out', 'usage'].includes(payload.movement_type)) nextQty -= qty;
    else nextQty += qty;
    if (nextQty < 0) throw new Error('Estoque insuficiente para essa saída.');
    const { error: movementError } = await supabase.from(ADMIN_CONFIG.tables.inventoryMovements).insert({
      item_id: payload.item_id,
      movement_type: payload.movement_type,
      quantity: qty,
      reason: payload.reason || null,
      appointment_id: payload.appointment_id || null,
      service_id: payload.service_id || null
    });
    if (movementError) throw movementError;
    const { error: updateError } = await supabase.from(ADMIN_CONFIG.tables.inventoryItems).update({ quantity_in_stock: nextQty }).eq('id', payload.item_id);
    if (updateError) throw updateError;
  }

  async function saveReviewModeration(id, patch) {
    const supabase = getClient();
    const candidates = [ADMIN_CONFIG.tables.reviews, 'reviews'].filter(Boolean);
    let lastError = null;
    const seen = new Set();

    for (const table of candidates) {
      if (seen.has(table)) continue;
      seen.add(table);

      const { error } = await supabase.from(table).update(patch).eq('id', id);
      if (!error) return;
      lastError = error;
    }

    throw lastError || new Error('Não foi possível atualizar a avaliação.');
  }

  async function ensureReviewRequest() { throw new Error('Fluxo de link desativado. Use a liberação da avaliação no perfil da cliente.'); }

  async function markReviewRequestSent() { return null; }

  return {
    hasConfig,
    getClient,
    isUuid,
    loadDatasets,
    updateAppointment,
    concludeAppointment,
    releaseAppointmentReview,
    savePayment,
    saveService,
    deleteService,
    saveProfessional,
    deleteProfessional,
    saveCustomer,
    saveBusinessSettings,
    saveBusinessHours,
    saveInventoryItem,
    saveInventoryMovement,
    saveReviewModeration
  };
})();
