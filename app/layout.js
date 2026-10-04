import './globals.css';
export const metadata = { title: 'BarbaPro', description: 'Gestão para barbearias' };
export default function RootLayout({ children }) {
  return (<html lang="pt-BR"><body><main>{children}</main></body></html>);
}
