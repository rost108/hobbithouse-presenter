/* Service worker Презентера: ядро — спершу мережа (щоб оновлення доходили), медіа — з кешу; відео з кешу віддається частинами (Range) для iOS. */
const VERSION="205899f3d1";
const CORE="hh-core-"+VERSION, MEDIA="hh-media-v1";
const CORE_FILES=["./","index.html","features.js","data.js","presentations.js","presentations_links.js","assets.js","manifest.webmanifest","media/lib/qrcode.js","media/lib/jsQR.js","media/fonts/fonts.css","media/logo-mark.svg","media/icon-192.png","media/icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CORE).then(c=>Promise.all(CORE_FILES.map(f=>c.add(f).catch(()=>{}))))).then(()=>self.skipWaiting())});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("hh-core-")&&k!==CORE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const isCore=p=>/\/(index\.html|features\.js|data\.js|presentations(_links)?\.js|assets\.js|manifest\.webmanifest)?$/.test(p);
async function fromCache(req){const url=new URL(req.url);url.search="";return (await caches.match(url.href,{ignoreSearch:true}))||null}
async function ranged(req,res){const range=req.headers.get("range");if(!range)return res;const b=await res.blob();const m=/bytes=(\d*)-(\d*)/.exec(range);if(!m)return res;
 let start=m[1]?+m[1]:0,end=m[2]?+m[2]:b.size-1;if(!m[1]&&m[2]){start=b.size-(+m[2]);end=b.size-1}end=Math.min(end,b.size-1);
 return new Response(b.slice(start,end+1),{status:206,statusText:"Partial Content",headers:{"Content-Type":res.headers.get("Content-Type")||"video/mp4","Content-Range":`bytes ${start}-${end}/${b.size}`,"Content-Length":String(end-start+1),"Accept-Ranges":"bytes"}})}
self.addEventListener("fetch",e=>{const req=e.request;if(req.method!=="GET")return;const url=new URL(req.url);if(url.origin!==location.origin)return;
 if(isCore(url.pathname)){e.respondWith(fetch(req,{cache:"no-cache"}).then(r=>{if(r.ok&&r.status===200){const cp=r.clone();caches.open(CORE).then(c=>c.put(req,cp))}return r}).catch(async()=>(await fromCache(req))||(await caches.match("index.html"))));return}
 e.respondWith((async()=>{const hit=await fromCache(req);if(hit)return ranged(req,hit);
  try{const r=await fetch(req);if(r.ok&&r.status===200&&!/\.mp4$/i.test(url.pathname)){const cp=r.clone();caches.open(MEDIA).then(c=>c.put(url.href,cp))}return r}catch(err){return new Response("",{status:504})}})())});
