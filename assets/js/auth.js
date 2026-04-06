window.AdminAuth = (() => {
  const SESSION_WAIT_MS = 1200;

  function getSupabase() {
    return window.AdminSupabase.getClient();
  }

  async function getAdminProfile(userId) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, full_name, role, is_active, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function getSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function waitForSession(timeoutMs = SESSION_WAIT_MS) {
    const supabase = getSupabase();
    if (!supabase) return null;

    const immediate = await getSession();
    if (immediate?.user) return immediate;

    return new Promise((resolve) => {
      let settled = false;
      const timeout = setTimeout(async () => {
        if (settled) return;
        settled = true;
        subscription?.subscription?.unsubscribe?.();
        resolve(await getSession().catch(() => null));
      }, timeoutMs);

      const subscription = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (settled) return;
        if (session?.user) {
          settled = true;
          clearTimeout(timeout);
          subscription?.subscription?.unsubscribe?.();
          resolve(session);
        }
      });
    });
  }

  async function signIn(email, password) {
    const supabase = getSupabase();
    if (!supabase) throw new Error('Supabase não configurado.');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data?.user;
    if (!user) throw new Error('Usuário não encontrado.');

    const admin = await getAdminProfile(user.id);
    if (!admin || !admin.is_active) {
      await supabase.auth.signOut();
      throw new Error('Acesso negado. Este usuário não é um administrador ativo.');
    }

    return { user, admin };
  }

  async function requireAdmin() {
    const session = await waitForSession();
    if (!session?.user) throw new Error('Sessão não encontrada.');

    const admin = await getAdminProfile(session.user.id);
    if (!admin || !admin.is_active) {
      throw new Error('Usuário sem permissão administrativa.');
    }

    return { user: session.user, admin };
  }

  async function signOut() {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return {
    signIn,
    signOut,
    getSession,
    waitForSession,
    requireAdmin,
    getAdminProfile
  };
})();
