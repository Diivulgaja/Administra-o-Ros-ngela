create or replace function public.submit_review_with_token(
  p_token text,
  p_rating integer,
  p_title text default null,
  p_comment text default null,
  p_public_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.review_requests;
  appt public.appointments;
  new_review_id uuid;
begin
  select * into req
  from public.review_requests
  where token = p_token
  limit 1;

  if req.id is null then
    raise exception 'Solicitação inválida.';
  end if;

  if req.used_at is not null then
    raise exception 'Este link já foi utilizado.';
  end if;

  if req.expires_at is not null and req.expires_at < now() then
    raise exception 'Este link expirou.';
  end if;

  select * into appt
  from public.appointments
  where id = req.appointment_id
  limit 1;

  if appt.id is null then
    raise exception 'Agendamento não encontrado.';
  end if;

  if appt.attendance_status <> 'attended' then
    raise exception 'A avaliação só pode ser enviada após o atendimento concluído.';
  end if;

  insert into public.reviews (
    appointment_id,
    customer_id,
    service_id,
    rating,
    title,
    comment,
    public_name,
    status,
    is_featured
  )
  values (
    req.appointment_id,
    req.customer_id,
    appt.service_id,
    p_rating,
    p_title,
    p_comment,
    coalesce(nullif(p_public_name, ''), 'Cliente'),
    'pending',
    false
  )
  returning id into new_review_id;

  update public.review_requests
  set used_at = now()
  where id = req.id;

  return new_review_id;
end;
$$;

grant execute on function public.submit_review_with_token(text, integer, text, text, text) to anon, authenticated;
