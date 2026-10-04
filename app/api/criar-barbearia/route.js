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
  const { data: me } = await admin.from('profiles').select('role').eq('id', u.user.id).single();
  if (!me || me.role !== 'super_admin') return out('Sem permissão.', 403);
  let b; try { b = await req.json(); } catch { return out('Dados inválidos.', 400); }
  const nome = String(b.nome || '').trim(), email = String(b.email || '').trim().toLowerCase(), senha = String(b.senha || '');
  if (nome.length < 2 || nome.length > 80 || !/^\S+@\S+\.\S+$/.test(email) || senha.length < 8) return out('Dados inválidos.', 400);
  const base = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'barbearia';
  const slug = base + '-' + Math.random().toString(36).slice(2, 6);
  const { data: nu, error: e1 } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
  if (e1 || !nu.user) return out(/registered|exists/i.test(e1?.message || '') ? 'Este e-mail já tem conta.' : 'Não foi possível criar o usuário.', 400);
  const { data: shop, error: e2 } = await admin.from('shops').insert({ nome, slug }).select('id').single();
  if (e2) { await admin.auth.admin.deleteUser(nu.user.id); return out('Erro ao criar a barbearia.', 500); }
  const { error: e3 } = await admin.from('profiles').insert({ id: nu.user.id, nome, role: 'dono', shop_id: shop.id });
  if (e3) { await admin.from('shops').delete().eq('id', shop.id); await admin.auth.admin.deleteUser(nu.user.id); return out('Erro ao criar o perfil.', 500); }
  return Response.json({ ok: true, shop_id: shop.id });
}
