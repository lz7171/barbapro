import { ts } from './util';
const mn = (t) => { const [h, m] = t.split(':'); return +h * 60 + +m; };
// hs = horarios do barbeiro (vazio = padrao 09-18 todos os dias); folgas = lista de 'YYYY-MM-DD'
export function gerarSlots({ d, dur, busy, hs, folgas }) {
  if (!d || folgas.includes(d)) return [];
  let ini = 540, fim = 1080, ii = null, fi = null;
  if (hs.length) {
    const h = hs.find((x) => x.dia_semana === new Date(d + 'T12:00:00Z').getUTCDay());
    if (!h) return [];
    ini = mn(h.inicio); fim = mn(h.fim); if (h.int_ini) { ii = mn(h.int_ini); fi = mn(h.int_fim); }
  }
  const out = [], agora = Date.now();
  for (let m = ini; m + dur <= fim; m += 30) {
    if (ii !== null && m < fi && m + dur > ii) continue;
    const a = ts(d, m).getTime(), b = a + dur * 60000;
    if (a > agora && !busy.some((x) => a < new Date(x.ends_at).getTime() && b > new Date(x.starts_at).getTime())) out.push(m);
  }
  return out;
}
