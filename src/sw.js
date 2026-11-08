// Service Worker: macht die App offline nutzbar. Das ist kein Beiwerk - in der
// Halle ist der Empfang oft schlecht, und die Freigabe muss trotzdem da sein.
//
// Bei jeder Änderung an den Dateien die VERSION erhöhen, sonst behalten bereits
// installierte Geräte den alten Stand.

const VERSION = 'patella-v6';

const DATEIEN = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './plan-data.js',
  './logic.js',
  './storage.js',
  './chart.js',
  './state.js',
  './ui.js',
  './view-today.js',
  './view-overview.js',
  './view-reference.js',
  './view-woche.js',
  './datum.js',
  './schedule.js',
  './kalender.js',
  './vorlagen.js',
  './sprung-data.js',
  './sprung-logik.js',
  './sprung-state.js',
  './view-sprung.js',
  './view-sprung-plan.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', (ereignis) => {
  ereignis.waitUntil(
    caches.open(VERSION)
      // Einzeln, damit eine fehlende Datei nicht die ganze Installation kippt.
      .then((speicher) => Promise.all(
        DATEIEN.map((pfad) => speicher.add(new Request(pfad, { cache: 'reload' })).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

// Nach einem Update laufen offene Fenster noch mit den Dateien der alten
// Fassung (oft samt alter index.html aus dem Browser-Cache). Sie werden einmal
// neu geladen, damit sofort die neue Fassung laeuft und kein Wert unter der
// alten erfasst wird. navigate() gelingt erst, wenn die Aktivierung
// abgeschlossen ist; deshalb kurz danach, genau einmal (Chromium meldet auch
// erfolgreiche Neuladen teils als Fehler - eine Wiederholung lüde doppelt).
function fensterNeuLaden() {
  self.clients.matchAll({ type: 'window' })
    .then((fenster) => Promise.all(fenster.map((f) => f.navigate(f.url).catch(() => null))))
    .catch(() => {});
}

self.addEventListener('activate', (ereignis) => {
  const fertig = caches.keys()
    .then((namen) => {
      const alte = namen.filter((name) => name !== VERSION);
      return Promise.all(alte.map((name) => caches.delete(name))).then(() => alte.length > 0);
    })
    .then((warUpdate) => self.clients.claim().then(() => warUpdate));
  ereignis.waitUntil(fertig);
  // Bei der ersten Installation gibt es keine alte Fassung und nichts neu zu laden.
  fertig.then((warUpdate) => { if (warUpdate) setTimeout(fensterNeuLaden, 250); });
});

self.addEventListener('fetch', (ereignis) => {
  const anfrage = ereignis.request;
  if (anfrage.method !== 'GET') return;

  // Seitenaufruf: erst Netz versuchen, damit eine neue Fassung ankommt; ohne
  // Netz die gespeicherte Seite ausliefern.
  if (anfrage.mode === 'navigate') {
    ereignis.respondWith(
      fetch(anfrage)
        .then((antwort) => {
          caches.open(VERSION).then((speicher) => speicher.put('./index.html', antwort.clone()));
          return antwort;
        })
        .catch(() => caches.match('./index.html').then((treffer) => treffer ?? caches.match('./')))
    );
    return;
  }

  const url = new URL(anfrage.url);
  const eigeneHerkunft = url.origin === self.location.origin;

  if (eigeneHerkunft) {
    // Eigene Dateien: aus dem Speicher, im Hintergrund auffrischen.
    ereignis.respondWith(
      caches.match(anfrage).then((treffer) => {
        const ausDemNetz = fetch(anfrage)
          .then((antwort) => {
            if (antwort.ok) {
              caches.open(VERSION).then((speicher) => speicher.put(anfrage, antwort.clone()));
            }
            return antwort;
          })
          .catch(() => treffer);
        return treffer ?? ausDemNetz;
      })
    );
    return;
  }

  // Fremde Herkunft, praktisch nur die Schriften: Netz zuerst, sonst Speicher.
  // Fehlen sie, greifen die Ersatzschriften im Stylesheet.
  ereignis.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        caches.open(VERSION).then((speicher) => speicher.put(anfrage, antwort.clone()).catch(() => {}));
        return antwort;
      })
      .catch(() => caches.match(anfrage))
  );
});
