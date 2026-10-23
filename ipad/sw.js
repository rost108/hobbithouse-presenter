/* Закрита версія Презентера для iPad: розшифровує застосунок на пристрої (AES-GCM), кешує для роботи без інтернету.
   Ключ лежить в IndexedDB цього застосунку після входу паролем. Версія: 0c8649d1e8 */
const V = "0c8649d1e8", CACHE = "hhi-" + V, MEDIA = "hhi-media-v1";
const MIME = {html: "text/html; charset=utf-8", js: "text/javascript; charset=utf-8", json: "application/json", css: "text/css",
  svg: "image/svg+xml", pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  gif: "image/gif", mp4: "video/mp4", webmanifest: "application/manifest+json", txt: "text/plain; charset=utf-8",
  woff2: "font/woff2", vcf: "text/vcard", csv: "text/csv"};
let META = null, KEY = null;

function idb() { return new Promise((res, rej) => { const r = indexedDB.open("hh-ipad", 1);
  r.onupgradeneeded = () => r.result.createObjectStore("kv"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
async function getKey() {
  if (KEY) return KEY;
  const db = await idb();
  const raw = await new Promise((res, rej) => { const t = db.transaction("kv").objectStore("kv").get("k"); t.onsuccess = () => res(t.result); t.onerror = () => rej(t.error); });
  if (!raw) return null;
  KEY = await crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]);
  return KEY;
}
async function cached(url, name) {
  const c = await caches.open(name);
  let r = await c.match(url);
  if (r) return r;
  r = await fetch(url, {cache: "no-cache"});
  if (r.ok && r.status === 200) await c.put(url, r.clone());
  return r;
}
async function meta() {
  if (META) return META;
  const r = await cached("e/meta.json", CACHE);
  META = await r.json(); META.set = new Set(META.files);
  return META;
}
async function hname(rel) {
  const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rel));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("").slice(0, 32);
}
async function ranged(req, res) {
  const range = req.headers.get("range"); if (!range) return res;
  const b = await res.blob(); const m = /bytes=(\d*)-(\d*)/.exec(range); if (!m) return res;
  let start = m[1] ? +m[1] : 0, end = m[2] ? +m[2] : b.size - 1;
  if (!m[1] && m[2]) { start = b.size - (+m[2]); end = b.size - 1; }
  end = Math.min(end, b.size - 1);
  return new Response(b.slice(start, end + 1), {status: 206, statusText: "Partial Content", headers: {
    "Content-Type": res.headers.get("Content-Type") || "video/mp4", "Content-Range": `bytes ${start}-${end}/${b.size}`,
    "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes"}});
}

self.addEventListener("install", e => e.waitUntil((async () => {
  const c = await caches.open(CACHE);
  await Promise.all(["./", "index.html", "e/meta.json", "manifest.webmanifest", "sync.js"].map(u => c.add(new Request(u, {cache: "reload"})).catch(() => {})));
  await self.skipWaiting();
})()));
self.addEventListener("activate", e => e.waitUntil((async () => {
  for (const k of await caches.keys()) if (k.startsWith("hhi-") && k !== CACHE && k !== MEDIA) await caches.delete(k);
  await self.clients.claim();
})()));
self.addEventListener("message", e => {
  if (e.data === "key") KEY = null;
  if (e.data === "sync") e.waitUntil(syncAll());
});

/* Завантаження всього застосунку для роботи без інтернету: зашифровані файли + усі фото й відео.
   Уже збережене пропускається, тож після перерви докачується лише решта. */
let SYNC = null;
async function post(msg) { for (const c of await self.clients.matchAll({includeUncontrolled: true})) c.postMessage(msg); }
function syncAll() {
  if (SYNC) return SYNC;
  SYNC = (async () => {
    const m = await meta();
    const enc = await caches.open(CACHE), med = await caches.open(MEDIA);
    const jobs = [...m.files.map(h => ({c: enc, u: new URL("e/" + h + ".bin", self.registration.scope).href})),
                  ...(m.media || []).map(r => ({c: med, u: new URL("../" + r, self.registration.scope).href}))];
    let done = 0, failed = 0; const total = jobs.length;
    const have = new Set([...(await enc.keys()), ...(await med.keys())].map(r => r.url));
    const todo = jobs.filter(j => !have.has(j.u)); done = total - todo.length;
    await post({hh: "sync", done, total, failed});
    let i = 0, last = 0;
    async function worker() {
      while (i < todo.length) {
        const j = todo[i++];
        try { const r = await fetch(j.u, {cache: "no-cache"}); if (r.ok && r.status === 200) await j.c.put(j.u, r); else failed++; }
        catch (_) { failed++; }
        done++;
        const now = Date.now(); if (now - last > 400 || done === total) { last = now; await post({hh: "sync", done, total, failed}); }
      }
    }
    await Promise.all([worker(), worker(), worker(), worker()]);
    await post({hh: "sync", done, total, failed, end: true});
  })().finally(() => { SYNC = null; });
  return SYNC;
}

self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const base = new URL("./", self.registration.scope).pathname;
  if (!url.pathname.startsWith(base)) return;
  const rel = decodeURIComponent(url.pathname.slice(base.length));
  // сторінка входу, маніфест і метадані: спершу мережа, без мережі — кеш
  if (rel === "" || rel === "index.html" || rel === "manifest.webmanifest" || rel === "e/meta.json" || rel === "sync.js") {
    e.respondWith(fetch(req, {cache: "no-cache"}).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; })
      .catch(async () => (await caches.match(req, {ignoreSearch: true})) || (await caches.match("./")) || new Response("", {status: 504})));
    return;
  }
  if (rel === "sw.js" || rel.startsWith("e/")) return;
  e.respondWith(handle(req, rel));
});

async function handle(req, rel) {
  try {
    const m = await meta(); const h = await hname(rel);
    if (m.set.has(h)) {
      const key = await getKey();
      if (!key) return Response.redirect(new URL("./", self.registration.scope).href, 302);
      const r = await cached("e/" + h + ".bin", CACHE);
      if (!r.ok) return new Response("", {status: 404});
      const buf = await r.arrayBuffer();
      const data = await crypto.subtle.decrypt({name: "AES-GCM", iv: buf.slice(0, 12)}, key, buf.slice(12));
      const ext = rel.split(".").pop().toLowerCase();
      return ranged(req, new Response(data, {headers: {"Content-Type": MIME[ext] || "application/octet-stream"}}));
    }
    if (rel.startsWith("media/")) {
      const shared = new URL("../" + rel, self.registration.scope).href;
      // відео з мережею — переадресація на відкритий файл, який браузер читає частинами сам
      // (Safari ламає відтворення частин відео через service worker); без мережі — збережена копія
      if (/\.mp4$/i.test(rel) && self.navigator.onLine) return Response.redirect(shared, 302);
      const c = await caches.open(MEDIA); const hit = await c.match(shared);
      if (hit) return ranged(req, hit);
      // відео з Range, якого ще немає в кеші, — напряму (швидкий старт); решту кешуємо
      if (req.headers.get("range")) return fetch(new Request(shared, {headers: {range: req.headers.get("range")}}));
      const r = await fetch(shared);
      if (r.ok && r.status === 200) await c.put(shared, r.clone());
      return r;
    }
    return fetch(req);
  } catch (err) {
    return new Response("", {status: 504});
  }
}
