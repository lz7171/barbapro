'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
export default function Header() {
  const [role, setRole] = useState(null);
  useEffect(() => { try { const s = sb(); s.auth.getSession().then(async ({ data }) => {
    if (!data.session) return;
    const { data: p } = await s.from('profiles').select('role').eq('id', data.session.user.id).single(); setRole(p ? p.role : null); }); } catch (e) { /* sem configuração */ } }, []);
  const painel = role === 'super_admin' ? '/admin' : role === 'barbeiro' ? '/barbeiro' : '/dono';
  return (<header className="top"><div><Link href="/" className="logo">BARBAPRO</Link>
    <nav><Link href="/">Início</Link><Link href="/#agendar">Agendar</Link><Link href="/orcamento">Orçamento</Link>
      {role ? <Link href={painel} className="cta">Meu painel</Link> : <Link href="/login" className="cta">Entrar</Link>}</nav></div></header>);
}
