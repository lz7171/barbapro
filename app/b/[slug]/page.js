'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import { R, hoje, ts, setFuso, inicioDia, fimDia, dataLonga } from '../../../lib/util';
import { gerarSlots } from '../../../lib/slots';
const ERR = { horario_ocupado: 'Esse horário acabou de ser ocupado. Escolha outro.', horario_passado: 'Esse horário já passou.', horario_distante: 'Só é possível agendar até 90 dias à frente.',
  dados_invalidos: 'Confira nome e telefone.', fora_do_horario: 'Fora do horário do barbeiro.', barbeiro_folga: 'O barbeiro está de folga nesse dia.', barbearia_indisponivel: 'Barbearia indisponível no momento.',
  limite_agendamentos: 'Você já tem 3 horários marcados nesta barbearia. Cancele um para marcar outro.', muitas_tentativas: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.' };
const hh = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
export default function Agendar() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null); const [sv, setSv] = useState([]); const [st, setSt] = useState([]); const [load, setLoad] = useState(true);
  const [s1, setS1] = useState(null); const [b, setB] = useState(''); const [d, setD] = useState(''); const [busy, setBusy] = useState([]);
  const [h, setH] = useState(null); const [hs, setHs] = useState([]); const [folgas, setFolgas] = useState([]); const [nome, setNome] = useState(''); const [tel, setTel] = useState('');
  const [msg, setMsg] = useState(''); const [done, setDone] = useState(null); const [aceito, setAceito] = useState(false); const [sending, setSending] = useState(false); const [copiado, setCopiado] = useState(false);
  useEffect(() => { (async () => {
    const s = sb(); const { data: sh } = await s.from('shops').select('id,nome,fuso').eq('slug', slug).maybeSingle();
    if (sh) { setFuso(sh.fuso); setShop(sh);
      const [a, c] = await Promise.all([s.from('services').select('*').eq('shop_id', sh.id).eq('ativo', true).order('nome'),
        s.from('staff').select('*').eq('shop_id', sh.id).eq('ativo', true).order('nome')]);
      setSv(a.data || []); setSt(c.data || []); }
    setLoad(false); })(); }, [slug]);
  const buscarOcupados = async () => { const { data } = await sb().rpc('horarios_ocupados', { p_staff: b, p_de: inicioDia(d), p_ate: fimDia(d) }); setBusy(data || []); };
  useEffect(() => { setH(null); if (!b || !d || !shop) return; buscarOcupados(); }, [b, d, shop]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setHs([]); setFolgas([]); if (!b) return; (async () => { const s = sb();
    const [x, y] = await Promise.all([s.from('horarios').select('*').eq('staff_id', b), s.from('folgas').select('dia').eq('staff_id', b)]);
    setHs(x.data || []); setFolgas((y.data || []).map((z) => z.dia)); })(); }, [b]);
  const slots = s1 && b && d ? gerarSlots({ d, dur: s1.dur_min, busy, hs, folgas }) : [];
  const barbeiro = st.find((x) => x.id === b);
  async function confirmar() {
    if (!s1 || !b || !d || h === null) { setMsg('Escolha serviço, barbeiro, dia e horário.'); return; }
    if (nome.trim().length < 2 || tel.replace(/\D/g, '').length < 8) { setMsg('Informe nome e telefone válidos.'); return; }
    if (!aceito) { setMsg('É preciso aceitar os termos.'); return; }
    setSending(true); setMsg('');
    const { data, error } = await sb().rpc('criar_agendamento', { p_shop: shop.id, p_staff: b, p_service: s1.id, p_nome: nome, p_tel: tel, p_inicio: ts(d, h).toISOString() });
    setSending(false);
    if (error) { const k = Object.keys(ERR).find((x) => (error.message || '').includes(x)); setMsg(ERR[k] || 'Não foi possível agendar. Tente de novo.');
      if (k === 'horario_ocupado') { setH(null); buscarOcupados(); } return; }
    setDone({ id: data, quando: ts(d, h).toISOString(), servico: s1.nome, barbeiro: barbeiro?.nome });
  }
  if (load) return <p>Carregando...</p>;
  if (!shop) return <div className="card"><h2>Barbearia não encontrada</h2><p>Confira o endereço do link ou volte para a <a href="/">página inicial</a>.</p></div>;
  if (done) {
    const link = (typeof window !== 'undefined' ? window.location.origin : '') + '/cancelar/' + done.id;
    const zap = 'https://wa.me/?text=' + encodeURIComponent(`Meu horário na ${shop.nome}: ${dataLonga(done.quando)}. Para cancelar ou remarcar: ${link}`);
    return (<div className="card"><h2>Horário confirmado</h2>
      <div className="resumo"><b>{shop.nome}</b><br />{done.servico}{done.barbeiro ? ', com ' + done.barbeiro : ''}<br />{dataLonga(done.quando)}</div>
      <p>Guarde o link abaixo. É por ele que você cancela ou remarca, até {' '}o prazo definido pela barbearia.</p>
      <div className="linkbox"><code>{link}</code></div>
      <button onClick={async () => { try { await navigator.clipboard.writeText(link); setCopiado(true); } catch (e) { setCopiado(false); } }}>{copiado ? 'Link copiado' : 'Copiar link'}</button>{' '}
      <a className="btn g" style={{ background: '#fff', color: 'var(--ink)', borderColor: '#c5cedc' }} href={zap} target="_blank" rel="noopener noreferrer">Enviar para meu WhatsApp</a></div>);
  }
  return (<div><h2 style={{ marginBottom: 18 }}>{shop.nome}</h2>
    <div className="card"><h3 className="step"><i>1</i>Serviço</h3>{sv.map((x) => (
      <button type="button" className={'opt' + (s1?.id === x.id ? ' on' : '')} key={x.id} aria-pressed={s1?.id === x.id} onClick={() => { setS1(x); setH(null); }}>
        <span style={{ display: 'flex', gap: 12, alignItems: 'center' }}>{x.foto_url && <img src={x.foto_url} alt="" width={64} height={64} style={{ objectFit: 'cover', borderRadius: 8 }} />}
          <span><b>{x.nome}</b><br /><small>{x.dur_min} min</small></span></span><b>{R(x.preco)}</b></button>))}
      {!sv.length && <small>Esta barbearia ainda não cadastrou serviços.</small>}</div>
    <div className="card"><h3 className="step"><i>2</i>Barbeiro e dia</h3><div className="cols2">
      <select aria-label="Barbeiro" value={b} onChange={(e) => setB(e.target.value)}><option value="">Escolha o barbeiro</option>{st.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
      <input aria-label="Dia" type="date" min={hoje()} value={d} onChange={(e) => setD(e.target.value)} /></div></div>
    <div className="card"><h3 className="step"><i>3</i>Horário</h3><div className="chips">{slots.map((m) => (<button type="button" key={m} className={'chip' + (h === m ? ' on' : '')} aria-pressed={h === m} onClick={() => setH(m)}>{hh(m)}</button>))}</div>
      {!slots.length && <small>{s1 && b && d ? 'Sem horários livres neste dia. Tente outro dia ou outro barbeiro.' : 'Escolha o serviço, o barbeiro e o dia para ver os horários.'}</small>}</div>
    <div className="card"><h3 className="step"><i>4</i>Seus dados</h3>
      {s1 && h !== null && <div className="resumo">{s1.nome}, {R(s1.preco)}{barbeiro ? ', com ' + barbeiro.nome : ''}<br />{dataLonga(ts(d, h).toISOString())}</div>}
      <div className="cols2"><input aria-label="Nome" placeholder="Nome" autoComplete="name" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
        <input aria-label="Telefone" placeholder="Telefone com DDD" type="tel" autoComplete="tel" maxLength={20} value={tel} onChange={(e) => setTel(e.target.value)} /></div>
      <label style={{ display: 'block', margin: '8px 0' }}><input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />Aceito os <a href="/termos" target="_blank" rel="noopener">termos e a política de privacidade</a></label>
      <button disabled={sending} onClick={confirmar}>{sending ? 'Agendando...' : 'Confirmar agendamento'}</button>
      <p className="err" role="alert">{msg}</p></div></div>);
}
