self.addEventListener('push', (e) => { let d = {}; try { d = e.data.json(); } catch (x) {}
  e.waitUntil(self.registration.showNotification(d.titulo || 'BarbaPro', { body: d.texto || '' })); });
self.addEventListener('notificationclick', (e) => { e.notification.close(); e.waitUntil(clients.openWindow('/dono')); });
