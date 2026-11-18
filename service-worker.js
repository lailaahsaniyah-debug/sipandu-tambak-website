
const CACHE_NAME = "sipandu-tambak-v3";

// File utama website
const CORE_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.webmanifest"
];

// Seluruh foto yang digunakan di website
const IMAGE_FILES = [
  "./images/sipandu-home.jpg",
  "./images/about-observation.jpg",
  "./images/about-field.jpg",
  "./images/about-development-1.jpg",
  "./images/about-development-2.jpg",
  "./images/about-development-3.jpg",
  "./images/about-development-4.jpg",
  "./images/iot-ph-sensor.jpg",
  "./images/iot-tds-sensor.jpg",
  "./images/iot-ds18b20-sensor.jpg",
  "./images/iot-circuit.jpg",
  "./images/iot-prototype.jpg",
  "./images/cv-camera-module.jpg",
  "./images/cv-fish-detection.jpg",
  "./images/journey-balai-benih-mijen.jpg",
  "./images/journey-field-discussion.jpg",
  "./images/journey-first-demo-usm.jpg",
  "./images/journey-monitoring-dashboard.jpg",
  "./images/journey-demo-kantin-usm.jpg",
  "./images/journey-project-evaluation.jpg",
  "./images/documentation-demo-usm.jpg",
  "./images/documentation-demo-mijen.jpg"
];

// INSTALL
self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // File utama wajib berhasil disimpan
      await cache.addAll(CORE_FILES);

      // Foto disimpan satu per satu agar satu foto yang gagal
      // tidak menggagalkan proses instalasi seluruh website
      await Promise.all(
        IMAGE_FILES.map(file =>
          cache.add(file).catch(error => {
            console.warn("Foto belum berhasil disimpan:", file, error);
          })
        )
      );

      await self.skipWaiting();
    })()
  );
});

// ACTIVATE
self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(name => name.startsWith("sipandu-tambak-") && name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

// FETCH
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Tidak menangani permintaan dari domain luar,
  // seperti Google Fonts
  if (url.origin !== self.location.origin) return;

  // Halaman utama: coba jaringan dahulu, lalu gunakan cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put("./index.html", copy);
          });
          return response;
        })
        .catch(async () => {
          return await caches.match(request) ||
                 await caches.match("./index.html");
        })
    );
    return;
  }

  // File lainnya: gunakan cache dahulu
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, copy);
          });
        }

        return response;
      });
    })
  );
});
