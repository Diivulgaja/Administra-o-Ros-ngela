-- Admin panel upgrade base for RôSouza Estética
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  );
$$;

alter table public.admin_users enable row level security;
alter table public.appointments enable row level security;
alter table public.services enable row level security;
alter table public.blocked_periods enable row level security;
alter table public.blocked_slots enable row level security;
alter table public.business_hours enable row level security;
alter table public.business_settings enable row level security;
alter table public.customers enable row level security;
alter table public.professionals enable row level security;
alter table public.professional_services enable row level security;
alter table public.payments enable row level security;
alter table public.campaigns enable row level security;

-- updated_at triggers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='appointments' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_appointments ON public.appointments;
    CREATE TRIGGER set_updated_at_appointments BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='services' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_services ON public.services;
    CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='blocked_periods' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_blocked_periods ON public.blocked_periods;
    CREATE TRIGGER set_updated_at_blocked_periods BEFORE UPDATE ON public.blocked_periods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='blocked_slots' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_blocked_slots ON public.blocked_slots;
    CREATE TRIGGER set_updated_at_blocked_slots BEFORE UPDATE ON public.blocked_slots FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_hours' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_business_hours ON public.business_hours;
    CREATE TRIGGER set_updated_at_business_hours BEFORE UPDATE ON public.business_hours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='business_settings' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_business_settings ON public.business_settings;
    CREATE TRIGGER set_updated_at_business_settings BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_customers ON public.customers;
    CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='professionals' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_professionals ON public.professionals;
    CREATE TRIGGER set_updated_at_professionals BEFORE UPDATE ON public.professionals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='payments' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_payments ON public.payments;
    CREATE TRIGGER set_updated_at_payments BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='campaigns' AND column_name='updated_at') THEN
    DROP TRIGGER IF EXISTS set_updated_at_campaigns ON public.campaigns;
    CREATE TRIGGER set_updated_at_campaigns BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- policies
DROP POLICY IF EXISTS admin_users_select_self ON public.admin_users;
CREATE POLICY admin_users_select_self ON public.admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS admin_users_admin_manage ON public.admin_users;
CREATE POLICY admin_users_admin_manage ON public.admin_users FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS appointments_public_insert ON public.appointments;
CREATE POLICY appointments_public_insert ON public.appointments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS appointments_admin_select ON public.appointments;
CREATE POLICY appointments_admin_select ON public.appointments FOR SELECT TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS appointments_admin_update ON public.appointments;
CREATE POLICY appointments_admin_update ON public.appointments FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS appointments_admin_delete ON public.appointments;
CREATE POLICY appointments_admin_delete ON public.appointments FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS services_public_select_active ON public.services;
CREATE POLICY services_public_select_active ON public.services FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS services_admin_manage ON public.services;
CREATE POLICY services_admin_manage ON public.services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS business_hours_public_select ON public.business_hours;
CREATE POLICY business_hours_public_select ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS business_hours_admin_manage ON public.business_hours;
CREATE POLICY business_hours_admin_manage ON public.business_hours FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS business_settings_public_select ON public.business_settings;
CREATE POLICY business_settings_public_select ON public.business_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS business_settings_admin_manage ON public.business_settings;
CREATE POLICY business_settings_admin_manage ON public.business_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS blocked_periods_public_select ON public.blocked_periods;
CREATE POLICY blocked_periods_public_select ON public.blocked_periods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS blocked_periods_admin_manage ON public.blocked_periods;
CREATE POLICY blocked_periods_admin_manage ON public.blocked_periods FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS blocked_slots_public_select ON public.blocked_slots;
CREATE POLICY blocked_slots_public_select ON public.blocked_slots FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS blocked_slots_admin_manage ON public.blocked_slots;
CREATE POLICY blocked_slots_admin_manage ON public.blocked_slots FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS customers_admin_manage ON public.customers;
CREATE POLICY customers_admin_manage ON public.customers FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS professionals_public_select_active ON public.professionals;
CREATE POLICY professionals_public_select_active ON public.professionals FOR SELECT TO anon, authenticated USING (is_active = true OR public.is_admin());
DROP POLICY IF EXISTS professionals_admin_manage ON public.professionals;
CREATE POLICY professionals_admin_manage ON public.professionals FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS professional_services_public_select ON public.professional_services;
CREATE POLICY professional_services_public_select ON public.professional_services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS professional_services_admin_manage ON public.professional_services;
CREATE POLICY professional_services_admin_manage ON public.professional_services FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS payments_admin_manage ON public.payments;
CREATE POLICY payments_admin_manage ON public.payments FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS campaigns_admin_manage ON public.campaigns;
CREATE POLICY campaigns_admin_manage ON public.campaigns FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- seeds
insert into public.business_hours (weekday, is_open, open_time, close_time, slot_interval_minutes)
values
  (0, false, null, null, 30),
  (1, true, '09:00', '18:00', 30),
  (2, true, '09:00', '18:00', 30),
  (3, true, '09:00', '18:00', 30),
  (4, true, '09:00', '18:00', 30),
  (5, true, '09:00', '18:00', 30),
  (6, true, '09:00', '13:00', 30)
