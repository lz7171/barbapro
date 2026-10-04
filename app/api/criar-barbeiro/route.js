import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
const out = (erro, status) => Response.json({ erro }, { status });
export async function POST(req) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return out('Servidor sem configuração do Supabase.', 500);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  const { data: u } = await admin.auth.getUser(token);
  if (!u || !u.user) return out('Sessão inválida.', 401);
  const { data: me } = await admin.from('profiles').select('role,shop_id').eq('id', u.user.id).single();
  if (!me || me.role !== 'dono') return out('Sem permissão.', 403);
  const { data: ativa } = await admin.rpc('shop_ativa', { p: me.shop_id });
  if (!ativa) return out('Barbearia suspensa.', 403);
  let b; try { b = await req.json(); } catch { return out('Dados inválidos.', 400); }
  const email = String(b.email || '').trim().toLowerCase(), senha = String(b.senha || '');
  if (!/^\S+@\S+\.\S+$/.test(email) || senha.length < 8 || !b.staff_id) return out('Dados inválidos.', 400);
  const { data: sf } = await admin.from('staff').select('id,nome,profile_id').eq('id', b.staff_id).eq('shop_id', me.shop_id).maybeSingle();
  if (!sf) return out('Barbeiro não encontrado.', 404);
  if (sf.profile_id) return out('Este barbeiro já tem acesso.', 400);
  const { data: nu, error: e1 } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (e1 || !nu.user) return out(/registered|exists/i.test(e1?.message || '') ? 'Este e-mail já tem conta.' : 'Não foi possível criar o usuário.', 400);
  const { error: e2 } = await admin.from('profiles').insert({ id: nu.user.id, nome: sf.nome, role: 'barbeiro', shop_id: me.shop_id });
  if (e2) { await admin.auth.admin.deleteUser(nu.user.id); return out('Erro ao criar o perfil.', 500); }
  const { error: e3 } = await admin.from('staff').update({ profile_id: nu.user.id }).eq('id', sf.id);
  if (e3) { await admin.from('profiles').delete().eq('id', nu.user.id); await admin.auth.admin.deleteUser(nu.user.id); return out('Erro ao vincular.', 500); }
  return Response.json({ ok: true });
}
