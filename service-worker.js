// Emergency Service Worker - v2.1.7
// 古い壊れたキャッシュを完全にクリアし、自身を強制解除（アンレジスター）してアプリをクリーンな状態に復旧します。

self.addEventListener("install", event => {
  console.log("Emergency Service Worker: Installing...");
  self.skipWaiting(); // 待機せずに即座にアクティブ化させる
});

self.addEventListener("activate", event => {
  console.log("Emergency Service Worker: Activating and purging all caches...");
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          console.log("Purging cache:", name);
          return caches.delete(name); // キャッシュをすべて強制消去！
        })
      );
    }).then(() => {
      console.log("Emergency Service Worker: Unregistering self...");
      return self.registration.unregister(); // サービスワーカー自身の登録を完全に解除！
    }).then(() => {
      return self.clients.claim(); // クライアントの制御を即座に引き継ぐ
    }).then(() => {
      console.log("Emergency Service Worker: Purge and unregister completed successfully.");
    })
  );
});

// キャッシュを完全にスルーして、常に最新のネットワークリソースを取得させる
self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});