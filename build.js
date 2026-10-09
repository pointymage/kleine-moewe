// Baut die installierbare App-Version (PWA) nach docs/: node build.js
// Bilder: PNGs in img/ ablegen (Dateinamen siehe BILDER.md); sie werden automatisch eingebunden.
const fs = require('fs'), path = require('path');
const dir = __dirname, out = path.join(dir, 'docs'), imgDir = path.join(dir, 'img');
fs.mkdirSync(path.join(out, 'img'), { recursive: true });
const imgs = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).filter(f => /\.png$/i.test(f)) : [];
for (const f of imgs) fs.copyFileSync(path.join(imgDir, f), path.join(out, 'img', f.toLowerCase()));
const list = JSON.stringify(imgs.map(f => f.replace(/\.png$/i, '').toLowerCase()));
let src = fs.readFileSync(path.join(dir, 'index.html'), 'utf8').replace(/\/\*ARTLIST\*\/\[[^\]]*\]/, '/*ARTLIST*/' + list);
fs.writeFileSync(path.join(dir, 'index.html'), src); // Bilderliste auch für das Artifact
const v = Date.now();
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="de"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="theme-color" content="#0c3644">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-192.png">
</head><body>
${src}
<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');</script>
</body></html>
`);
fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'Kleine Möwe', short_name: 'Kleine Möwe', lang: 'de', start_url: './', scope: './',
  display: 'fullscreen', orientation: 'any', background_color: '#0c3644', theme_color: '#0c3644',
  icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }, { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
}, null, 2));
fs.writeFileSync(path.join(out, 'sw.js'), `const C = 'km-${v}';
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request)));
});
`);
for (const f of ['icon-192.png', 'icon-512.png']) if (fs.existsSync(path.join(dir, f))) fs.copyFileSync(path.join(dir, f), path.join(out, f));
console.log(`docs/ gebaut, ${imgs.length} Bilder eingebunden`);
