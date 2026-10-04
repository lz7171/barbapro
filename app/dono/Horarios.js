'use client';
import { useEffect, useState, useCallback } from 'react';
import { sb } from '../../lib/supabase';
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const vazio = () => DIAS.map((_, i) => ({ on: i >= 1, ini: '09:00', fim: '18:00', ii: '', fi: '' }));
const w = { width: 'auto' };
export default function Horarios({ st }) {
  const [b, setB] = useState(''); const [g, setG] = useState(vazio()); const [fol, setFol] = useState([]); const [nd, setNd] = useState(''); const [msg, setMsg] = useState('');
  const load = useCallback(async () => { if (!b) return; const s = sb();
    const [x, y] = await Promise.all([s.from('horarios').select('*').eq('staff_id', b), s.from('folgas').select('*').eq('staff_id', b).order('dia')]);
    const n = vazio();
    if (x.data && x.data.length) { n.forEach((d) => { d.on = false; });
      x.data.forEach((h) => { n[h.dia_semana] = { on: true, ini: h.inicio.slice(0, 5), fim: h.fim.slice(0, 5), ii: h.int_ini ? h.int_ini.slice(0, 5) : '', fi: h.int_fim ? h.int_fim.slice(0, 5) : '' }; }); }
    setG(n); setFol(y.data || []); }, [b]);
  useEffect(() => { load(); }, [load]);
  const up = (i, k, v) => setG(g.map((d, j) => (j === i ? { ...d, [k]: v } : d)));
  async function salvar() { setMsg(''); const on = g.map((d, i) => ({ ...d, i })).filter((d) => d.on);
    if (!on.length) { setMsg('Marque ao menos um dia de trabalho.'); return; }
    for (const d of on) {
      if (!d.ini || !d.fim || d.fim <= d.ini) { setMsg(`${DIAS[d.i]}: o fim deve ser depois do início.`); return; }
      if ((d.ii || d.fi) && (!d.ii || !d.fi || d.fi <= d.ii || d.ii < d.ini || d.fi > d.fim)) { setMsg(`${DIAS[d.i]}: intervalo inválido.`); return; } }
    const s = sb(); const e1 = (await s.from('horarios').delete().eq('staff_id', b)).error;
    const e2 = (await s.from('horarios').insert(on.map((d) => ({ staff_id: b, dia_semana: d.i, inicio: d.ini, fim: d.fim, int_ini: d.ii || null, int_fim: d.fi || null })))).error;
    setMsg(e1 || e2 ? 'Erro ao salvar. Tente de novo.' : 'Horários salvos. Agendamentos já marcados não mudam.'); load(); }
  async function addFolga() { if (!nd) return; const { error } = await sb().from('folgas').insert({ staff_id: b, dia: nd }); setMsg(error ? 'Essa folga já existe.' : ''); setNd(''); load(); }
  async function delFolga(id) { await sb().from('folgas').delete().eq('id', id); load(); }
  return (<div className="card"><h3>Horários e folgas</h3>
    <select value={b} onChange={(e) => setB(e.target.value)}><option value="">Escolha o barbeiro</option>{st.filter((x) => x.ativo).map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
    {b && <>{g.map((d, i) => (<div className="row" key={i}><label><input type="checkbox" style={w} checked={d.on} onChange={(e) => up(i, 'on', e.target.checked)} /> {DIAS[i]}</label>
        {d.on ? <span><input type="time" style={w} value={d.ini} onChange={(e) => up(i, 'ini', e.target.value)} /> às <input type="time" style={w} value={d.fim} onChange={(e) => up(i, 'fim', e.target.value)} />
          {' '}<small>intervalo</small> <input type="time" style={w} value={d.ii} onChange={(e) => up(i, 'ii', e.target.value)} /> <input type="time" style={w} value={d.fi} onChange={(e) => up(i, 'fi', e.target.value)} /></span> : <small>Folga</small>}</div>))}
      <p><button onClick={salvar}>Salvar horários</button></p>
      <h4>Folgas em dias específicos</h4><input type="date" style={w} value={nd} onChange={(e) => setNd(e.target.value)} /> <button className="g" onClick={addFolga}>Adicionar folga</button>
      {fol.map((f) => (<div className="row" key={f.id}>{f.dia.split('-').reverse().join('/')}<button className="g" onClick={() => delFolga(f.id)}>Remover</button></div>))}</>}
    <p className={msg.startsWith('Horários') ? 'ok' : 'err'} role="alert">{msg}</p></div>);
}
