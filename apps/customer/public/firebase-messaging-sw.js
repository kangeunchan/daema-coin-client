/* global self, URL */

self.addEventListener("push", (event) => {
  let payload;
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const notification = payload.notification || {};
  const data = payload.data || {};
  const link =
    payload.fcmOptions?.link || payload.fcm_options?.link || data.link || "/booth/orders";
  const title = notification.title || data.title || "대마코인";
  const options = {
    body: notification.body || data.message || data.body || "",
    data: { link },
    icon: "/daema-logo.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification.data?.link || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(link, self.location.origin);
        if (clientUrl.origin === targetUrl.origin) {
          client.focus();
          return client.navigate(targetUrl.href);
        }
      }

      return self.clients.openWindow(link);
    }),
  );
});
