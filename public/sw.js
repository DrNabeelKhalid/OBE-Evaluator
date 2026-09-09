// Service Worker for OBE CLO Evaluator EED PWA
const CACHE_NAME = 'obe-clo-evaluator-v1';
const ASSETS = [
  '../index.html',
  '../css/custom.css',
  '../js/constants.js',
  '../js/gemini.js',
  '../js/pdf-export.js',
  '../js/app.js',
  './manifest.json',
  './assets/FOE_Logo_WBG.png',
  './assets/logo.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests, bypass API calls to Google
  if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
