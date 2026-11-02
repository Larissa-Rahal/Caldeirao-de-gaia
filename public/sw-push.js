// Service Worker — recebe notificações Web Push
// Este ficheiro é registado separadamente do SW do Vite PWA

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Caldeir�o de Gaia', body: event.data.text() } }

  const options = {
    body:    data.body    ?? '',
    icon:    data.icon    ?? '/pwa-192x192.png',
    badge:   data.badge   ?? '/pwa-192x192.png',
    vibrate: [100, 50, 100],
    data:    { url: data.url ?? '/' },
    actions: [{ action: 'open', title: 'Ver' }],
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Caldeir�o de Gaia', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Se já há uma janela aberta, foca-a
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      // Senão abre uma nova
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
