const CACHE_NAME = 'daychat-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/home']);
    }).then(() => {
      console.log('[SW] Cache opened successfully');
      return self.skipWaiting();
    })
  );
});

// Activate event
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
  console.log('[SW] ========== PUSH EVENT RECEIVED ==========');
  console.log('[SW] Event data available:', !!event.data);
  console.log('[SW] Event timestamp:', new Date().toISOString());

  let data = {};
  try {
    if (event.data) {
      const text = event.data.text();
      console.log('[SW] Raw push data (text):', text);
      console.log('[SW] Raw push data (length):', text.length);
      data = JSON.parse(text);
      console.log('[SW] Parsed push data:', JSON.stringify(data, null, 2));
    } else {
      console.log('[SW] No data in push event');
      data = { title: 'DayChat', body: 'New message' };
    }
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = { title: 'DayChat', body: 'New message' };
  }

  const title = data.title || 'DayChat';
  const body = data.body || 'New message in DayChat';
  
  console.log('[SW] Notification details:', { title, body });
  console.log('[SW] Browser:', navigator.userAgent);
  
  const options = {
    body: body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/home',
      roomId: data.roomId,
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'close', title: 'Close' },
    ],
    requireInteraction: true,
    silent: false,
    tag: 'daychat-message',
    renotify: true,
  };

  console.log('[SW] Calling showNotification with:', options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[SW] ✅✅✅ NOTIFICATION SHOWN SUCCESSFULLY ✅✅✅');
        // Notify all clients that notification was shown
        return self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_SHOWN',
              title,
              body
            });
          });
        });
      })
      .catch(err => {
        console.error('[SW] ❌❌❌ FAILED TO SHOW NOTIFICATION ❌❌❌');
        console.error('[SW] Error details:', err);
        console.error('[SW] Error name:', err.name);
        console.error('[SW] Error message:', err.message);
        
        // Try fallback
        console.log('[SW] Trying fallback notification...');
        return self.registration.showNotification('DayChat', {
          body: 'New message',
          data: { url: '/home' },
          requireInteraction: true
        }).then(() => {
          console.log('[SW] ✅ Fallback notification shown');
        }).catch(fallbackErr => {
          console.error('[SW] ❌ Fallback also failed:', fallbackErr);
        });
      })
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.title);
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

// Message handler for debugging
self.addEventListener('message', (event) => {
  console.log('[SW] Received message from client:', event.data);
  
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    console.log('[SW] Sending test notification...');
    self.registration.showNotification('Test from Client', {
      body: 'This is a test notification triggered from the client! ' + new Date().toLocaleTimeString(),
      requireInteraction: true
    }).then(() => {
      console.log('[SW] Test notification shown successfully');
      event.ports[0]?.postMessage({ success: true });
    }).catch(err => {
      console.error('[SW] Test notification failed:', err);
      event.ports[0]?.postMessage({ success: false, error: err.message });
    });
  }
});
