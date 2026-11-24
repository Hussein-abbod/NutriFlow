/*
 * Imported by the generated service worker (vite.config.ts → workbox.importScripts).
 * Tapping a NutriFlow notification focuses the open app, or opens the food log.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const app = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (app) {
        await app.focus();
        return;
      }
      await self.clients.openWindow('/food-log');
    })(),
  );
});
