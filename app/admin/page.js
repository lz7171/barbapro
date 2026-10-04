'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../lib/supabase';
export default function Admin() {
  const r = useRouter(); const [ok, setOk] = useState(false); const [tab, setTab] = useState('shops');
  const [shops, setShops] = useState([]); const [quotes, setQuotes] = useState([]);
  const [f, setF] = useState({ nome: '', email: '', senha: '' }); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const s = sb();
    const a = await s.from('shops').select('*').order('created_at', { ascending: false });
    const b = await s.from('quotes').select('*').order('created_at', { ascending: false });
    setShops(a.data || []); setQuotes(b.data || []); }, []);
  useEffect(() => { (async () => {
    const s = sb(); const { data } = await s.auth.getSession();
    if (!data.session) return r.replace('/login');
    const { data: p } = await s.from('profiles').select('role').eq('id', data.session.user.id).single();
    if (!p || p.role !== 'super_admin') return r.replace('/login');
    setOk(true); load(); })(); }, [r, load]);
  async function criar() {
    setMsg('');
    if (f.nome.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email) || f.senha.length < 8) { setMsg('Informe nome, e-mail válido e senha com 8+ caracteres.'); return; }
    setBusy(true);
    const { data } = await sb().auth.getSession();
    const res = await fetch('/api/criar-barbearia', { method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token },
      body: JSON.stringify(f) });
    const j = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(j.erro || 'Erro ao criar.'); return; }
    setF({ nome: '', email: '', senha: '' }); setMsg('Barbearia criada e liberada.'); load();
  }
  async function alternar(x) {
    await sb().from('shops').update({ status: x.status === 'ativa' ? 'suspensa' : 'ativa' }).eq('id', x.id); load(); }
  async function pagoAte(id, v) { await sb().from('shops').update({ pago_ate: v || null }).eq('id', id); load(); }
  async function statusQuote(id, status) { await sb().from('quotes').update({ status }).eq('id', id); load(); }
  if (!ok) return <p>Carregando...</p>;
  return (<div><h2>Painel Super Admin</h2>
    <p><button className={tab === 'shops' ? '' : 'g'} onClick={() => setTab('shops')}>Barbearias</button>{' '}
    <button className={tab === 'quotes' ? '' : 'g'} onClick={() => setTab('quotes')}>Orçamentos ({quotes.filter((q) => q.status === 'novo').length})</button>{' '}
    <button className="g" onClick={async () => { await sb().auth.signOut(); r.replace('/'); }}>Sair</button></p>
    {tab === 'shops' ? (<>
      <div className="card"><h3>Nova barbearia</h3>
        <input placeholder="Nome da barbearia" maxLength={80} value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} />
        <input type="email" placeholder="E-mail do dono" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <input type="text" placeholder="Senha inicial (mín. 8)" value={f.senha} onChange={(e) => setF({ ...f, senha: e.target.value })} />
        <button disabled={busy} onClick={criar}>{busy ? 'Criando...' : 'Criar e liberar'}</button>
        <p className={msg.startsWith('Barbearia') ? 'ok' : 'err'} role="alert">{msg}</p></div>
      <div className="card">{shops.map((x) => (<div className="row" key={x.id}><span>{x.nome} <small>({x.status})</small></span>
        <input type="date" style={{ width: 150 }} title="Pago até" value={x.pago_ate || ''} onChange={(e) => pagoAte(x.id, e.target.value)} />
        <button className="g" onClick={() => alternar(x)}>{x.status === 'ativa' ? 'Suspender' : 'Reativar'}</button></div>))}
        {!shops.length && <small>Nenhuma barbearia ainda.</small>}</div></>) : (
      <div>{quotes.map((q) => (<div className="card" key={q.id}><b>{q.barbearia}</b> - {q.nome}<br />
        <small>{q.cidade} | {q.telefone} | {q.email} | {q.qtd_barbeiros} barbeiro(s)</small><p>{q.mensagem}</p>
        <select value={q.status} onChange={(e) => statusQuote(q.id, e.target.value)}>
          {['novo', 'em contato', 'fechado', 'perdido'].map((o) => <option key={o}>{o}</option>)}</select></div>))}
        {!quotes.length && <small>Nenhum orçamento ainda.</small>}</div>)}</div>);
}
