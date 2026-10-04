// Cria (ou atualiza) a conta de Super Admin do BarbaPro.
// Uso:
//   ADMIN_EMAIL=voce@email.com ADMIN_SENHA='sua-senha' node --env-file=.env.local scripts/criar-admin.mjs
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase(), senha = process.env.ADMIN_SENHA || '';
if (!url || !key) { console.error('Faltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (use --env-file=.env.local).'); process.exit(1); }
if (!/^\S+@\S+\.\S+$/.test(email) || senha.length < 8) { console.error('Informe ADMIN_EMAIL valido e ADMIN_SENHA com 8+ caracteres.'); process.exit(1); }

const admin = createClient(url, key, { auth: { persistSession: false } });
let id;
const { data: novo, error } = await admin.auth.admin.createUser({ email, password: senha, email_confirm: true });
if (novo?.user) id = novo.user.id;
else if (/registered|exists/i.test(error?.message || '')) {
  const { data: lista } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const u = lista?.users?.find((x) => x.email === email);
  if (!u) { console.error('Usuario existe mas nao foi encontrado.'); process.exit(1); }
  id = u.id;
  const { error: e2 } = await admin.auth.admin.updateUserById(id, { password: senha, email_confirm: true });
  if (e2) { console.error('Nao foi possivel atualizar a senha:', e2.message); process.exit(1); }
} else { console.error('Erro ao criar usuario:', error?.message); process.exit(1); }

const { error: e3 } = await admin.from('profiles').upsert({ id, nome: 'Super Admin', role: 'super_admin', shop_id: null });
if (e3) { console.error('Erro ao criar o perfil (rodou o supabase_schema.sql?):', e3.message); process.exit(1); }
console.log('Super Admin pronto. Entre em /login com', email);
