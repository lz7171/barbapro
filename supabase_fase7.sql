-- BarbaPro - Fase 7: anti-spam, permissoes mais justas e fuso por barbearia
-- Rode DEPOIS do supabase_fase6.sql, uma unica vez.

create index if not exists appointments_created_idx on public.appointments (created_at);

-- ========== ANTI-SPAM NO AGENDAMENTO ==========
-- Limites: 3 horarios futuros por telefone na mesma barbearia, 5 tentativas por telefone por hora
-- e 40 agendamentos por barbearia a cada 10 minutos (barra inundacao com telefones diferentes).
create or replace function public.criar_agendamento(
  p_shop uuid, p_staff uuid, p_service uuid, p_nome text, p_tel text, p_inicio timestamptz
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_dur int; v_preco numeric; v_id uuid; v_nome_srv text; v_tel text;
begin
  if not shop_ativa(p_shop) then raise exception 'barbearia_indisponivel'; end if;
  if p_inicio <= now() then raise exception 'horario_passado'; end if;
  if p_inicio > now() + interval '90 days' then raise exception 'horario_distante'; end if;
  if char_length(trim(p_nome)) < 2 or char_length(regexp_replace(p_tel,'\D','','g')) < 8 then
    raise exception 'dados_invalidos'; end if;
  v_tel := regexp_replace(p_tel,'\D','','g');
  if (select count(*) from appointments where shop_id = p_shop and status = 'agendado' and starts_at > now()
        and regexp_replace(cliente_tel,'\D','','g') = v_tel) >= 3 then
    raise exception 'limite_agendamentos'; end if;
  if (select count(*) from appointments where created_at > now() - interval '1 hour'
        and regexp_replace(cliente_tel,'\D','','g') = v_tel) >= 5
     or (select count(*) from appointments where shop_id = p_shop and created_at > now() - interval '10 minutes') >= 40 then
    raise exception 'muitas_tentativas'; end if;
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

-- Pedidos de orcamento: no maximo 3 por e-mail por hora
create or replace function public.limitar_orcamento() returns trigger language plpgsql as $$
begin
  if (select count(*) from public.quotes where lower(email) = lower(new.email) and created_at > now() - interval '1 hour') >= 3 then
    raise exception 'muitas_tentativas'; end if;
  return new;
end $$;
drop trigger if exists trg_limita_orcamento on public.quotes;
create trigger trg_limita_orcamento before insert on public.quotes
  for each row execute function public.limitar_orcamento();

-- ========== PERMISSOES MAIS JUSTAS ==========
-- Avisos (que citam nomes de clientes) so para o dono; barbeiro nao ve nem altera
drop policy if exists dono_notif on public.notifications;
drop policy if exists dono_notif_upd on public.notifications;
create policy dono_notif on public.notifications for select
  using (auth_role() = 'dono' and shop_id = auth_shop());
create policy dono_notif_upd on public.notifications for update
  using (auth_role() = 'dono' and shop_id = auth_shop()) with check (auth_role() = 'dono' and shop_id = auth_shop());

-- Apagar fotos: so o dono, e so da propria pasta
drop policy if exists galeria_apagar on storage.objects;
create policy galeria_apagar on storage.objects for delete to authenticated
  using (bucket_id = 'galeria' and auth_role() = 'dono' and (storage.foldername(name))[1] = auth_shop()::text);

-- ========== FUSO POR BARBEARIA ==========
-- A tela de cancelar/remarcar passa a receber o fuso da barbearia
drop function if exists public.ver_agendamento(uuid);
create function public.ver_agendamento(p_id uuid)
returns table (shop_nome text, starts_at timestamptz, status text, cancel_horas int, staff_id uuid, dur_min int, fuso text)
language sql stable security definer set search_path = public as $$
  select s.nome, a.starts_at, a.status, s.cancel_horas, a.staff_id,
         (extract(epoch from (a.ends_at - a.starts_at)) / 60)::int, s.fuso
  from appointments a join shops s on s.id = a.shop_id where a.id = p_id $$;
grant execute on function public.ver_agendamento(uuid) to anon, authenticated;
