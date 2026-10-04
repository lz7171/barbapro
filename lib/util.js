export const TZ = 'America/Sao_Paulo';
export const hm = (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
export const hoje = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ });
export const R = (v) => 'R$ ' + Number(v || 0).toFixed(2).replace('.', ',');
// Brasil nao usa horario de verao desde 2019: offset fixo -03:00
export const ts = (d, min) => new Date(`${d}T${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:00-03:00`);
