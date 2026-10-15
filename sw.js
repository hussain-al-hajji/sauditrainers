/* عامل الخدمة: يستقبل إشعارات الجوال (Web Push عبر FCM) ويعرضها حتى لو أُغلقت الصفحة.
 * الرسالة المرسلة من الأتمتة بيانات فقط: { title, body, url }. إن كانت الصفحة مفتوحة ومرئية تُمرَّر إليها لتعرضها داخلياً. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});   // يلزم لتثبيت التطبيق على بعض المتصفحات
self.addEventListener('push', e => {
  let p = {}; try { p = e.data ? e.data.json() : {}; } catch { p = { body: e.data ? e.data.text() : '' }; }
  const d = p.data || p.notification || p, title = d.title || 'مدرّبون سعوديّون', body = d.body || '', url = d.url || './#/me';
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const seen = cs.find(c => c.visibilityState === 'visible');
    if (seen) { seen.postMessage({ type: 'st-push', title, body, url }); return; }
    await self.registration.showNotification(title, { body, icon: 'assets/icon-192.png', badge: 'assets/icon-192.png', dir: 'rtl', lang: 'ar', tag: d.tag || 'st', data: { url } });
  })());
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || './#/me', self.registration.scope).href;
  e.waitUntil((async () => {
    const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const c = cs.find(x => x.url.startsWith(self.registration.scope));
    if (c) { await c.focus(); try { await c.navigate(url); } catch { /* ignore */ } } else await self.clients.openWindow(url);
  })());
});
