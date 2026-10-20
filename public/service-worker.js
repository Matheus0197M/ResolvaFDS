const CACHE_PREFIX = "resolvafds-";
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const APP_SCOPE = self.registration.scope;
const APP_URL = (path) => new URL(path, APP_SCOPE).href;
const PRECACHE_URLS = [
  "index.html",
  "offline.html",
  "manifest.json",
  "src/css/style.css",
  "src/css/offline.css",
  "src/js/main.js",
  "src/js/api.js",
  "src/js/dom.js",
  "src/js/pwa.js",
  "src/js/components/tutorial.js",
  "src/js/components/youtube.js",
  "assets/face-smile-solid-full.svg",
  "assets/arrow-left-solid-full.svg",
  "assets/angle-right-solid-full.svg",
  "assets/bars-solid-full.svg",
  "assets/bars-staggered-solid-full.svg",
  "assets/house-solid-full.svg",
  "assets/moon-solid-full.svg",
  "assets/sun-solid-full.svg",
  "assets/Rfds-192px.png",
  "assets/Rfds512px.png",
  "assets/icon-maskable.png",
  "data/index.json",
  "data/tutoriais/caixa-acoplada-vazando.json",
  "data/tutoriais/pia-de-cozinha-entupida.json",
  "data/tutoriais/porta-raspando-no-piso.json",
  "data/tutoriais/ralo-do-banheiro-entupido.json",
  "data/tutoriais/tomada-sem-energia-ou-frouxa.json",
  "data/tutoriais/torneira-pingando.json",
  "data/tutoriais/vaso-entupido.json",
  "data/tutoriais/vazamento-de-agua-geral.json",
  "data/tutoriais/vazamento-sob-a-pia.json",
].map(APP_URL);

async function guardarNoCache(request, response) {
  if (response.ok && response.type === "basic") {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function buscarNoCache(request) {
  const cache = await caches.open(CACHE_NAME);
  return cache.match(request);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (
    request.method !== "GET" ||
    requestUrl.origin !== self.location.origin ||
    !requestUrl.href.startsWith(APP_SCOPE)
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const scopePath = new URL(APP_SCOPE).pathname;
          const indexPath = new URL(APP_URL("index.html")).pathname;
          if (
            requestUrl.pathname === scopePath ||
            requestUrl.pathname === indexPath
          ) {
            return guardarNoCache(APP_URL("index.html"), response);
          }
          return response;
        })
        .catch(async () =>
          (await buscarNoCache(APP_URL("index.html"))) ||
          (await buscarNoCache(APP_URL("offline.html")))
        )
    );
    return;
  }

  if (requestUrl.pathname.includes("/data/")) {
    event.respondWith(
      fetch(request)
        .then((response) => guardarNoCache(request, response))
        .catch(async () => {
          const cached = await buscarNoCache(request);
          if (cached) return cached;
          return Response.error();
        })
    );
    return;
  }

  event.respondWith(
    buscarNoCache(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => guardarNoCache(request, response));
    })
  );
});