// service-worker.js – macht Vokiko offline-fähig
//
// Der Service Worker sitzt zwischen App und Internet und entscheidet bei jeder Anfrage:
// - Eigene Dateien: zuerst aus dem Netz (immer der neueste Stand), dabei in den Cache legen.
//   Ohne Netz kommen sie aus dem Cache.
// - Fremde Dateien (Schrift von Google, Tesseract vom CDN): zuerst aus dem Cache, denn die
//   ändern sich nie (feste Versionsnummer).
//
// WICHTIG: Neue Dateien der App in APP_DATEIEN eintragen, sonst fehlen sie offline beim ersten Start.

const APP_CACHE = 'vokiko-app-v1';      // bei größeren Umbauen hochzählen → alter Cache wird gelöscht
const FREMD_CACHE = 'vokiko-fremd-v1';
const FREMDE_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.jsdelivr.net', 'tessdata.projectnaptha.com'];

const APP_DATEIEN = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'js/app.js',
  'js/db.js',
  'js/history.js',
  'js/ocr.js',
  'js/parser.js',
  'js/quiz.js',
  'js/speech.js',
  'js/utils.js',
  'js/screens/book.js',
  'js/screens/history.js',
  'js/screens/import.js',
  'js/screens/practice.js',
  'js/screens/shelf.js',
  'js/screens/start.js',
  'js/screens/unit.js',
  'js/ui/dialog.js',
  'js/ui/icons.js',
  'js/ui/installieren.js',
  'js/ui/kiko.js',
  'js/ui/konfetti.js',
  'js/ui/thema.js',
];

// Installieren: alle App-Dateien frisch vom Server holen und ablegen
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    await cache.addAll(APP_DATEIEN.map((url) => new Request(url, { cache: 'reload' })));
    await self.skipWaiting(); // neue Version sofort aktiv, nicht erst nach Schließen aller Tabs
  })());
});

// Aktivieren: Caches alter Versionen aufräumen und offene Seiten sofort übernehmen
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const namen = await caches.keys();
    await Promise.all(namen
      .filter((n) => n !== APP_CACHE && n !== FREMD_CACHE)
      .map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const anfrage = event.request;
  if (anfrage.method !== 'GET') return;
  const url = new URL(anfrage.url);
  if (url.origin === self.location.origin) {
    event.respondWith(netzZuerst(anfrage));
  } else if (FREMDE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheZuerst(anfrage));
  }
  // alles andere: normal übers Netz, ohne Service Worker
});

async function netzZuerst(anfrage) {
  const cache = await caches.open(APP_CACHE);
  try {
    // no-cache: beim Server nachfragen, ob es eine neuere Fassung gibt (sonst kurze 304-Antwort)
    const antwort = await fetch(new Request(anfrage.url, { cache: 'no-cache', credentials: 'same-origin' }));
    if (antwort.ok) cache.put(anfrage.url, antwort.clone());
    return antwort;
  } catch {
    // Offline: aus dem Cache. Jede Seitenadresse (z. B. ./#/regal) zeigt auf die Startdatei.
    const treffer = await cache.match(anfrage.url, { ignoreSearch: true })
      || (anfrage.mode === 'navigate' ? await cache.match('./') : undefined);
    return treffer || Response.error();
  }
}

async function cacheZuerst(anfrage) {
  const cache = await caches.open(FREMD_CACHE);
  const treffer = await cache.match(anfrage);
  if (treffer) return treffer;
  const antwort = await fetch(anfrage);
  // „opaque“ = Datei von fremder Seite ohne Einblick (z. B. per <script>) – darf trotzdem in den Cache
  if (antwort.ok || antwort.type === 'opaque') cache.put(anfrage, antwort.clone());
  return antwort;
}
