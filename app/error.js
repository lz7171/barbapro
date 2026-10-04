'use client';
export default function Erro({ error, reset }) {
  const cfg = /supabase|url|key/i.test(String(error && error.message));
  return (<div className="card"><h2>Algo deu errado</h2>
    <p>{cfg ? 'O site não encontrou a configuração do Supabase. Confira as variáveis de ambiente na Vercel e faça um novo deploy.' : 'Ocorreu um erro inesperado. Tente de novo.'}</p>
    <button onClick={() => reset()}>Tentar de novo</button></div>);
}
