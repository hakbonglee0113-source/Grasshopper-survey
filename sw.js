// 메뚜기 현장조사 야장 - 서비스워커
// 오프라인에서도 앱 셸(HTML/CSS/JS)과 jsPDF 라이브러리가 동작하도록 캐싱합니다.
const CACHE_NAME = 'grasshopper-survey-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/font-nanum/1.0/nanumgothic/v3/NanumGothic-Regular.ttf',
  'https://cdn.jsdelivr.net/font-nanum/1.0/nanumgothic/v3/NanumGothic-Bold.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // 날씨(Open-Meteo)·행정구역명(Nominatim) API는 항상 네트워크 우선, 실패시 무시(오프라인이면 자동입력 생략)
  if (event.request.url.includes('open-meteo.com') || event.request.url.includes('nominatim.openstreetmap.org')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }
  // 그 외 자산은 캐시 우선, 없으면 네트워크
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
      return res;
    }).catch(() => cached))
  );
});
