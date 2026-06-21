const CACHE_NAME = "time-regulus-v3.1.3-c4"; // フォントオフライン対応・省電力化
const urlsToCache = [
  "./",
  "./index.html",
  "./style-lock.css?c=4",
  "./style-main.css?c=4",
  "./script.js?c=4",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./QRCorde.PNG",
  // 笘・舌が繝輔Λ繧､繝ｳ蟇ｾ蠢懊醍ｽｮ譎りｨ育畑繝輔か繝ｳ繝医ヵ繧｡繧､繝ｫ・医い繝励Μ蜷梧｢ｱ・・
  "./fonts/Orbitron-Bold.woff2",
  "./fonts/VT323.woff2",
  "./fonts/ShareTechMono.woff2",
  "./fonts/Sixtyfour.woff2",
  "./fonts/RubikDirt.woff2",
  "./fonts/MoiraiOne.woff2",
  "./fonts/BungeeShade.ttf",
  "./fonts/DiplomataSC.ttf",
  "./fonts/Bellefair.ttf"
];

// 繧､繝ｳ繧ｹ繝医・繝ｫ譎ゅ↓蠢・ｦ√↑繧｢繧ｻ繝・ヨ繧偵く繝｣繝・す繝･
self.addEventListener("install", event => {
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 謖・ｮ壹＆繧後◆縺吶∋縺ｦ縺ｮ繝輔ぃ繧､繝ｫ繧偵く繝｣繝・す繝･縺ｫ霑ｽ蜉
      return cache.addAll(urlsToCache);
    })
  );
});

// 襍ｷ蜍墓凾縺ｫ蜿､縺・く繝｣繝・す繝･繧貞炎髯､縺励√☆縺舌↓蛻ｶ蠕｡繧貞･ｪ蜿・
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            // 迴ｾ蝨ｨ縺ｮ繧ｭ繝｣繝・す繝･蜷阪→逡ｰ縺ｪ繧句商縺・く繝｣繝・す繝･繧貞炎髯､・医く繝｣繝・す繝･繝舌せ繝・ぅ繝ｳ繧ｰ・・
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // 笘・ｿｮ豁｣邂・園: 譁ｰ縺励＞Service Worker縺悟叉蠎ｧ縺ｫ繧ｯ繝ｩ繧､繧｢繝ｳ繝医ｒ蛻ｶ蠕｡縺ｧ縺阪ｋ繧医≧縺ｫ縺吶ｋ
      return self.clients.claim();      
    })
  );
});

// 繝ｪ繧ｯ繧ｨ繧ｹ繝域凾縺ｫ繧ｭ繝｣繝・す繝･蜆ｪ蜈医〒蠢懃ｭ斐☆繧具ｼ・ache First謌ｦ逡･・・
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // 繧ｭ繝｣繝・す繝･縺悟ｭ伜惠縺吶ｌ縺ｰ縲√◎繧後ｒ霑斐☆縲ゅ↑縺代ｌ縺ｰ繝阪ャ繝医Ρ繝ｼ繧ｯ縺九ｉ蜿門ｾ・
      return response || fetch(event.request);
    })
  );
});

// 笘・ｿｮ豁｣邂・園: postMessage繧貞女縺大叙繧翫《kipWaiting繧貞ｮ溯｡後☆繧九Μ繧ｹ繝翫・
// script.js縺九ｉ縺ｮ縲梧峩譁ｰ繝懊ち繝ｳ縺後け繝ｪ繝・け縺輔ｌ縺溘阪Γ繝・そ繝ｼ繧ｸ繧貞女縺大叙繧・
self.addEventListener('message', event => {
  if (event.data && event.data.action === 'skipWaiting') {
    // 蠕・ｩ滉ｸｭ縺ｮService Worker繧貞ｼｷ蛻ｶ逧・↓繧｢繧ｯ繝・ぅ繝門喧
    self.skipWaiting();
  }
});
