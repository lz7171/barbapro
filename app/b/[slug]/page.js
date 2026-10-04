'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import { R, hoje, ts } from '../../../lib/util';
import { gerarSlots } from '../../../lib/slots';
const ERR = { horario_ocupado: 'Esse horário acabou de ser ocupado. Escolha outro.', horario_passado: 'Esse horário já passou.',
  dados_invalidos: 'Confira nome e telefone.', fora_do_horario: 'Fora do horário do barbeiro.', barbeiro_folga: 'O barbeiro está de folga nesse dia.', barbearia_indisponivel: 'Barbearia indisponível no momento.' };
export default function Agendar() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null); const [sv, setSv] = useState([]); const [st, setSt] = useState([]); const [load, setLoad] = useState(true);
  const [s1, setS1] = useState(null); const [b, setB] = useState(''); const [d, setD] = useState(''); const [busy, setBusy] = useState([]);
  const [h, setH] = useState(null); const [hs, setHs] = useState([]); const [folgas, setFolgas] = useState([]); const [nome, setNome] = useState(''); const [tel, setTel] = useState('');
  const [msg, setMsg] = useState(''); const [done, setDone] = useState(null); const [aceito, setAceito] = useState(false); const [sending, setSending] = useState(false);
  useEffect(() => { (async () => {
    const s = sb(); const { data: sh } = await s.from('shops').select('id,nome').eq('slug', slug).maybeSingle();
    if (sh) { setShop(sh);
      const [a, c] = await Promise.all([s.from('services').select('*').eq('shop_id', sh.id).eq('ativo', true).order('nome'),
        s.from('staff').select('*').eq('shop_id', sh.id).eq('ativo', true).order('nome')]);
      setSv(a.data || []); setSt(c.data || []); }
    setLoad(false); })(); }, [slug]);
  useEffect(() => { setH(null); if (!b || !d) return; (async () => {
    const { data } = await sb().rpc('horarios_ocupados', { p_staff: b, p_de: ts(d, 0).toISOString(), p_ate: ts(d, 1439).toISOString() });
    setBusy(data || []); })(); }, [b, d]);
  useEffect(() => { setHs([]); setFolgas([]); if (!b) return; (async () => { const s = sb();
    const [x, y] = await Promise.all([s.from('horarios').select('*').eq('staff_id', b), s.from('folgas').select('dia').eq('staff_id', b)]);
    setHs(x.data || []); setFolgas((y.data || []).map((z) => z.dia)); })(); }, [b]);
  const slots = s1 && b ? gerarSlots({ d, dur: s1.dur_min, busy, hs, folgas }) : [];
  async function confirmar() {
    if (!s1 || !b || !d || h === null) { setMsg('Escolha serviço, barbeiro, dia e horário.'); return; }
    if (nome.trim().length < 2 || tel.replace(/\D/g, '').length < 8) { setMsg('Informe nome e telefone válidos.'); return; }
    if (!aceito) { setMsg('É preciso aceitar os termos.'); return; }
    setSending(true); setMsg('');
    const { data, error } = await sb().rpc('criar_agendamento', { p_shop: shop.id, p_staff: b, p_service: s1.id, p_nome: nome, p_tel: tel, p_inicio: ts(d, h).toISOString() });
    setSending(false);
    if (error) { const k = Object.keys(ERR).find((x) => (error.message || '').includes(x)); setMsg(ERR[k] || 'Não foi possível agendar. Tente de novo.');
      if (k === 'horario_ocupado') { setH(null); setD(d + ''); const { data } = await sb().rpc('horarios_ocupados', { p_staff: b, p_de: ts(d, 0).toISOString(), p_ate: ts(d, 1439).toISOString() }); setBusy(data || []); } return; }
    setDone(data);
  }
  if (load) return <p>Carregando...</p>;
  if (!shop) return <div className="card"><h2>Barbearia não encontrada</h2></div>;
  if (done) return <div className="card"><h2>Agendado!</h2><p>Seu horário na {shop.nome} foi confirmado.</p><p>Guarde este link para cancelar se precisar: <a href={'/cancelar/' + done}>/cancelar/{done}</a></p></div>;
  return (<div><h2>{shop.nome}</h2>
    <div className="card"><h3>1. Serviço</h3>{sv.map((x) => (<div className="row" key={x.id} style={{ borderLeft: s1?.id === x.id ? '4px solid var(--bl)' : 'none', paddingLeft: 8 }}>
      <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>{x.foto_url && <img src={x.foto_url} alt={x.nome} width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />}
        <span><b>{x.nome}</b><br />{R(x.preco)} <small>{x.dur_min} min</small></span></span>
      <button onClick={() => { setS1(x); setH(null); }}>Escolher</button></div>))}
      {!sv.length && <small>Sem serviços disponíveis.</small>}</div>
    <div className="card"><h3>2. Barbeiro e dia</h3>
      <select value={b} onChange={(e) => setB(e.target.value)}><option value="">Escolha o barbeiro</option>{st.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
      <input type="date" min={hoje()} value={d} onChange={(e) => setD(e.target.value)} /></div>
    <div className="card"><h3>3. Horário</h3>{slots.map((m) => (<button key={m} className={h === m ? '' : 'g'} style={{ margin: 3 }} onClick={() => setH(m)}>
      {String(Math.floor(m / 60)).padStart(2, '0')}:{String(m % 60).padStart(2, '0')}</button>))}
      {!slots.length && <small>{s1 && b && d ? 'Sem horários livres neste dia.' : 'Escolha serviço, barbeiro e dia.'}</small>}</div>
    <div className="card"><h3>4. Seus dados</h3>
      <input placeholder="Nome" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
      <input placeholder="Telefone" type="tel" maxLength={20} value={tel} onChange={(e) => setTel(e.target.value)} />
      <label><input type="checkbox" style={{ width: 'auto' }} checked={aceito} onChange={(e) => setAceito(e.target.checked)} /> Aceito os <a href="/termos" target="_blank">termos e a política de privacidade</a></label><br />
      <button disabled={sending} onClick={confirmar}>{sending ? 'Agendando...' : 'Confirmar agendamento'}</button>
      <p className="err" role="alert">{msg}</p></div></div>);
}
