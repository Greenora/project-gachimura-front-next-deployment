self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let partyId;
  try { partyId = event.data?.json()?.partyId; } catch { /* Show a generic notification for malformed data. */ }
  const validParty = Number.isSafeInteger(partyId) && partyId > 0;
  event.waitUntil(self.registration.showNotification('가치무라', {
    body: '새 채팅 메시지가 도착했습니다.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: validParty ? `party-${partyId}` : 'new-chat',
    data: { url: validParty ? `/chat/${partyId}` : '/chats' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  let target = new URL('/chats', self.location.origin);
  try {
    const candidate = new URL(event.notification.data?.url, self.location.origin);
    const match = candidate.pathname.match(/^\/chat\/([1-9]\d*)$/);
    if (candidate.origin === self.location.origin && match && Number.isSafeInteger(Number(match[1]))) {
      target = new URL(candidate.pathname, self.location.origin);
    }
  } catch { /* Keep the safe chat-list destination. */ }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const existing = windows.find(client => new URL(client.url).origin === self.location.origin);
    if (existing) {
      try {
        const navigated = await existing.navigate(target.href);
        return await (navigated || existing).focus();
      } catch { /* The window may have closed after the notification was clicked. */ }
    }
    return self.clients.openWindow(target.href);
  })());
});
