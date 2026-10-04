'use client';
import { useState } from 'react';
import { sb } from '../../lib/supabase';
export default function Orcamento() {
  const [f, setF] = useState({ nome: '', barbearia: '', cidade: '', telefone: '', email: '', qtd: '', mensagem: '' });
  const [msg, setMsg] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [aceito, setAceito] = useState(false); const [mel, setMel] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function enviar() {
    if (f.nome.trim().length < 2 || f.barbearia.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email)) {
      setMsg('Preencha nome, barbearia e um e-mail válido.'); return; }
    if (!aceito) { setMsg('É preciso aceitar os termos.'); return; }
    if (mel) { setDone(true); return; }
    setBusy(true); setMsg('');
    const { error } = await sb().from('quotes').insert({
      nome: f.nome.trim(), barbearia: f.barbearia.trim(), cidade: f.cidade.trim() || null,
      telefone: f.telefone.trim() || null, email: f.email.trim(),
      qtd_barbeiros: f.qtd ? parseInt(f.qtd, 10) : null, mensagem: f.mensagem.trim() || null });
    setBusy(false);
    if (error) setMsg((error.message || '').includes('muitas_tentativas') ? 'Você já enviou pedidos demais. Tente de novo mais tarde.' : 'Não foi possível enviar. Confira os campos e tente de novo.'); else setDone(true);
  }
  if (done) return <div className="card"><h2>Pedido enviado</h2><p>Recebemos os dados da sua barbearia e entraremos em contato pelo e-mail ou telefone informado.</p><a className="btn" href="/">Voltar ao início</a></div>;
  return (<div className="split"><div><h2>Pedir orçamento</h2>
      <p style={{ color: 'var(--mu)', fontSize: 18 }}>Conte um pouco sobre a sua barbearia e entramos em contato com uma proposta.</p>
      <ul><li>Agenda online com o seu link próprio</li><li>Equipe, horários, folgas e comissões</li><li>Serviços com foto e controle financeiro</li></ul></div>
    <div className="card"><div className="cols2">
      <div><label className="lbl" htmlFor="o1">Seu nome</label><input id="o1" maxLength={80} value={f.nome} onChange={set('nome')} /></div>
      <div><label className="lbl" htmlFor="o2">Nome da barbearia</label><input id="o2" maxLength={80} value={f.barbearia} onChange={set('barbearia')} /></div>
      <div><label className="lbl" htmlFor="o3">Cidade</label><input id="o3" maxLength={60} value={f.cidade} onChange={set('cidade')} /></div>
      <div><label className="lbl" htmlFor="o4">Telefone</label><input id="o4" type="tel" maxLength={20} value={f.telefone} onChange={set('telefone')} /></div>
      <div><label className="lbl" htmlFor="o5">E-mail</label><input id="o5" type="email" value={f.email} onChange={set('email')} /></div>
      <div><label className="lbl" htmlFor="o6">Quantos barbeiros?</label><input id="o6" type="number" min="1" max="100" value={f.qtd} onChange={set('qtd')} /></div></div>
    <label className="lbl" htmlFor="o7">O que você precisa?</label><textarea id="o7" maxLength={500} value={f.mensagem} onChange={set('mensagem')} />
    <input tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }} name="website" value={mel} onChange={(e) => setMel(e.target.value)} />
    <label style={{ display: 'block', margin: '12px 0' }}><input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />Aceito os <a href="/termos" target="_blank" rel="noopener">termos e a política de privacidade</a></label>
    <button disabled={busy} onClick={enviar}>{busy ? 'Enviando...' : 'Enviar pedido'}</button>
    <p className="err" role="alert">{msg}</p></div></div>);
}
