'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../lib/supabase';
import { hm, hoje, R, setFuso, inicioDia, fimDia, stLabel } from '../../lib/util';
export default function Barbeiro() {
  const r = useRouter(); const [me, setMe] = useState(null); const [day, setDay] = useState(hoje()); const [ap, setAp] = useState([]); const [sv, setSv] = useState([]); const [mes, setMes] = useState([]);
  useEffect(() => { (async () => {
    const s = sb(); const { data } = await s.auth.getSession(); if (!data.session) return r.replace('/login');
    const { data: p } = await s.from('profiles').select('role').eq('id', data.session.user.id).single();
    if (!p || p.role !== 'barbeiro') return r.replace('/login');
    const { data: st } = await s.from('staff').select('*').eq('profile_id', data.session.user.id).maybeSingle();
    if (!st) return r.replace('/login'); const { data: sh } = await s.from('shops').select('fuso').eq('id', st.shop_id).maybeSingle(); if (sh) { setFuso(sh.fuso); setDay(hoje()); } setMe(st); })(); }, [r]);
  const load = useCallback(async () => { if (!me) return; const s = sb();
    const [a, b, c] = await Promise.all([
      s.from('appointments').select('*').eq('staff_id', me.id).gte('starts_at', inicioDia(day)).lte('starts_at', fimDia(day)).order('starts_at'),
      s.from('services').select('id,nome'),
      s.from('appointments').select('preco_cobrado').eq('staff_id', me.id).eq('status', 'concluido').gte('starts_at', inicioDia(hoje().slice(0, 8) + '01'))]);
    setAp(a.data || []); setSv(b.data || []); setMes(c.data || []); }, [me, day]);
  useEffect(() => { load(); }, [load]);
  if (!me) return <p>Carregando...</p>;
  const tot = mes.reduce((t, x) => t + Number(x.preco_cobrado), 0);
  return (<div><h2>Olá, {me.nome}</h2>
    <div className="stats"><div className="stat"><small>Atendimentos no mês</small><b>{mes.length}</b></div><div className="stat"><small>Faturado</small><b>{R(tot)}</b></div><div className="stat"><small>Minha comissão ({me.comissao_pct}%)</small><b className="ok">{R(tot * Number(me.comissao_pct) / 100)}</b></div></div>
    <input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
    {ap.map((a) => (<div className="card" key={a.id}><b>{hm(a.starts_at)}</b> {a.cliente_nome} - {sv.find((x) => x.id === a.service_id)?.nome} <span className={'tag ' + a.status}>{stLabel[a.status]}</span><br /><small>{a.cliente_tel}</small></div>))}
    {!ap.length && <p><small>Nenhum agendamento neste dia.</small></p>}
    <button className="g" onClick={async () => { await sb().auth.signOut(); r.replace('/'); }}>Sair</button></div>);
}