on conflict (weekday) do update
set is_open = excluded.is_open,
    open_time = excluded.open_time,
    close_time = excluded.close_time,
    slot_interval_minutes = excluded.slot_interval_minutes;

insert into public.business_settings (
  id, business_name, timezone, pending_hold_minutes, booking_window_days,
  whatsapp_number, slot_interval_minutes, opens_at, closes_at
)
values (true, 'RôSouza Estética', 'America/Sao_Paulo', 15, 20, null, 30, '09:00', '18:00')
on conflict (id) do update
set business_name = excluded.business_name,
    timezone = excluded.timezone,
    pending_hold_minutes = excluded.pending_hold_minutes,
    booking_window_days = excluded.booking_window_days,
    whatsapp_number = excluded.whatsapp_number,
    slot_interval_minutes = excluded.slot_interval_minutes,
    opens_at = excluded.opens_at,
    closes_at = excluded.closes_at;

insert into public.professionals (full_name, role, is_active)
select * from (
  values
    ('Rosângela', 'Sobrancelhas e design', true),
    ('Jéssica', 'Lamination e finalização', true),
    ('Fernanda', 'Estética facial', true)
) v(full_name, role, is_active)
where not exists (select 1 from public.professionals p where p.full_name = v.full_name);

-- migrate customers from appointments
insert into public.customers (full_name, phone, created_at, updated_at)
select distinct a.customer_name, a.customer_phone, now(), now()
from public.appointments a
where a.customer_name is not null
  and a.customer_phone is not null
  and not exists (
    select 1 from public.customers c where c.phone = a.customer_phone
  );

update public.appointments a
set customer_id = c.id
from public.customers c
where a.customer_phone = c.phone
  and a.customer_id is null;

create or replace view public.admin_appointments_view as
select
  a.id,
  a.booking_reference,
  a.booking_date,
  a.start_at,
  a.end_at,
  a.status,
  a.source,
  a.customer_name,
  a.customer_phone,
  a.customer_notes,
  a.price,
  a.quoted_price,
  a.final_price,
  a.payment_status,
  a.attendance_status,
  s.id as service_id,
  s.title as service_title,
  s.category as service_category,
  s.duration_minutes,
  s.price as service_base_price,
  c.id as customer_id,
  c.full_name as customer_full_name,
  c.phone as customer_phone_linked,
  p.id as professional_id,
  p.full_name as professional_full_name,
  p.role as professional_role
from public.appointments a
left join public.services s on s.id = a.service_id
left join public.customers c on c.id = a.customer_id
left join public.professionals p on p.id = a.professional_id;

grant select on public.admin_appointments_view to authenticated;

create or replace view public.admin_dashboard_today as
select
  current_date as reference_date,
  count(*) filter (where booking_date = current_date) as total_today,
  count(*) filter (where booking_date = current_date and status = 'confirmed') as confirmed_today,
  count(*) filter (where booking_date = current_date and status = 'pending') as pending_today,
  count(*) filter (where booking_date = current_date and status = 'cancelled') as cancelled_today,
  count(*) filter (where booking_date = current_date and status = 'expired') as expired_today,
  coalesce(sum(coalesce(final_price, price, quoted_price, 0)) filter (where booking_date = current_date and status in ('confirmed','pending')), 0) as expected_revenue_today
from public.appointments;

grant select on public.admin_dashboard_today to authenticated;

create or replace view public.admin_top_services as
select
  s.id,
  s.title,
  s.category,
  count(a.id) as total_bookings,
  coalesce(sum(coalesce(a.final_price, a.price, a.quoted_price, s.price, 0)), 0) as total_revenue
from public.services s
left join public.appointments a on a.service_id = s.id
group by s.id, s.title, s.category
order by total_bookings desc, total_revenue desc;

grant select on public.admin_top_services to authenticated;
