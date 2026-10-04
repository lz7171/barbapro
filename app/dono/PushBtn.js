'use client';
import { useEffect, useState } from 'react';
import { sb } from '../../lib/supabase';
const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const b64 = (k) => { const s = (k + '='.repeat((4 - (k.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(s), (c) => c.charCodeAt(0)); };
export default function PushBtn({ shopId }) {
  const [st, setSt] = useState('idle');
  useEffect(() => { if (!KEY || !('serviceWorker' in navigator) || !('PushManager' in window)) setSt('off'); }, []);
  async function ativar() { try {
    if ((await Notification.requestPermission()) !== 'granted') { setSt('neg'); return; }
    const reg = await navigator.serviceWorker.register('/sw.js'); await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(KEY) }); const j = sub.toJSON();
    const { data } = await sb().auth.getSession();
    const { error } = await sb().from('push_subs').upsert({ profile_id: data.session.user.id, shop_id: shopId, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth }, { onConflict: 'endpoint' });
    setSt(error ? 'err' : 'on'); } catch (e) { setSt('err'); } }
  if (st === 'off') return <p><small>Avisos com a aba fechada indisponíveis neste navegador.</small></p>;
  if (st === 'on') return <p className="ok">Avisos ativados neste aparelho.</p>;
  return (<p><button className="g" onClick={ativar}>Ativar avisos neste aparelho</button>{st === 'neg' && <span className="err"> Permissão negada no navegador.</span>}{st === 'err' && <span className="err"> Não foi possível ativar.</span>}</p>);
}
