// プッシュ通知を受信したとき
self.addEventListener('push', (event) => {
  let data = {
    title: '体操のお時間です！',
    body: '音楽でも流しながら始めよう',
    url: 'https://youtu.be/al3CoAGcrTE?si=1-vE7lpdVhE1WRBd&t=57'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: 'https://via.placeholder.com/192',
    data: {
      url: data.url || 'https://youtu.be/al3CoAGcrTE?si=1-vE7lpdVhE1WRBd&t=57'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 通知がタップされたとき（URLを開く）
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data.url || 'https://www.htvgr.com';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 既に開いていればフォーカス、無ければ新規タブで開く
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
