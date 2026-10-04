'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
export default function Home() {
  const [shops, setShops] = useState([]);
  useEffect(() => { sb().from('shops').select('nome,slug').eq('status', 'ativa').order('nome').then(({ data }) => setShops(data || [])); }, []);
  return (<div><div className="card"><div className="bar" /><h1>BarbaPro</h1>
    <p>Agenda online, equipe, serviços com foto e controle de entradas e saídas para a sua barbearia.</p>
    <p><Link href="/orcamento">Pedir orçamento</Link> · <Link href="/login">Entrar</Link></p></div>
    {shops.length > 0 && <div className="card"><h3>Agende seu horário</h3>{shops.map((x) => (<div className="row" key={x.slug}><span>{x.nome}</span><Link href={'/b/' + x.slug}>Agendar</Link></div>))}</div>}</div>);
}
