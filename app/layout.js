import './globals.css';
import Link from 'next/link';
import Header from './Header';
export const metadata = {
  title: { default: 'BarbaPro | Agenda e gestão para barbearias', template: '%s | BarbaPro' },
  description: 'Agendamento online, equipe, serviços com foto e financeiro da sua barbearia em um painel só.' };
export const viewport = { themeColor: '#0e1b33' };
export default function RootLayout({ children }) {
  return (<html lang="pt-BR"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500..800&family=Figtree:wght@400;500;600;700&display=swap" /></head>
    <body><Header /><main>{children}</main>
      <footer className="foot"><div><span><b>BarbaPro</b> - gestão para barbearias</span>
        <nav><Link href="/orcamento">Pedir orçamento</Link><Link href="/termos">Termos e privacidade</Link><Link href="/login">Entrar</Link></nav></div></footer></body></html>);
}
