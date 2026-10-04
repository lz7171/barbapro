-- BarbaPro - Fase 5 (rode DEPOIS do supabase_schema.sql, uma unica vez)
alter table public.shops add column pago_ate date;       -- vazio = sem cobranca
alter table public.shops add column valor_mensal numeric(10,2);

-- Barbearia vencida ha mais de 3 dias perde acesso automaticamente (dados preservados)
create or replace function public.shop_ativa(p uuid) returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from public.shops where id = p and status = 'ativa'
       and (pago_ate is null or pago_ate + 3 >= current_date)) $$;

drop policy pub_shops on public.shops;
create policy pub_shops on public.shops for select to anon using (public.shop_ativa(id));

-- Cancelamento pelo cliente: o link usa o id do agendamento (uuid secreto, nao listavel)
create function public.ver_agendamento(p_id uuid)
returns table (shop_nome text, starts_at timestamptz, status text, cancel_horas int)
language sql stable security definer set search_path = public as $$
  select s.nome, a.starts_at, a.status, s.cancel_horas
  from appointments a join shops s on s.id = a.shop_id where a.id = p_id $$;

create function public.cancelar_agendamento(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select ap.status, ap.starts_at, s.cancel_horas into a
    from appointments ap join shops s on s.id = ap.shop_id where ap.id = p_id;
  if not found then raise exception 'nao_encontrado'; end if;
  if a.status <> 'agendado' then raise exception 'ja_encerrado'; end if;
  if a.starts_at - make_interval(hours => a.cancel_horas) < now() then raise exception 'prazo_expirado'; end if;
  update appointments set status = 'cancelado' where id = p_id;
end $$;
grant execute on function public.ver_agendamento(uuid) to anon, authenticated;
grant execute on function public.cancelar_agendamento(uuid) to anon, authenticated;
