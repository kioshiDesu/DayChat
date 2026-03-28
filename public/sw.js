const CACHE_NAME = 'daychat-v1';

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/home',
      ]);
    }).then(() => {
      console.log('[SW] Cache opened successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      console.log('[SW] Old caches cleaned');
      return self.clients.claim();
    })
  );
});

// Push event - show notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = {};
  try {
    data = event.data?.json() || {};
    console.log('[SW] Push data:', JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = { title: 'DayChat', body: 'New message' };
  }

  const options = {
    body: data.body || 'New message in DayChat',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/home',
      roomId: data.roomId,
    },
    actions: [
      {
        action: 'open',
        title: 'Open',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  console.log('[SW] Showing notification:', options.title || 'DayChat');
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'DayChat', options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
      })
      .catch(err => {
        console.error('[SW] Failed to show notification:', err);
      })
  );
});

// Notification click - open app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    const urlToOpen = event.notification.data?.url || '/home';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          for (let client of windowClients) {
            if (client.url === urlToOpen && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
  }
});
