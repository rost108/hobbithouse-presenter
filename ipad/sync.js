/* Закрита версія для iPad: автоматичне завантаження всього для роботи без інтернету з індикатором прогресу. */
(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (_) {}
  let box = null, hideT = null;
  function ui(text, pct, ok) {
    if (!document.body) return;
    if (!box) {
      box = document.createElement("div");
      box.setAttribute("role", "status");
      box.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:calc(84px + env(safe-area-inset-bottom,0px));z-index:9999;" +
        "background:#1F2328;color:#fff;border-radius:999px;padding:10px 16px;font:500 14px -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;" +
        "box-shadow:0 6px 20px rgba(0,0,0,.18);display:flex;align-items:center;gap:10px;max-width:calc(100vw - 32px)";
      box.innerHTML = '<span class="t"></span><span style="width:90px;height:6px;border-radius:3px;background:rgba(255,255,255,.25);overflow:hidden;flex:none"><i style="display:block;height:100%;width:0;background:#7FD1A0;transition:width .3s"></i></span>';
      document.body.appendChild(box);
    }
    box.querySelector(".t").textContent = text;
    box.querySelector("i").style.width = Math.round(pct) + "%";
    box.style.display = "flex";
    clearTimeout(hideT);
    if (ok) hideT = setTimeout(() => { box.style.display = "none"; }, 4000);
  }
  let active = false; /* показуємо індикатор, лише якщо справді щось докачується */
  navigator.serviceWorker.addEventListener("message", e => {
    const d = e.data; if (!d || d.hh !== "sync" || !d.total) return;
    const pct = d.done / d.total * 100;
    if (d.end) {
      if (d.failed) ui("Завантажено не все (" + d.failed + "). Докачаю при наступному запуску з інтернетом.", pct, true);
      else if (active) ui("Усе завантажено — працює без інтернету", 100, true);
      else if (box) box.style.display = "none";
      active = false;
      return;
    }
    if (d.done < d.total) { active = true; ui("Завантаження для роботи без інтернету: " + Math.floor(pct) + "%", pct, false); }
  });
  function start() { navigator.serviceWorker.ready.then(r => { const w = navigator.serviceWorker.controller || r.active; if (w) w.postMessage("sync"); }); }
  if (document.readyState === "complete") start(); else addEventListener("load", start);
  addEventListener("online", start);
})();
