/* Дотики й рухи для планшета:
   - збільшення двома пальцями, подвійний дотик, перетягування збільшеного;
   - гортання фото й креслень свайпом, закриття свайпом униз;
   - слайди презентації: свайп, дотик ліворуч/праворуч, збільшення;
   - меню: свайп від лівого краю відкриває, свайп ліворуч закриває;
   - кнопка «Назад» (Android) спершу закриває вікна, потім повертає на попередній екран;
   - плавні переходи між екранами з урахуванням напрямку, пам'ять прокрутки. */
(function () {
  "use strict";
  const coarse = matchMedia("(pointer:coarse)").matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ---------- універсальний масштабувальник ---------- */
  function Zoomer(box, opts) {
    const st = { s: 1, x: 0, y: 0 };
    const ptrs = new Map();
    let pinch = null, drag = null, lastTap = 0, tapTimer = null;
    const img = () => opts.img();
    function apply(anim) {
      const el = img(); if (!el) return;
      el.style.transition = anim ? "transform .22s cubic-bezier(.2,.7,.2,1)" : "none";
      el.style.transform = st.s === 1 && st.x === 0 && st.y === 0 ? "" : `translate(${st.x}px,${st.y}px) scale(${st.s})`;
      el.style.cursor = st.s > 1 ? "grab" : "";
      opts.onZoom && opts.onZoom(st.s > 1.01);
    }
    function limit() {
      const el = img(); if (!el) return;
      const r = box.getBoundingClientRect(), w = el.offsetWidth * st.s, h = el.offsetHeight * st.s;
      const mx = Math.max(0, (w - r.width) / 2), my = Math.max(0, (h - r.height) / 2);
      st.x = clamp(st.x, -mx - 40, mx + 40); st.y = clamp(st.y, -my - 40, my + 40);
    }
    function zoomAt(ns, cx, cy) {
      const r = box.getBoundingClientRect(), ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
      ns = clamp(ns, 1, 5);
      st.x = ox - (ox - st.x) * (ns / st.s); st.y = oy - (oy - st.y) * (ns / st.s); st.s = ns;
      if (ns === 1) { st.x = 0; st.y = 0; }
      limit();
    }
    this.reset = (anim) => { st.s = 1; st.x = 0; st.y = 0; apply(anim); };
    this.zoomed = () => st.s > 1.01;
    const ignore = (e) => e.target.closest("button,a,input,textarea,select,.lbacts,.pvbar,[data-nozoom]");
    box.addEventListener("pointerdown", (e) => {
      if (ignore(e)) return;
      box.setPointerCapture && box.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, t: Date.now(), x0: e.clientX, y0: e.clientY });
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), s: st.s, x: st.x, y: st.y, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
        drag = null;
      } else if (ptrs.size === 1) {
        drag = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, moved: false, axis: null, t: Date.now() };
      }
    });
    box.addEventListener("pointermove", (e) => {
      const p = ptrs.get(e.pointerId); if (!p) return;
      p.x = e.clientX; p.y = e.clientY;
      if (pinch && ptrs.size >= 2) {
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        st.s = pinch.s; st.x = pinch.x + (mx - pinch.mx); st.y = pinch.y + (my - pinch.my);
        zoomAt(pinch.s * d / pinch.d, mx, my); apply(false); return;
      }
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (st.s > 1.01) { st.x = drag.sx + dx; st.y = drag.sy + dy; limit(); apply(false); return; }
      if (!drag.axis && drag.moved) drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      const el = img(); if (!el) return;
      el.style.transition = "none";
      if (drag.axis === "x" && opts.onSwipe) el.style.transform = `translateX(${dx * 0.9}px)`;
      if (drag.axis === "y" && dy > 0 && opts.onClose) { el.style.transform = `translateY(${dy}px) scale(${1 - Math.min(dy, 400) / 2000})`; box.style.backgroundColor = `rgba(11,12,13,${1 - Math.min(dy, 300) / 600})`; }
    });
    const end = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (pinch) { if (ptrs.size < 2) { pinch = null; if (st.s < 1.05) this.reset(true); else { limit(); apply(true); } drag = null; } return; }
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y, dt = Date.now() - drag.t; const d = drag; drag = null;
      box.style.backgroundColor = "";
      if (st.s > 1.01) { if (!d.moved) tap(e); return; }
      const el = img();
      if (d.axis === "x" && opts.onSwipe && (Math.abs(dx) > 70 || (Math.abs(dx) > 30 && dt < 250))) { opts.onSwipe(dx < 0 ? 1 : -1, el); return; }
      if (d.axis === "y" && opts.onClose && (dy > 120 || (dy > 50 && dt < 250))) { if (el) { el.style.transform = ""; el.style.transition = ""; } opts.onClose(); return; }
      if (el) { el.style.transition = "transform .25s cubic-bezier(.2,.7,.2,1)"; el.style.transform = ""; }
      if (!d.moved) tap(e);
    };
    box.addEventListener("pointerup", end);
    box.addEventListener("pointercancel", end);
    const tap = (e) => {
      const now = Date.now(), cx = e.clientX, cy = e.clientY;
      if (now - lastTap < 300) { clearTimeout(tapTimer); lastTap = 0; if (st.s > 1.01) this.reset(true); else { zoomAt(2.5, cx, cy); apply(true); } return; }
      lastTap = now;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => { if (st.s <= 1.01 && opts.onTap) opts.onTap(cx, cy, e); }, 300);
    };
    box.addEventListener("wheel", (e) => { if (!e.ctrlKey && st.s <= 1.01) return; e.preventDefault(); zoomAt(st.s * (e.deltaY < 0 ? 1.15 : 0.87), e.clientX, e.clientY); apply(false); }, { passive: false });
    box.style.touchAction = "none";
  }

  /* ---------- переглядач фото/креслень: гортання + збільшення ---------- */
  const lbImg = lb.querySelector("img");
  let lbList = [], lbIdx = 0;
  const nav = document.createElement("div");
  nav.className = "lbnav";
  nav.innerHTML = `<button class="lbarrow" data-d="-1" aria-label="Попереднє">‹</button><span class="lbctr"></span><button class="lbarrow" data-d="1" aria-label="Наступне">›</button>`;
  lb.appendChild(nav);
  nav.querySelectorAll("[data-d]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); lbGo(+b.dataset.d); }));
  function lbShow(dir) {
    const it = lbList[lbIdx]; if (!it) return;
    lbZoom.reset(false);
    lbImg.classList.remove("lbin-l", "lbin-r");
    _openLb(it.src, it.cap, it.np);
    if (dir) { void lbImg.offsetWidth; lbImg.classList.add(dir > 0 ? "lbin-r" : "lbin-l"); }
    nav.hidden = lbList.length < 2;
    nav.querySelector(".lbctr").textContent = `${lbIdx + 1} / ${lbList.length}`;
    [lbIdx - 1, lbIdx + 1].forEach((k) => { const n = lbList[k]; if (n) { const i = new Image(); i.src = n.src; } });
  }
  function lbGo(d) {
    const n = lbIdx + d;
    if (n < 0 || n >= lbList.length) { lbZoom.reset(true); return; }
    lbIdx = n; lbShow(d);
  }
  const _openLb = openLb;
  openLb = function (src, cap, np, list) {
    lbList = list && list.length ? list : [{ src, cap, np }];
    lbIdx = Math.max(0, lbList.findIndex((x) => x.src === src));
    lbShow(0);
  };
  const lbZoom = new Zoomer(lb, {
    img: () => lbImg,
    onSwipe: (d) => lbGo(d),
    onClose: () => { lb.classList.remove("open"); lbZoom.reset(false); },
    onTap: (x, y, e) => { if (e.target === lb) { lb.classList.remove("open"); } },
  });
  lb.onclick = (e) => { if (e.target.classList.contains("x")) { lb.classList.remove("open"); lbZoom.reset(false); } };
  /* список сусідніх кадрів: усе з тієї самої галереї */
  const GROUP = ".gallery,.pbgrid,.mgal,.blueprint,#milGrid,#docGrid,.mdrawall,.hero,#pmbox,.grid";
  bindLb = function (root) {
    if (!root) return; // у відкритій версії немає закритих розділів (напр. військового) — пропускаємо
    root.querySelectorAll("[data-lb]").forEach((b) => (b.onclick = (e) => {
      e.preventDefault();
      const mg = b.closest(".mgal");
      if (mg) {
        const th = [...mg.querySelectorAll("[data-th]")].map((x) => x.dataset.th);
        const name = b.dataset.cap || "";
        const list = (th.length ? th : [b.dataset.lb]).map((src) => ({ src, cap: name, np: "" }));
        openLb(b.dataset.lb, name, "", list); return;
      }
      const g = b.closest(GROUP) || root;
      const list = [...g.querySelectorAll("[data-lb]")].map((x) => ({ src: x.dataset.lb, cap: x.dataset.cap || "", np: x.dataset.np || (x.querySelector(".np") ? "1" : "") }));
      openLb(b.dataset.lb, b.dataset.cap || "", b.dataset.np || (b.querySelector(".np") ? "1" : ""), list);
    }));
  };
  /* фотобанк: гортати в межах групи споруди */
  const _pbRender = pbRender;
  pbRender = function () {
    _pbRender();
    $$("#pbOut .pbgrid").forEach((g) => {
      const imgs = [...g.querySelectorAll("img")];
      const list = imgs.map((im) => ({ src: im.getAttribute("src"), cap: im.dataset.cap, np: im.dataset.np }));
      imgs.forEach((im) => (im.onclick = () => openLb(im.getAttribute("src"), im.dataset.cap, im.dataset.np, list)));
    });
  };
  /* перев'язати вже відмальовані екрани */
  $$(".screen").forEach((s) => bindLb(s));
  if ($("#pmbox")) bindLb($("#pmbox"));
  if (typeof renderMilitary === "function" && $("#milGrid")) { const _rm = renderMilitary; renderMilitary = function (g) { _rm(g); bindLb($("#milGrid")); }; renderMilitary(); }
  pbRender();
  /* мініатюри в картці моделі: свайп по головному фото гортає кадри */
  $$(".mgal").forEach((g) => {
    const main = g.querySelector(".main"); if (!main) return;
    let x0 = null, y0 = null;
    main.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    main.addEventListener("touchend", (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;
      const th = [...g.querySelectorAll("[data-th]")], i = th.findIndex((b) => b.getAttribute("aria-selected") === "true");
      const n = th[clamp(i + (dx < 0 ? 1 : -1), 0, th.length - 1)];
      if (n && n !== th[i]) { n.click(); n.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" }); main._swiped = Date.now(); }
    });
    main.addEventListener("click", (e) => { if (main._swiped && Date.now() - main._swiped < 400) { e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  });

  /* ---------- слайди презентації ---------- */
  const pvZoom = new Zoomer($("#pvstage"), {
    img: () => pvCur,
    onSwipe: (d, el) => { if (el) { el.style.transform = ""; el.style.transition = ""; } pvStep(d); },
    onClose: () => { pv.classList.remove("open"); if (document.fullscreenElement) document.exitFullscreen && document.exitFullscreen(); },
    onTap: (x) => { const r = $("#pvstage").getBoundingClientRect(); pvStep(x < r.left + r.width * 0.3 ? -1 : 1); },
    onZoom: (z) => { $("#pvlinks").style.visibility = z ? "hidden" : ""; },
  });
  const _pvShow = pvShow;
  pvShow = function (d) { pvZoom.reset(false); [$("#pvimg"), $("#pvimg2")].forEach((i) => { i.style.transform = ""; i.style.transition = ""; }); _pvShow(d); };

  /* ---------- меню: свайп від краю ---------- */
  const mobile = () => matchMedia("(max-width:900px)").matches;
  let edge = null;
  document.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (mobile() && !document.body.classList.contains("drawer") && t.clientX < 22 && !$(".dlg.open,#lb.open,#pv.open,#vp.open,#sd.open")) edge = { x: t.clientX, y: t.clientY, open: true };
    else if (document.body.classList.contains("drawer")) edge = { x: t.clientX, y: t.clientY, open: false };
    else edge = null;
  }, { passive: true });
  document.addEventListener("touchmove", (e) => {
    if (!edge) return;
    const t = e.touches[0], dx = t.clientX - edge.x, dy = t.clientY - edge.y;
    if (Math.abs(dy) > 40 && Math.abs(dy) > Math.abs(dx)) { edge = null; return; }
    if (edge.open && dx > 50) { document.body.classList.add("drawer"); edge = null; }
    else if (!edge.open && dx < -50) { document.body.classList.remove("drawer"); edge = null; }
  }, { passive: true });

  /* ---------- історія екранів, напрям переходу, пам'ять прокрутки ---------- */
  const HIST = [], SCROLL = {};
  let backNav = false;
  const stage = $("#stage");
  const _go = go;
  go = function (i, push) {
    const prev = cur, prevEl = screens[prev];
    if (prevEl) SCROLL[prevEl.id] = stage.scrollTop;
    if (!backNav && i !== prev && prevEl) { HIST.push(prev); if (HIST.length > 60) HIST.shift(); }
    _go(i, push);
    const el = screens[cur];
    if (el && i !== prev) {
      el.classList.remove("enter-fwd", "enter-back"); void el.offsetWidth;
      el.classList.add(backNav || cur < prev ? "enter-back" : "enter-fwd");
    }
    if (backNav && el && SCROLL[el.id] != null) stage.scrollTop = SCROLL[el.id];
  };
  window.HHBack = function () {
    if ($("#qrfull.open")) { $("#qrfull").classList.remove("open"); return "closed"; }
    if (lb.classList.contains("open")) { lb.classList.remove("open"); lbZoom.reset(false); return "closed"; }
    if ($("#sd.open")) { $("#sd").classList.remove("open"); return "closed"; }
    if (vp.classList.contains("open")) { closeVp(); return "closed"; }
    const d = $(".dlg.open"); if (d) { if (d.id === "qrs" && typeof closeScanner === "function") closeScanner(); else d.classList.remove("open"); return "closed"; }
    if (pv.classList.contains("open")) { if (pvZoom.zoomed()) { pvZoom.reset(true); return "closed"; } pv.classList.remove("open"); return "closed"; }
    if (pm.classList.contains("open")) { pm.classList.remove("open"); return "closed"; }
    if (sr.classList.contains("open")) { sr.classList.remove("open"); return "closed"; }
    if (document.body.classList.contains("drawer")) { document.body.classList.remove("drawer"); return "closed"; }
    if (HIST.length) { backNav = true; try { go(HIST.pop()); } finally { backNav = false; } return "back"; }
    return "none";
  };
  /* стрілки клавіатури в переглядачі */
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "ArrowRight") { e.stopImmediatePropagation(); e.preventDefault(); lbGo(1); }
    else if (e.key === "ArrowLeft") { e.stopImmediatePropagation(); e.preventDefault(); lbGo(-1); }
  }, true);
  /* кнопка «Весь екран» у застосунку Android: прихувати системні панелі */
  if (window.HHNative && HHNative.toggleImmersive) {
    $("#fsBtn").onclick = () => HHNative.toggleImmersive();
    $("#pvFs").onclick = () => HHNative.toggleImmersive();
    document.documentElement.classList.add("app");
  }

  /* ---------- клавіатура: поле, в яке пишуть, не ховається під нею ---------- */
  document.addEventListener("focusin", e => {
    const t = e.target;
    if (!t.matches || !t.matches("input:not([type=checkbox]):not([type=radio]),textarea,select")) return;
    setTimeout(() => { try { t.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (_) {} }, 350);
  });
  window.addEventListener("resize", () => {
    const a = document.activeElement;
    if (a && a.matches && a.matches("input,textarea")) setTimeout(() => { try { a.scrollIntoView({ block: "center" }); } catch (_) {} }, 60);
  });
})();
