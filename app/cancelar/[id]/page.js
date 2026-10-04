'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { sb } from '../../../lib/supabase';
import { ts, hoje } from '../../../lib/util';
import { gerarSlots } from '../../../lib/slots';
const ERR = { prazo_expirado: 'O prazo acabou. Fale com a barbearia.', ja_encerrado: 'Este agendamento já foi encerrado.', nao_encontrado: 'Agendamento não encontrado.',
  horario_ocupado: 'Esse horário foi ocupado. Escolha outro.', horario_passado: 'Horário inválido.', fora_do_horario: 'Fora do horário do barbeiro.', barbeiro_folga: 'O barbeiro está de folga nesse dia.' };
export default function Cancelar() {
  const { id } = useParams(); const [a, setA] = useState(undefined); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(false); const [d, setD] = useState(''); const [h, setH] = useState(null); const [bs, setBs] = useState([]); const [hs, setHs] = useState([]); const [fo, setFo] = useState([]);
  const ver = async () => { const { data } = await sb().rpc('ver_agendamento', { p_id: id }); setA(data && data[0] ? data[0] : null); };
  const fail = (error) => { const k = Object.keys(ERR).find((x) => (error.message || '').includes(x)); setMsg(ERR[k] || 'Não foi possível concluir. Tente de novo.'); };
  useEffect(() => { ver(); }, [id]);
  useEffect(() => { if (!a || !mode) return; (async () => { const s = sb();
    const [x, y] = await Promise.all([s.from('horarios').select('*').eq('staff_id', a.staff_id), s.from('folgas').select('dia').eq('staff_id', a.staff_id)]);
    setHs(x.data || []); setFo((y.data || []).map((z) => z.dia)); })(); }, [a, mode]);
  useEffect(() => { setH(null); if (!a || !d) return; (async () => {
    const { data } = await sb().rpc('horarios_ocupados', { p_staff: a.staff_id, p_de: ts(d, 0).toISOString(), p_ate: ts(d, 1439).toISOString() });
    setBs((data || []).filter((x) => new Date(x.starts_at).getTime() !== new Date(a.starts_at).getTime())); })(); }, [a, d]);
  async function cancelar() { setBusy(true); setMsg(''); const { error } = await sb().rpc('cancelar_agendamento', { p_id: id }); setBusy(false); if (error) fail(error); else ver(); }
  async function remarcar() { if (h === null) { setMsg('Escolha um horário.'); return; } setBusy(true); setMsg('');
    const { error } = await sb().rpc('remarcar_agendamento', { p_id: id, p_inicio: ts(d, h).toISOString() }); setBusy(false);
    if (error) fail(error); else { setMode(false); setD(''); ver(); setMsg('Agendamento remarcado!'); } }
  if (a === undefined) return <p>Carregando...</p>;
  if (!a) return <div className="card"><h2>Agendamento não encontrado</h2></div>;
  const slots = mode && d ? gerarSlots({ d, dur: a.dur_min, busy: bs, hs, folgas: fo }) : [];
  return (<div className="card"><h2>{a.shop_nome}</h2>
    <p>Horário: {new Date(a.starts_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', dateStyle: 'full', timeStyle: 'short' })}</p>
    <p>Situação: <b>{a.status}</b></p>
    {a.status === 'agendado' && !mode && <><button disabled={busy} onClick={() => { setMode(true); setMsg(''); }}>Remarcar</button> <button className="g" disabled={busy} onClick={cancelar}>Cancelar agendamento</button>
      <p><small>Remarcar ou cancelar é permitido até {a.cancel_horas}h antes do horário.</small></p></>}
    {mode && <><h3>Novo horário</h3><input type="date" min={hoje()} value={d} onChange={(e) => setD(e.target.value)} />
      {slots.map((m) => (<button key={m} className={h === m ? '' : 'g'} style={{ margin: 3 }} onClick={() => setH(m)}>{String(Math.floor(m / 60)).padStart(2, '0')}:{String(m % 60).padStart(2, '0')}</button>))}
      {d && !slots.length && <p><small>Sem horários livres neste dia.</small></p>}
      <p><button disabled={busy} onClick={remarcar}>Confirmar remarcação</button> <button className="g" onClick={() => setMode(false)}>Voltar</button></p></>}
    <p className={msg.endsWith('remarcado!') ? 'ok' : 'err'} role="alert">{msg}</p></div>);
}
