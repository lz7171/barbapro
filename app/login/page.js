'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { sb } from '../../lib/supabase';
export default function Login() {
  const r = useRouter(); const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function entrar() {
    setBusy(true); setMsg(''); const s = sb();
    const { data, error } = await s.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) { setMsg('E-mail ou senha incorretos.'); setBusy(false); return; }
    const { data: p } = await s.from('profiles').select('role,shop_id').eq('id', data.user.id).single();
    if (!p) { await s.auth.signOut(); setMsg('Conta sem perfil. Fale com o suporte.'); setBusy(false); return; }
    if (p.role !== 'super_admin') {
      const { data: okShop } = await s.rpc('shop_ativa', { p: p.shop_id });
      if (!okShop) { await s.auth.signOut(); setMsg('Conta suspensa. Fale com o suporte.'); setBusy(false); return; }
    }
    r.replace(p.role === 'super_admin' ? '/admin' : p.role === 'barbeiro' ? '/barbeiro' : '/dono');
  }
  return (<div className="card" style={{ maxWidth: 380, margin: 'auto' }}><h2>Entrar</h2>
    <input type="email" placeholder="E-mail" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
    <input type="password" placeholder="Senha" autoComplete="current-password" value={senha}
      onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && entrar()} />
    <button disabled={busy} onClick={entrar}>{busy ? 'Entrando...' : 'Entrar'}</button>
    <p className="err" role="alert">{msg}</p></div>);
}
