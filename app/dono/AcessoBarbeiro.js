'use client';
import { useState } from 'react';
import { sb } from '../../lib/supabase';
export default function AcessoBarbeiro({ st, reload }) {
  const livres = st.filter((x) => !x.profile_id && x.ativo);
  const [id, setId] = useState(''); const [email, setEmail] = useState(''); const [senha, setSenha] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function criar() {
    if (!id || !/^\S+@\S+\.\S+$/.test(email) || senha.length < 8) { setMsg('Escolha o barbeiro, e-mail válido e senha com 8+ caracteres.'); return; }
    setBusy(true); setMsg(''); const { data } = await sb().auth.getSession();
    const res = await fetch('/api/criar-barbeiro', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + data.session.access_token }, body: JSON.stringify({ staff_id: id, email, senha }) });
    const j = await res.json().catch(() => ({})); setBusy(false);
    if (!res.ok) { setMsg(j.erro || 'Erro ao criar acesso.'); return; }
    setId(''); setEmail(''); setSenha(''); setMsg('Acesso criado.'); reload();
  }
  if (!livres.length) return null;
  return (<div className="card"><h3>Criar acesso para barbeiro</h3>
    <select value={id} onChange={(e) => setId(e.target.value)}><option value="">Escolha o barbeiro</option>{livres.map((x) => <option key={x.id} value={x.id}>{x.nome}</option>)}</select>
    <input type="email" placeholder="E-mail de login" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input type="text" placeholder="Senha inicial (mín. 8)" value={senha} onChange={(e) => setSenha(e.target.value)} />
    <button disabled={busy} onClick={criar}>{busy ? 'Criando...' : 'Criar acesso'}</button>
    <p className={msg === 'Acesso criado.' ? 'ok' : 'err'} role="alert">{msg}</p></div>);
}
