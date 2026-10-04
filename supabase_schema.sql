-- BarbaPro - Fase 1: banco de dados e seguranca (Supabase / PostgreSQL)
-- Cole tudo no SQL Editor do Supabase e clique em Run. Rode uma unica vez.

create extension if not exists btree_gist;

-- ========== TABELAS ==========
create table public.shops (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  status text not null default 'ativa' check (status in ('ativa','suspensa')),
  fuso text not null default 'America/Sao_Paulo',
  cancel_horas int not null default 2 check (cancel_horas >= 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  role text not null check (role in ('super_admin','dono','barbeiro')),
  shop_id uuid references public.shops(id),
  created_at timestamptz not null default now(),
  check (role = 'super_admin' or shop_id is not null)
);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  profile_id uuid references public.profiles(id),
  nome text not null check (char_length(nome) between 2 and 60),
  comissao_pct numeric(5,2) not null default 0 check (comissao_pct between 0 and 100),
  ativo boolean not null default true
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  nome text not null check (char_length(nome) between 2 and 60),
  preco numeric(10,2) not null check (preco >= 0),
  dur_min int not null check (dur_min between 10 and 480),
  foto_url text,
  ativo boolean not null default true
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  staff_id uuid not null references public.staff(id),
  service_id uuid not null references public.services(id),
  cliente_nome text not null check (char_length(cliente_nome) between 2 and 80),
  cliente_tel text not null check (char_length(cliente_tel) between 8 and 20),
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  preco_cobrado numeric(10,2) not null,        -- preco congelado na data
  status text not null default 'agendado'
    check (status in ('agendado','concluido','cancelado','faltou')),
  created_at timestamptz not null default now(),
  -- IMPEDE horario duplicado para o mesmo barbeiro, mesmo com cliques simultaneos
  constraint sem_conflito exclude using gist
    (staff_id with =, tstzrange(starts_at, ends_at) with &&)
    where (status = 'agendado')
);
create index on public.appointments (shop_id, starts_at);

create table public.finance (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  tipo text not null check (tipo in ('entrada','saida')),
  descricao text not null check (char_length(descricao) between 1 and 120),
  valor numeric(10,2) not null check (valor > 0),
  appointment_id uuid unique references public.appointments(id),
  created_at timestamptz not null default now()
);
create index on public.finance (shop_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id),
  texto text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (shop_id, created_at desc);

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (char_length(nome) between 2 and 80),
  barbearia text not null check (char_length(barbearia) between 2 and 80),
  cidade text check (char_length(cidade) <= 60),
  telefone text check (char_length(telefone) <= 20),
  email text not null check (email ~ '^\S+@\S+\.\S+$'),
  qtd_barbeiros int check (qtd_barbeiros between 1 and 100),
  mensagem text check (char_length(mensagem) <= 500),
  status text not null default 'novo' check (status in ('novo','em contato','fechado','perdido')),
  created_at timestamptz not null default now()
);

-- ========== FUNCOES AUXILIARES ==========
create function public.auth_role() returns text
  language sql stable security definer set search_path = public as
  $$ select role from public.profiles where id = auth.uid() $$;

create function public.auth_shop() returns uuid
  language sql stable security definer set search_path = public as
  $$ select shop_id from public.profiles where id = auth.uid() $$;

create function public.shop_ativa(p uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.shops where id = p and status = 'ativa') $$;

-- ========== RLS (isolamento entre barbearias) ==========
alter table public.shops enable row level security;
alter table public.profiles enable row level security;
alter table public.staff enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;
alter table public.finance enable row level security;
alter table public.notifications enable row level security;
alter table public.quotes enable row level security;

-- Super admin: acesso total
create policy super_shops on public.shops for all using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');
create policy super_profiles on public.profiles for all using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');
create policy super_quotes on public.quotes for all using (auth_role() = 'super_admin') with check (auth_role() = 'super_admin');
create policy super_staff on public.staff for all using (auth_role() = 'super_admin');
create policy super_services on public.services for all using (auth_role() = 'super_admin');
create policy super_appts on public.appointments for select using (auth_role() = 'super_admin');
create policy super_fin on public.finance for select using (auth_role() = 'super_admin');

-- Usuario ve a propria barbearia e o proprio perfil (nao pode editar role)
create policy own_shop on public.shops for select using (id = auth_shop());
create policy own_profile on public.profiles for select using (id = auth.uid());

-- Dono: gerencia somente a propria barbearia, e somente se estiver ativa
create policy dono_staff on public.staff for all
  using (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id))
  with check (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id));
create policy dono_services on public.services for all
  using (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id))
  with check (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id));
create policy dono_appts on public.appointments for all
  using (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id))
  with check (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id));
create policy dono_fin on public.finance for all
  using (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id))
  with check (auth_role() = 'dono' and shop_id = auth_shop() and shop_ativa(shop_id));
create policy dono_notif on public.notifications for select
  using (shop_id = auth_shop());
create policy dono_notif_upd on public.notifications for update
  using (shop_id = auth_shop()) with check (shop_id = auth_shop());

