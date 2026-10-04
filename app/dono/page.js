'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../lib/supabase';
import { hm, hoje, R } from '../../lib/util';
import Financeiro from './Financeiro';
import AcessoBarbeiro from './AcessoBarbeiro';
import Horarios from './Horarios';
import PushBtn from './PushBtn';
export default function Dono() {
  const r = useRouter(); const [shop, setShop] = useState(null); const [tab, setTab] = useState('agenda'); const [day, setDay] = useState(hoje());
  const [ap, setAp] = useState([]); const [st, setSt] = useState([]); const [sv, setSv] = useState([]); const [nt, setNt] = useState([]); const [msg, setMsg] = useState('');
  const [bn, setBn] = useState(''); const [bc, setBc] = useState('0'); const [v, setV] = useState({ nome: '', preco: '', dur: '30' }); const [file, setFile] = useState(null); const [fk, setFk] = useState(0);
  const load = useCallback(async () => {
    if (!shop) return; const s = sb();
    const [a, c, d, n] = await Promise.all([
      s.from('appointments').select('*').gte('starts_at', `${day}T00:00:00-03:00`).lte('starts_at', `${day}T23:59:59-03:00`).order('starts_at'),
      s.from('staff').select('*').order('nome'), s.from('services').select('*').order('nome'),
      s.from('notifications').select('*').order('created_at', { ascending: false }).limit(50)]);
    setAp(a.data || []); setSt(c.data || []); setSv(d.data || []); setNt(n.data || []); }, [shop, day]);
  useEffect(() => { (async () => {
    const s = sb(); const { data } = await s.auth.getSession(); if (!data.session) return r.replace('/login');
    const { data: p } = await s.from('profiles').select('shop_id,role').eq('id', data.session.user.id).single();
    if (p && p.role === 'barbeiro') return r.replace('/barbeiro');
    const { data: sh } = p?.shop_id ? await s.from('shops').select('id,nome').eq('id', p.shop_id).single() : {};
    if (!sh) return r.replace('/login'); setShop(sh); })(); }, [r]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!shop) return; const s = sb();
    const ch = s.channel('n-' + shop.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `shop_id=eq.${shop.id}` }, () => load()).subscribe();
    return () => { s.removeChannel(ch); }; }, [shop, load]);
  async function status(id, x) { await sb().from('appointments').update({ status: x }).eq('id', id).eq('status', 'agendado'); load(); }
  async function addStaff() { setMsg(''); const c = parseFloat(bc);
    if (bn.trim().length < 2 || !(c >= 0 && c <= 100)) { setMsg('Informe nome e comissão entre 0 e 100.'); return; }
    const { error } = await sb().from('staff').insert({ shop_id: shop.id, nome: bn.trim(), comissao_pct: c });
    if (error) setMsg('Erro ao adicionar barbeiro.'); else { setBn(''); load(); } }
  async function addServ() { setMsg(''); const p = parseFloat(v.preco), d = parseInt(v.dur, 10), s = sb(); let foto_url = null;
    if (v.nome.trim().length < 2 || !(p >= 0) || !(d >= 10)) { setMsg('Informe nome, preço e duração (mín. 10 min).'); return; }
    if (file) { if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 3e6) { setMsg('Foto: JPG, PNG ou WebP de até 3 MB.'); return; }
      const path = `${shop.id}/${Date.now()}.${file.type.split('/')[1]}`; const { error } = await s.storage.from('galeria').upload(path, file);
      if (error) { setMsg('Erro ao enviar a foto.'); return; } foto_url = s.storage.from('galeria').getPublicUrl(path).data.publicUrl; }
    const { error } = await s.from('services').insert({ shop_id: shop.id, nome: v.nome.trim(), preco: p, dur_min: d, foto_url });
    if (error) setMsg('Erro ao salvar o serviço.'); else { setV({ nome: '', preco: '', dur: '30' }); setFile(null); setFk(fk + 1); load(); } }
  async function toggle(t, x) { await sb().from(t).update({ ativo: !x.ativo }).eq('id', x.id); load(); }
  async function lerTudo() { await sb().from('notifications').update({ lida: true }).eq('lida', false); load(); }
  if (!shop) return <p>Carregando...</p>;
  const novas = nt.filter((n) => !n.lida).length; const nm = (id) => st.find((x) => x.id === id)?.nome || '?'; const sn = (id) => sv.find((x) => x.id === id)?.nome || '';
  return (<div><h2>{shop.nome}</h2><PushBtn shopId={shop.id} /><p>
    {[['agenda', 'Agenda'], ['staff', 'Equipe'], ['svc', 'Serviços e fotos'], ['hor', 'Horários'], ['fin', 'Financeiro'], ['nt', 'Avisos' + (novas ? ` (${novas})` : '')]].map(([k, n]) => (
      <button key={k} className={tab === k ? '' : 'g'} style={{ marginRight: 6 }} onClick={() => { setTab(k); setMsg(''); }}>{n}</button>))}
    <button className="g" onClick={async () => { await sb().auth.signOut(); r.replace('/'); }}>Sair</button></p>
    {tab === 'agenda' && (<><input type="date" value={day} onChange={(e) => e.target.value && setDay(e.target.value)} />
      {ap.map((a) => (<div className="card row" key={a.id}><span><b>{hm(a.starts_at)}</b> {a.cliente_nome} - {sn(a.service_id)} ({nm(a.staff_id)}) <small>[{a.status}]</small><br /><small>{a.cliente_tel} | {R(a.preco_cobrado)}</small></span>
        {a.status === 'agendado' && <span><button onClick={() => status(a.id, 'concluido')}>Concluir</button> <button className="g" onClick={() => status(a.id, 'faltou')}>Faltou</button> <button className="g" onClick={() => status(a.id, 'cancelado')}>Cancelar</button></span>}</div>))}
      {!ap.length && <p><small>Nenhum agendamento neste dia.</small></p>}
      <p><small>Link para seus clientes: /b/slug da barbearia (aparece na página inicial).</small></p></>)}
    {tab === 'staff' && (<><div className="card"><input placeholder="Nome do barbeiro" maxLength={60} value={bn} onChange={(e) => setBn(e.target.value)} />
      <input type="number" min="0" max="100" placeholder="Comissão %" value={bc} onChange={(e) => setBc(e.target.value)} /><button onClick={addStaff}>Adicionar barbeiro</button></div>
      <div className="card">{st.map((x) => (<div className="row" key={x.id}><span>{x.nome} <small>{x.comissao_pct}% {x.ativo ? '' : '(inativo)'}</small></span><button className="g" onClick={() => toggle('staff', x)}>{x.ativo ? 'Desativar' : 'Reativar'}</button></div>))}</div></>)}
    {tab === 'staff' && <AcessoBarbeiro st={st} reload={load} />}
    {tab === 'svc' && (<><div className="card"><input placeholder="Serviço" maxLength={60} value={v.nome} onChange={(e) => setV({ ...v, nome: e.target.value })} />
      <input type="number" min="0" step="0.01" placeholder="Preço" value={v.preco} onChange={(e) => setV({ ...v, preco: e.target.value })} />
      <input type="number" min="10" step="5" placeholder="Minutos" value={v.dur} onChange={(e) => setV({ ...v, dur: e.target.value })} />
      <input key={fk} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} /><button onClick={addServ}>Adicionar serviço</button></div>
      <div className="card">{sv.map((x) => (<div className="row" key={x.id}><span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{x.foto_url && <img src={x.foto_url} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 6 }} />}{x.nome} - {R(x.preco)} <small>{x.dur_min} min {x.ativo ? '' : '(inativo)'}</small></span><button className="g" onClick={() => toggle('services', x)}>{x.ativo ? 'Desativar' : 'Reativar'}</button></div>))}</div></>)}
    {tab === 'hor' && <Horarios st={st} />}
    {tab === 'fin' && <Financeiro shop={shop} />}
    {tab === 'nt' && (<><button className="g" onClick={lerTudo}>Marcar tudo como lido</button>
      {nt.map((n) => (<div className="card" key={n.id} style={{ borderLeft: n.lida ? undefined : '4px solid var(--ac)' }}>{n.texto}<br /><small>{new Date(n.created_at).toLocaleString('pt-BR')}</small></div>))}
      {!nt.length && <p><small>Sem avisos.</small></p>}</>)}
    <p className="err" role="alert">{msg}</p></div>);
}
