-- Limpa políticas duplicadas que causavam 403 e comportamento inconsistente

drop policy if exists "TEMP appointments authenticated read" on public.appointments;
drop policy if exists "appointments admin delete" on public.appointments;
drop policy if exists "appointments admin insert" on public.appointments;
drop policy if exists "appointments admin read" on public.appointments;
drop policy if exists "appointments admin update" on public.appointments;
drop policy if exists "appointments_admin_delete" on public.appointments;
drop policy if exists "appointments_admin_select" on public.appointments;
drop policy if exists "appointments_admin_update" on public.appointments;
drop policy if exists "appointments_public_insert" on public.appointments;

alter table public.appointments enable row level security;

create policy "appointments_public_insert"
on public.appointments
for insert
to anon, authenticated
with check (true);

create policy "appointments_admin_select"
on public.appointments
for select
to authenticated
using (public.is_admin());

create policy "appointments_admin_update"
on public.appointments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "appointments_admin_delete"
on public.appointments
for delete
to authenticated
using (public.is_admin());


drop policy if exists "admin_users self_admin_read" on public.admin_users;
drop policy if exists "admin_users_admin_manage" on public.admin_users;
drop policy if exists "admin_users_select_self" on public.admin_users;

alter table public.admin_users enable row level security;

create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

create policy "admin_users_admin_manage"
on public.admin_users
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
