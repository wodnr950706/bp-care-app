self.addEventListener('install', (event) => {
  console.log('[Debug SW] Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Debug SW] Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  console.log('[Debug SW] Notification clicked:', event.notification.tag || 'no-tag', 'Action:', event.action);
  event.notification.close();
  
  const baseUrl = self.location.origin;
  let targetUrl = baseUrl;

  // Handle specific actions
  if (event.action === 'check_sugar') {
    targetUrl = `${baseUrl}?action=record&type=bloodSugar`;
  } else if (event.action === 'take_med') {
    targetUrl = `${baseUrl}?action=med_taken&id=${event.notification.tag}`;
  }

  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(baseUrl) && 'focus' in client) {
          // Send message to client if needed
          if (event.action) {
            client.postMessage({
              type: 'NOTIFICATION_ACTION',
              action: event.action,
              tag: event.notification.tag
            });
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
