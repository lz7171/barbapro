-- BarbaPro - Fase 6 (rode DEPOIS do supabase_fase5.sql, uma unica vez)
create table public.horarios (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  dia_semana int not null check (dia_semana between 0 and 6),  -- 0 = domingo
  inicio time not null, fim time not null,
  int_ini time, int_fim time,                                   -- intervalo (almoco)
  unique (staff_id, dia_semana),
  check (fim > inicio),
  check ((int_ini is null and int_fim is null) or
         (int_ini is not null and int_fim > int_ini and int_ini >= inicio and int_fim <= fim))
);
create table public.folgas (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  dia date not null, unique (staff_id, dia)
);
create table public.push_subs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  shop_id uuid not null references public.shops(id),
  endpoint text not null unique, p256dh text not null, auth text not null
);
alter table public.horarios enable row level security;
alter table public.folgas enable row level security;
alter table public.push_subs enable row level security;

create policy dono_horarios on public.horarios for all
  using (auth_role() = 'dono' and shop_ativa(auth_shop()) and staff_id in (select id from public.staff where shop_id = auth_shop()))
  with check (auth_role() = 'dono' and shop_ativa(auth_shop()) and staff_id in (select id from public.staff where shop_id = auth_shop()));
create policy dono_folgas on public.folgas for all
  using (auth_role() = 'dono' and shop_ativa(auth_shop()) and staff_id in (select id from public.staff where shop_id = auth_shop()))
  with check (auth_role() = 'dono' and shop_ativa(auth_shop()) and staff_id in (select id from public.staff where shop_id = auth_shop()));
create policy pub_horarios on public.horarios for select to anon
  using (staff_id in (select id from public.staff where ativo and shop_ativa(shop_id)));
create policy pub_folgas on public.folgas for select to anon
  using (staff_id in (select id from public.staff where ativo and shop_ativa(shop_id)));
create policy own_push on public.push_subs for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and shop_id = auth_shop());

-- O BANCO impede agendar fora do horario, no intervalo ou em folga (mesmo burlando o site)
create function public.chk_horario() returns trigger language plpgsql security definer set search_path = public as $$
declare f text; d date; i time; e time; h record;
begin
  select fuso into f from shops where id = new.shop_id;
  d := (new.starts_at at time zone f)::date; i := (new.starts_at at time zone f)::time; e := (new.ends_at at time zone f)::time;
  if exists (select 1 from folgas where staff_id = new.staff_id and dia = d) then raise exception 'barbeiro_folga'; end if;
  if exists (select 1 from horarios where staff_id = new.staff_id) then
    select * into h from horarios where staff_id = new.staff_id and dia_semana = extract(dow from d)::int;
    if not found or e <= i or i < h.inicio or e > h.fim then raise exception 'fora_do_horario'; end if;
    if h.int_ini is not null and i < h.int_fim and e > h.int_ini then raise exception 'fora_do_horario'; end if;
  end if;
  return new;
end $$;
create trigger trg_horario before insert or update of starts_at on public.appointments
  for each row execute function public.chk_horario();

-- Remarcacao pelo cliente (mesmo link do cancelamento, mesmo prazo)
drop function public.ver_agendamento(uuid);
create function public.ver_agendamento(p_id uuid)
returns table (shop_nome text, starts_at timestamptz, status text, cancel_horas int, staff_id uuid, dur_min int)
language sql stable security definer set search_path = public as $$
  select s.nome, a.starts_at, a.status, s.cancel_horas, a.staff_id, (extract(epoch from (a.ends_at - a.starts_at)) / 60)::int
  from appointments a join shops s on s.id = a.shop_id where a.id = p_id $$;
grant execute on function public.ver_agendamento(uuid) to anon, authenticated;

create function public.remarcar_agendamento(p_id uuid, p_inicio timestamptz) returns void
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select ap.status, ap.starts_at, ap.ends_at, ap.cliente_nome, ap.shop_id, s.cancel_horas into a
    from appointments ap join shops s on s.id = ap.shop_id where ap.id = p_id;
  if not found then raise exception 'nao_encontrado'; end if;
  if a.status <> 'agendado' then raise exception 'ja_encerrado'; end if;
  if not shop_ativa(a.shop_id) then raise exception 'barbearia_indisponivel'; end if;
  if a.starts_at - make_interval(hours => a.cancel_horas) < now() then raise exception 'prazo_expirado'; end if;
  if p_inicio <= now() or p_inicio > now() + interval '90 days' then raise exception 'horario_passado'; end if;
  begin
    update appointments set starts_at = p_inicio, ends_at = p_inicio + (a.ends_at - a.starts_at) where id = p_id;
  exception when exclusion_violation then raise exception 'horario_ocupado';
  end;
  insert into notifications (shop_id, texto) values (a.shop_id, 'Remarcado: ' || a.cliente_nome);
end $$;
grant execute on function public.remarcar_agendamento(uuid, timestamptz) to anon, authenticated;
