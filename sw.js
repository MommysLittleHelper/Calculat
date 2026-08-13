const CACHE_NAME = 'calc-volume-v1';
// Укажите точные имена ваших файлов, которые нужно сохранить для офлайна
const ASSETS = [
  './',
  './index.html',
  './script.js',    // ИСПРАВЛЕНО: Указали реальное имя файла вместо calculator.js
  './style.css',    // ДОБАВЛЕНО: Чтобы стили и фон тоже работали без интернета
  './bg-light.jpg', // ДОБАВЛЕНО: Чтобы фоновая картинка не пропадала офлайн
  './icon16.png',
  './icon48.png',
  './icon128.png'
];


// Скачиваем файлы в кэш при первой установке
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// Перехватываем запросы и отдаем файлы из кэша, если нет интернета
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
