/// <reference lib="webworker" />

import {clientsClaim} from 'workbox-core';
import {precacheAndRoute, createHandlerBoundToURL} from 'workbox-precaching';
import {registerRoute, NavigationRoute} from 'workbox-routing';
import {NetworkFirst} from 'workbox-strategies';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
self.skipWaiting();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

registerRoute(
  ({url}) => /^https:\/\/.*\.supabase\.co\/.*/i.test(url.href),
  new NetworkFirst({cacheName: 'supabase-api', networkTimeoutSeconds: 10}),
);

const queueStore = 'focus-buddy-offline-queue';

async function openQueue() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open('focus-buddy-pwa', 1);
    req.onupgradeneeded = () => req.result.createObjectStore(queueStore, {keyPath: 'id', autoIncrement: true});
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function enqueueRequest(request: Request) {
  const clone = request.clone();
  const headers = [...clone.headers.entries()];
  const body = await clone.text();
  const db = await openQueue();
  const tx = db.transaction(queueStore, 'readwrite');
  tx.objectStore(queueStore).add({url: clone.url, method: clone.method, headers, body, createdAt: Date.now()});
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function replayQueue() {
  const db = await openQueue();
  const items = await new Promise<any[]>((resolve, reject) => {
    const tx = db.transaction(queueStore, 'readonly');
    const req = tx.objectStore(queueStore).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of items) {
    try {
      const res = await fetch(item.url, {method: item.method, headers: item.headers, body: item.body});
      if (!res.ok) continue;
      const tx = db.transaction(queueStore, 'readwrite');
      tx.objectStore(queueStore).delete(item.id);
    } catch {
      break;
    }
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  const shouldQueue =
    request.method === 'POST' &&
    (url.pathname === '/api/sessions' || url.pathname === '/api/tasks');

  if (!shouldQueue) return;

  event.respondWith(
    fetch(request.clone()).catch(async () => {
      await enqueueRequest(request);
      await (self.registration as any).sync?.register?.('focus-buddy-replay').catch(() => undefined);
      return new Response(JSON.stringify({queued: true}), {
        status: 202,
        headers: {'Content-Type': 'application/json'},
      });
    }),
  );
});

self.addEventListener('sync', event => {
  if (event.tag === 'focus-buddy-replay') event.waitUntil(replayQueue());
});

self.addEventListener('online', () => {
  replayQueue();
});

self.addEventListener('push', event => {
  const payload = event.data?.json?.() || {
    title: 'Focus Buddy',
    body: event.data?.text() || 'Time to focus.',
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Focus Buddy', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: {url: payload.url || '/'},
      actions: [
        {action: 'open', title: 'Open App'},
        {action: 'dismiss', title: 'Dismiss'},
      ],
    } as NotificationOptions),
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || '/'));
});
