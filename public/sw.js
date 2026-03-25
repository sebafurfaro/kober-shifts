/* global self, clients */
/**
 * PWA: fetch (instalable), Web Push y notificaciones.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  const defaults = {
    title: "Turnos Nodo",
    body: "",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
  };
  let title = defaults.title;
  const options = {
    body: "",
    icon: defaults.icon,
    badge: defaults.badge,
    vibrate: [100, 50, 100],
    data: {
      url: "/",
      dateOfArrival: Date.now(),
      primaryKey: "1",
    },
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options.body = typeof data.body === "string" ? data.body : "";
      if (data.icon) options.icon = data.icon;
      if (data.badge) options.badge = data.badge;
      if (data.data && typeof data.data === "object") {
        options.data = { ...options.data, ...data.data };
      }
      if (typeof data.url === "string") {
        options.data.url = data.url;
      }
    } catch {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const rawUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";
  const fullUrl = new URL(rawUrl, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(fullUrl);
      }
    })
  );
});
