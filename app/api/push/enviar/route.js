import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export async function POST(req) {
  const segredo = process.env.PUSH_WEBHOOK_SECRET;
  if (!segredo || req.headers.get('x-webhook-secret') !== segredo) return Response.json({ erro: 'negado' }, { status: 401 });
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, priv = process.env.VAPID_PRIVATE_KEY, url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pub || !priv || !url || !key) return Response.json({ erro: 'config' }, { status: 500 });
  let b; try { b = await req.json(); } catch { return Response.json({ erro: 'json' }, { status: 400 }); }
  const rec = b && b.record; if (!rec || !rec.shop_id) return Response.json({ erro: 'dados' }, { status: 400 });
  webpush.setVapidDetails('mailto:' + (process.env.VAPID_EMAIL || 'contato@exemplo.com'), pub, priv);
  const admin = createClient(url, key, { auth: { persistSession: false } });
  const { data: subs } = await admin.from('push_subs').select('*').eq('shop_id', rec.shop_id);
  await Promise.all((subs || []).map(async (s) => { try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ titulo: 'BarbaPro', texto: rec.texto }));
  } catch (e) { if (e.statusCode === 404 || e.statusCode === 410) await admin.from('push_subs').delete().eq('id', s.id); } }));
  return Response.json({ ok: true });
}
