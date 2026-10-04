'use client';
import { useState } from 'react';
import { sb } from '../../lib/supabase';
export default function Orcamento() {
  const [f, setF] = useState({ nome: '', barbearia: '', cidade: '', telefone: '', email: '', qtd: '', mensagem: '' });
  const [msg, setMsg] = useState(''); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [aceito, setAceito] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function enviar() {
    if (f.nome.trim().length < 2 || f.barbearia.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(f.email)) {
      setMsg('Preencha nome, barbearia e um e-mail válido.'); return; }
    if (!aceito) { setMsg('É preciso aceitar os termos.'); return; }
    setBusy(true); setMsg('');
    const { error } = await sb().from('quotes').insert({
      nome: f.nome.trim(), barbearia: f.barbearia.trim(), cidade: f.cidade.trim() || null,
      telefone: f.telefone.trim() || null, email: f.email.trim(),
      qtd_barbeiros: f.qtd ? parseInt(f.qtd, 10) : null, mensagem: f.mensagem.trim() || null });
    setBusy(false);
    if (error) setMsg('Não foi possível enviar. Confira os campos e tente de novo.'); else setDone(true);
  }
  if (done) return <div className="card"><h2>Pedido enviado!</h2><p>Entraremos em contato em breve.</p></div>;
  return (<div className="card"><h2>Pedir orçamento</h2>
    <input placeholder="Seu nome" maxLength={80} value={f.nome} onChange={set('nome')} />
    <input placeholder="Nome da barbearia" maxLength={80} value={f.barbearia} onChange={set('barbearia')} />
    <input placeholder="Cidade" maxLength={60} value={f.cidade} onChange={set('cidade')} />
    <input placeholder="Telefone" type="tel" maxLength={20} value={f.telefone} onChange={set('telefone')} />
    <input placeholder="E-mail" type="email" value={f.email} onChange={set('email')} />
    <input placeholder="Quantos barbeiros?" type="number" min="1" max="100" value={f.qtd} onChange={set('qtd')} />
    <textarea placeholder="O que você precisa?" maxLength={500} value={f.mensagem} onChange={set('mensagem')} />
    <label><input type="checkbox" style={{ width: 'auto' }} checked={aceito} onChange={(e) => setAceito(e.target.checked)} /> Aceito os <a href="/termos" target="_blank">termos e a política de privacidade</a></label><br />
    <button disabled={busy} onClick={enviar}>{busy ? 'Enviando...' : 'Enviar pedido'}</button>
    <p className="err" role="alert">{msg}</p></div>);
}
