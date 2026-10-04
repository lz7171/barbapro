import './globals.css';
import Link from 'next/link';
import Header from './Header';
export const metadata = { title: 'BarbaPro | Gestão para barbearias', description: 'Agenda online, equipe, serviços e financeiro para barbearias.' };
export default function RootLayout({ children }) {
  return (<html lang="pt-BR"><body><Header /><main>{children}</main>
    <footer className="foot">BarbaPro · Gestão para barbearias · <Link href="/termos">Termos e privacidade</Link></footer></body></html>);
}
