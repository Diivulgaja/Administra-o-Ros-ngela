-- Fluxo de avaliações com moderação manual no painel admin
-- Cliente envia -> status pending -> admin aprova -> site exibe somente approved

alter table public.service_reviews
  add column if not exists admin_reply text,
  add column if not exists replied_at timestamptz,
  add column if not exists is_featured boolean not null default false,
  add column if not exists status text not null default 'pending';

alter table public.service_reviews
  drop constraint if exists service_reviews_status_check;

alter table public.service_reviews
  add constraint service_reviews_status_check
  check (status in ('pending', 'approved', 'hidden'));

create or replace function public.create_my_service_review(
  p_appointment_id uuid,
  p_rating integer,
  p_comment text default null
)
returns public.service_reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_customer public.customers;
  v_appointment public.appointments;
  v_review public.service_reviews;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;
  if p_rating < 1 or p_rating > 5 then
    raise exception 'A nota deve estar entre 1 e 5';
  end if;

  select * into v_customer from public.customers where auth_user_id = v_user_id limit 1;
  if v_customer.id is null then
    raise exception 'Cliente não encontrado para este usuário';
  end if;

  select * into v_appointment from public.appointments where id = p_appointment_id limit 1;
  if v_appointment.id is null then
    raise exception 'Agendamento não encontrado';
  end if;
  if v_appointment.customer_user_id is distinct from v_user_id then
    raise exception 'Você não pode avaliar este atendimento';
  end if;
  if coalesce(v_appointment.attendance_status, '') not in ('completed', 'attended') then
    raise exception 'Avaliação só é liberada após atendimento concluído';
  end if;
  if coalesce(v_appointment.can_review, false) = false then
    raise exception 'Avaliação ainda não liberada';
  end if;
  if exists (select 1 from public.service_reviews where appointment_id = p_appointment_id) then
    raise exception 'Este atendimento já foi avaliado';
  end if;

  insert into public.service_reviews (
    appointment_id,
    customer_id,
    customer_user_id,
    service_id,
    rating,
    comment,
    status,
    is_featured
  )
  values (
    v_appointment.id,
    v_customer.id,
    v_user_id,
    v_appointment.service_id,
    p_rating,
    nullif(trim(p_comment), ''),
    'pending',
    false
  )
  returning * into v_review;

  update public.appointments
     set reviewed_at = now(),
         can_review = false,
         updated_at = now()
   where id = v_appointment.id;

  return v_review;
end;
$$;

grant execute on function public.create_my_service_review(uuid, integer, text) to authenticated, service_role;

drop view if exists public.public_service_reviews;
create or replace view public.public_service_reviews as
select
  sr.id,
  sr.appointment_id,
  sr.customer_id,
  coalesce(sr.public_name, c.full_name, 'Cliente') as customer_name,
  sr.public_name,
  sr.service_id,
  coalesce(s.title, a.service_title, 'Atendimento') as service_title,
  sr.rating,
  sr.comment,
  sr.admin_reply,
  sr.replied_at,
  sr.is_featured,
  sr.created_at
from public.service_reviews sr
left join public.customers c on c.id = sr.customer_id
left join public.services s on s.id = sr.service_id
left join public.appointments a on a.id = sr.appointment_id
where sr.status = 'approved';

grant select on public.public_service_reviews to anon, authenticated;
