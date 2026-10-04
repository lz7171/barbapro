'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { sb } from '../lib/supabase';
const AGENDA = [['09:00', 'Rafael Dias', 'Corte e barba', 'Marcos', 'concluido'], ['10:00', 'Bruno Alves', 'Corte', 'Marcos', 'concluido'],
  ['10:30', 'Caio Mendes', 'Barba', 'Diego', 'agendado'], ['11:30', 'Lucas Prado', 'Corte e sobrancelha', 'Diego', 'agendado']];
const NOME = { concluido: 'Concluído', agendado: 'Agendado' };
const F = [['Agenda online', 'Seu cliente escolhe serviço, barbeiro e horário pelo celular. Horário ocupado não aparece, e ninguém marca em cima de ninguém.', true],
  ['Equipe completa', 'Cadastre os barbeiros com horário de trabalho, intervalo, folgas e comissão de cada um.'],
  ['Serviços com foto', 'Monte a vitrine da barbearia. O cliente escolhe pela foto, e o preço fica registrado no atendimento.'],
  ['Caixa e comissões', 'Entradas, saídas e comissão por barbeiro em qualquer período, com exportação em planilha e PDF.'],
  ['Avisos na hora', 'Novo agendamento, cancelamento ou remarcação chegam no painel e no celular.'],
  ['Um painel para cada barbearia', 'Dados e acessos de cada barbearia ficam separados das outras.']];
const PASSOS = [['Peça o orçamento', 'Conte o tamanho da barbearia e receba uma proposta.'],
  ['Cadastre equipe e serviços', 'Barbeiros, horários, preços e fotos, tudo pelo painel.'],
  ['Divulgue o seu link', 'A barbearia ganha um endereço próprio de agendamento para colocar no Instagram e no WhatsApp.']];
export default function Home() {
  const [shops, setShops] = useState([]);
  useEffect(() => { try { sb().from('shops').select('nome,slug').eq('status', 'ativa').order('nome').then(({ data }) => setShops(data || []), () => {}); } catch (e) { /* sem configuração */ } }, []);
  return (<>
    <section className="hero full"><div className="in">
      <div><h1>Agenda cheia e caixa em dia, sem caderno nem WhatsApp.</h1>
        <p>O BarbaPro reúne agendamento online, equipe, serviços e financeiro da sua barbearia em um painel só.</p>
        <div className="acts"><Link href="/orcamento" className="btn red">Pedir orçamento</Link><Link href="/#agendar" className="btn o">Agendar um horário</Link></div></div>
      <div className="mock" role="img" aria-label="Exemplo da agenda do dia no painel do BarbaPro">
        <div className="mock-h"><b>Agenda de hoje</b><span className="tag agendado">2 a atender</span></div>
        {AGENDA.map(([h, c, s, b, st]) => (<div className="mock-r" key={h}><time>{h}</time><div><span><b>{c}</b></span><small>{s}, com {b}</small></div><span className={'tag ' + st}>{NOME[st]}</span></div>))}
        <div className="mock-f"><small>Caixa do dia</small><b>R$ 85,00</b></div></div></div></section>

    <section className="band full"><div className="in feat-wrap">
      <div className="lead"><h2>Tudo que a barbearia precisa, num lugar só.</h2><p>Menos mensagem para responder, menos horário vago e mais clareza sobre o dinheiro do mês.</p>
        <Link href="/orcamento" className="btn">Pedir orçamento</Link></div>
      <div>{F.map(([t, d, chips]) => (<div className="feat" key={t}><h3>{t}</h3><p>{d}</p>
        {chips && <div className="chips" aria-hidden="true">{['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'].map((h) => <button type="button" tabIndex={-1} key={h} className={'chip' + (h === '09:30' || h === '10:30' ? ' x' : h === '10:00' ? ' on' : '')}>{h}</button>)}</div>}</div>))}</div></div></section>

    <section className="band alt full"><div className="in"><h2>Como começar</h2>
      <div className="steps">{PASSOS.map(([t, d]) => (<div key={t}><h3>{t}</h3><p>{d}</p></div>))}</div></div></section>

    <section className="band full" id="agendar"><div className="in"><h2>Agende seu horário</h2><p style={{ color: 'var(--mu)', margin: 0 }}>Escolha a barbearia e marque pelo site, sem precisar ligar.</p>
      <div className="card shops">{shops.map((x) => (<div className="row" key={x.slug}><b>{x.nome}</b><Link href={'/b/' + x.slug} className="btn">Agendar horário</Link></div>))}
        {!shops.length && <p style={{ margin: 0 }}>Nenhuma barbearia disponível no momento. Tem uma barbearia? <Link href="/orcamento">Peça um orçamento</Link> e entre no BarbaPro.</p>}</div></div></section>

    <section className="cta-band full"><div className="in"><div><h2>Tem uma barbearia?</h2><p>Leve agenda online e controle financeiro para o seu negócio.</p></div>
      <Link href="/orcamento" className="btn red">Pedir orçamento</Link></div></section></>);
}
