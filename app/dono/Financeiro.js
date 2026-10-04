'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '../../lib/supabase';
import { R, hoje, inicioDia, fimDia, dataBR } from '../../lib/util';
export default function Financeiro({ shop }) {
  const [de, setDe] = useState(hoje().slice(0, 8) + '01'); const [ate, setAte] = useState(hoje());
  const [fin, setFin] = useState([]); const [ap, setAp] = useState([]); const [st, setSt] = useState([]);
  const [f, setF] = useState({ tipo: 'saida', descricao: '', valor: '' }); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const s = sb(); const a = inicioDia(de), b = fimDia(ate);
    const [x, y, z] = await Promise.all([
      s.from('finance').select('*').gte('created_at', a).lte('created_at', b).order('created_at', { ascending: false }),
      s.from('appointments').select('staff_id,preco_cobrado').eq('status', 'concluido').gte('starts_at', a).lte('starts_at', b),
      s.from('staff').select('id,nome,comissao_pct')]);
    setFin(x.data || []); setAp(y.data || []); setSt(z.data || []); }, [de, ate]);
  useEffect(() => { if (de && ate && de <= ate) load(); }, [de, ate, load]);
  const ent = fin.filter((x) => x.tipo === 'entrada').reduce((t, x) => t + Number(x.valor), 0);
  const sai = fin.filter((x) => x.tipo === 'saida').reduce((t, x) => t + Number(x.valor), 0);
  const com = st.map((p) => { const l = ap.filter((a) => a.staff_id === p.id); const tot = l.reduce((t, a) => t + Number(a.preco_cobrado), 0);
    return { ...p, qtd: l.length, tot, comissao: tot * Number(p.comissao_pct) / 100 }; }).filter((p) => p.qtd > 0);
  async function lancar() {
    const v = parseFloat(f.valor); setMsg('');
    if (!f.descricao.trim() || !(v > 0)) { setMsg('Informe descrição e valor maior que zero.'); return; }
    setBusy(true);
    const { error } = await sb().from('finance').insert({ shop_id: shop.id, tipo: f.tipo, descricao: f.descricao.trim(), valor: v });
    setBusy(false);
    if (error) setMsg('Não foi possível lançar.'); else { setF({ ...f, descricao: '', valor: '' }); load(); } }
  function exportar() {
    const q = (t) => '"' + String(t).replace(/"/g, '""') + '"';
    const linhas = ['Data;Tipo;Descricao;Valor', ...fin.map((x) => [dataBR(x.created_at), x.tipo, q(x.descricao), Number(x.valor).toFixed(2).replace('.', ',')].join(';'))];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const el = document.createElement('a'); el.href = url; el.download = `financeiro-${de}-a-${ate}.csv`; el.click(); URL.revokeObjectURL(url); }
  return (<div>
    <div className="card"><b>Período</b><input type="date" value={de} onChange={(e) => setDe(e.target.value)} /><input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
      {de > ate && <p className="err">A data inicial não pode ser maior que a final.</p>}</div>
    <div className="stats"><div className="stat"><small>Entradas</small><b className="ok">{R(ent)}</b></div><div className="stat"><small>Saídas</small><b className="err">{R(sai)}</b></div><div className="stat"><small>Saldo</small><b>{R(ent - sai)}</b></div></div>
    <div className="card"><h3>Novo lançamento</h3>
      <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })}><option value="saida">Saída (aluguel, produtos, salários)</option><option value="entrada">Entrada (venda de produto, outros)</option></select>
      <input placeholder="Descrição" maxLength={120} value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} />
      <input type="number" min="0.01" step="0.01" placeholder="Valor" value={f.valor} onChange={(e) => setF({ ...f, valor: e.target.value })} />
      <button disabled={busy} onClick={lancar}>{busy ? 'Lançando...' : 'Lançar'}</button><p className="err" role="alert">{msg}</p></div>
    <div className="card"><h3>Comissão por barbeiro</h3>
      {com.map((p) => (<div className="row" key={p.id}><span>{p.nome} <small>{p.qtd} atendimento(s) | {R(p.tot)} | {p.comissao_pct}%</small></span><b>{R(p.comissao)}</b></div>))}
      {!com.length && <small>Nenhum atendimento concluído no período.</small>}</div>
    <div className="card"><div className="row"><h3>Movimentações</h3><span><button className="g" disabled={!fin.length} onClick={exportar}>Exportar CSV</button> <button className="g" onClick={() => window.print()}>Imprimir / PDF</button></span></div>
      {fin.map((x) => (<div className="row" key={x.id}><span>{x.descricao} <small>{dataBR(x.created_at)}</small></span>
        <b className={x.tipo === 'entrada' ? 'ok' : 'err'}>{x.tipo === 'entrada' ? '+' : '-'}{R(x.valor)}</b></div>))}
      {!fin.length && <small>Sem movimentações no período.</small>}</div></div>);
}