-- Barbeiro: ve so a propria agenda
create policy barb_appts on public.appointments for select
  using (auth_role() = 'barbeiro' and staff_id in (select id from public.staff where profile_id = auth.uid()));
create policy barb_staff on public.staff for select using (shop_id = auth_shop());
create policy barb_services on public.services for select using (shop_id = auth_shop());

-- Publico (visitante): ve equipe e servicos ATIVOS de barbearias ativas; envia orcamento
create policy pub_staff on public.staff for select to anon using (ativo and shop_ativa(shop_id));
create policy pub_services on public.services for select to anon using (ativo and shop_ativa(shop_id));
create policy pub_shops on public.shops for select to anon using (status = 'ativa');
create policy pub_quote_insert on public.quotes for insert to anon, authenticated with check (status = 'novo');

-- ========== FUNCOES PUBLICAS (agendamento sem login) ==========
-- Horarios ocupados de um barbeiro (nao expoe nome nem telefone de ninguem)
create function public.horarios_ocupados(p_staff uuid, p_de timestamptz, p_ate timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at from appointments a
  join staff s on s.id = a.staff_id
  where a.staff_id = p_staff and a.status = 'agendado'
    and a.starts_at < p_ate and a.ends_at > p_de and shop_ativa(s.shop_id)
$$;

create function public.criar_agendamento(
  p_shop uuid, p_staff uuid, p_service uuid, p_nome text, p_tel text, p_inicio timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_dur int; v_preco numeric; v_id uuid; v_nome_srv text;
begin
  if not shop_ativa(p_shop) then raise exception 'barbearia_indisponivel'; end if;
  if p_inicio <= now() then raise exception 'horario_passado'; end if;
  if p_inicio > now() + interval '90 days' then raise exception 'horario_distante'; end if;
  if char_length(trim(p_nome)) < 2 or char_length(regexp_replace(p_tel,'\D','','g')) < 8 then
    raise exception 'dados_invalidos'; end if;
  if not exists (select 1 from staff where id = p_staff and shop_id = p_shop and ativo) then
    raise exception 'barbeiro_invalido'; end if;
  select dur_min, preco, nome into v_dur, v_preco, v_nome_srv from services
    where id = p_service and shop_id = p_shop and ativo;
  if v_dur is null then raise exception 'servico_invalido'; end if;
  begin
    insert into appointments (shop_id, staff_id, service_id, cliente_nome, cliente_tel,
      starts_at, ends_at, preco_cobrado)
    values (p_shop, p_staff, p_service, trim(p_nome), trim(p_tel), p_inicio,
      p_inicio + make_interval(mins => v_dur), v_preco) returning id into v_id;
  exception when exclusion_violation then
    raise exception 'horario_ocupado';
  end;
  insert into notifications (shop_id, texto)
    values (p_shop, 'Novo agendamento: ' || trim(p_nome) || ' - ' || v_nome_srv);
  return v_id;
end $$;

grant execute on function public.horarios_ocupados(uuid,timestamptz,timestamptz) to anon, authenticated;
grant execute on function public.criar_agendamento(uuid,uuid,uuid,text,text,timestamptz) to anon, authenticated;

-- ========== AUTOMACOES ==========
-- Atendimento concluido gera entrada no caixa com o preco congelado (uma vez so)
create function public.lancar_entrada() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'concluido' and old.status = 'agendado' then
    insert into finance (shop_id, tipo, descricao, valor, appointment_id)
    values (new.shop_id, 'entrada', 'Atendimento: ' || new.cliente_nome, new.preco_cobrado, new.id)
    on conflict (appointment_id) do nothing;
  end if;
  return new;
end $$;
create trigger trg_entrada after update of status on public.appointments
  for each row execute function public.lancar_entrada();

-- Avisa o dono quando um agendamento e cancelado
create function public.avisar_cancelamento() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'cancelado' and old.status = 'agendado' then
    insert into notifications (shop_id, texto) values (new.shop_id, 'Cancelado: ' || new.cliente_nome);
  end if;
  return new;
end $$;
create trigger trg_cancel after update of status on public.appointments
  for each row execute function public.avisar_cancelamento();

-- ========== TEMPO REAL e FOTOS ==========
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.appointments;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('galeria','galeria', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy galeria_leitura on storage.objects for select using (bucket_id = 'galeria');
create policy galeria_envio on storage.objects for insert to authenticated
  with check (bucket_id = 'galeria' and auth_role() = 'dono'
              and (storage.foldername(name))[1] = auth_shop()::text);
create policy galeria_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'galeria' and (storage.foldername(name))[1] = auth_shop()::text);

-- ========== SEU PRIMEIRO ACESSO (SUPER ADMIN) ==========
-- 1) Authentication > Users > Add user (seu e-mail e senha forte)
-- 2) Troque o e-mail abaixo e rode:
-- insert into public.profiles (id, nome, role)
--   select id, 'Super Admin', 'super_admin' from auth.users where email = 'SEU@EMAIL.COM';
