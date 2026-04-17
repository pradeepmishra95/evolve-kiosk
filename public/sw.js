const STATIC_CACHE = "evolve-kiosk-static-v1"
const PAGE_CACHE = "evolve-kiosk-pages-v1"
const RUNTIME_CACHE = "evolve-kiosk-runtime-v1"
const OFFLINE_URL = "/offline.html"

const PRECACHE_URLS = [
 OFFLINE_URL,
 "/",
 "/manifest.webmanifest",
 "/icons/apple-touch-icon.png",
 "/icons/icon-192x192.png",
 "/icons/icon-512x512.png",
 "/icons/icon-512x512-maskable.png",
 "/upi-qr-placeholder.svg"
]

self.addEventListener("install", (event) => {
 event.waitUntil(
  (async () => {
   const cache = await caches.open(STATIC_CACHE)

   await Promise.all(
    PRECACHE_URLS.map(async (url) => {
     try {
      await cache.add(url)
     } catch (error) {
      console.warn("Precache failed for", url, error)
     }
    })
   )

   await self.skipWaiting()
  })()
 )
})

self.addEventListener("activate", (event) => {
 event.waitUntil(
  (async () => {
   const cacheKeys = await caches.keys()
   const validCaches = new Set([STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE])

   await Promise.all(
    cacheKeys
     .filter((cacheKey) => !validCaches.has(cacheKey))
     .map((cacheKey) => caches.delete(cacheKey))
   )

   if ("navigationPreload" in self.registration) {
    await self.registration.navigationPreload.enable()
   }

   await self.clients.claim()
  })()
 )
})

self.addEventListener("message", (event) => {
 if (event.data?.type === "SKIP_WAITING") {
  self.skipWaiting()
 }
})

self.addEventListener("fetch", (event) => {
 const { request } = event

 if (request.method !== "GET") {
  return
 }

 const requestUrl = new URL(request.url)

 if (requestUrl.origin !== self.location.origin) {
  return
 }

 if (request.mode === "navigate") {
  event.respondWith(handleNavigationRequest(event))
  return
 }

 if (shouldHandleAsRuntimeAsset(request, requestUrl)) {
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE))
 }
})

function shouldHandleAsRuntimeAsset(request, requestUrl) {
 if (requestUrl.pathname === "/sw.js") {
  return false
 }

 if (requestUrl.pathname.startsWith("/_next/static/")) {
  return true
 }

 if (requestUrl.pathname === "/manifest.webmanifest") {
  return true
 }

 if (requestUrl.searchParams.has("_rsc")) {
  return true
 }

 return ["script", "style", "font", "image", "worker"].includes(request.destination)
}

async function handleNavigationRequest(event) {
 try {
  const preloadResponse = await event.preloadResponse

  if (preloadResponse) {
   const pageCache = await caches.open(PAGE_CACHE)
   pageCache.put(event.request, preloadResponse.clone())
   return preloadResponse
  }

  const networkResponse = await fetch(event.request)

  if (networkResponse && networkResponse.ok) {
   const pageCache = await caches.open(PAGE_CACHE)
   pageCache.put(event.request, networkResponse.clone())
  }

  return networkResponse
 } catch (error) {
  const cachedPage = await caches.match(event.request)

  if (cachedPage) {
   return cachedPage
  }

  const cachedHomePage = await caches.match("/")

  if (cachedHomePage) {
   return cachedHomePage
  }

  const offlineResponse = await caches.match(OFFLINE_URL)

  if (offlineResponse) {
   return offlineResponse
  }

  throw error
 }
}

async function staleWhileRevalidate(request, cacheName) {
 const cache = await caches.open(cacheName)
 const cachedResponse = await cache.match(request)

 const networkResponsePromise = fetch(request)
  .then((networkResponse) => {
   if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone())
   }

   return networkResponse
  })
  .catch(() => undefined)

 if (cachedResponse) {
  return cachedResponse
 }

 const networkResponse = await networkResponsePromise

 if (networkResponse) {
  return networkResponse
 }

 return Response.error()
}
