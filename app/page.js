'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
const F = [['Agenda online', 'Seu cliente escolhe serviço, barbeiro e horário pelo site, sem precisar chamar no WhatsApp. Horário ocupado não aparece.'],
  ['Equipe completa', 'Cadastre quantos barbeiros quiser, com horários, intervalos, folgas e comissão de cada um.'],
  ['Serviços com foto', 'Monte sua galeria. O cliente escolhe pela foto e o valor já fica registrado no atendimento.'],
  ['Entradas e saídas', 'Caixa, comissões e relatórios por período, com exportação em planilha e PDF.'],
  ['Avisos na hora', 'Novo agendamento, cancelamento ou remarcação aparecem no painel e no seu aparelho.'],
  ['Painel por barbearia', 'Cada barbearia tem seu espaço, seus dados e seus acessos, totalmente separados das outras.']];
export default function Home() {
  const [shops, setShops] = useState([]);
  useEffect(() => { try { sb().from('shops').select('nome,slug').eq('status', 'ativa').order('nome').then(({ data }) => setShops(data || []), () => {}); } catch (e) { /* sem configuração */ } }, []);
  return (<div>
    <section className="hero"><h1>Sua barbearia com agenda e caixa em ordem.</h1>
      <p>Agendamento online sem WhatsApp, equipe, serviços com foto e controle de tudo que entra e sai, em um só painel.</p>
      <Link href="/orcamento" className="btn w">Pedir orçamento</Link>{' '}<Link href="/#agendar" className="btn o">Agendar um horário</Link></section>
    <h2 className="sec">Tudo que sua barbearia precisa</h2>
    <div className="grid3">{F.map(([t, d]) => (<div className="feat" key={t}><h3>{t}</h3><p>{d}</p></div>))}</div>
    <h2 className="sec" id="agendar">Agende seu horário</h2>
    <div className="card">{shops.map((x) => (<div className="row" key={x.slug}><span>{x.nome}</span><Link href={'/b/' + x.slug} className="btn">Agendar</Link></div>))}
      {!shops.length && <small>Nenhuma barbearia disponível no momento.</small>}</div>
    <section className="hero" style={{ marginTop: 44, marginBottom: 0 }}><h2 style={{ fontSize: 30, margin: 0 }}>Tem uma barbearia?</h2>
      <p style={{ marginTop: 10 }}>Peça um orçamento e leve a gestão profissional para o seu negócio.</p><Link href="/orcamento" className="btn w">Pedir orçamento</Link></section></div>);
}
