// Fuso da barbearia atual (padrao: Brasilia). Cada pagina chama setFuso() ao carregar a barbearia.
let TZ = 'America/Sao_Paulo';
export const setFuso = (z) => { if (z) TZ = z; };
export const getFuso = () => TZ;

export const hm = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
export const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
export const dataBR = (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ });
export const R = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');

// diferenca (em minutos) entre o fuso e UTC naquele instante
function offsetMin(tz, date) {
  const p = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(date);
  const g = (t) => +p.find((x) => x.type === t).value;
  return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second')) - Math.floor(date.getTime() / 1000) * 1000) / 60000;
}
// 'YYYY-MM-DD' + minutos desde 00:00 (no fuso da barbearia) -> Date correta
export const ts = (d, min) => {
  const [y, m, dd] = d.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, dd, 0, min);
  const o1 = offsetMin(TZ, new Date(guess));
  const o2 = offsetMin(TZ, new Date(guess - o1 * 60000));
  return new Date(guess - o2 * 60000);
};
export const inicioDia = (d) => ts(d, 0).toISOString();
export const fimDia = (d) => new Date(ts(d, 1440).getTime() - 1000).toISOString();
export const dataLonga = (iso) => new Date(iso).toLocaleString('pt-BR', { timeZone: TZ, dateStyle: 'full', timeStyle: 'short' });
export const stLabel = { agendado: 'Agendado', concluido: 'Concluído', cancelado: 'Cancelado', faltou: 'Faltou' };
