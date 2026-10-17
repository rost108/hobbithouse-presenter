/* Перемикач мови UA / EN.
   Інтерфейс лишається українським у коді; в англійському режимі текст на екрані підміняється:
   1) точний переклад цілого рядка зі словника window.HH_EN (i18n_en.js);
   2) інакше — правила для рядків із числами (місткість, розміри, площі);
   рядок, який не вдалося перекласти повністю, лишається українським.
   Нові екрани, діалоги й підказки перекладаються автоматично (MutationObserver). */
(function () {
  "use strict";
  const KEY = "hh_lang";
  const CY = /[А-Яа-яІіЇїЄєҐґ]/;
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  let lang = "uk";
  try { lang = localStorage.getItem(KEY) === "en" ? "en" : "uk"; } catch (_) {}

  const DICT = window.HH_EN || {};
  // правила для рядків із числами й типових фрагментів (порядок важливий: довші — раніше)
  const RULES = [
    [/Одна споруда вміщує (\d+) осіб/g, "One structure holds $1 people"],
    [/(\d+) осіб при ([\d,.]+) м²\/ос\./g, "$1 people at $2 m²/person"],
    [/Розміщення (\d+) (?:осіб|особи) за таблицею/g, "Placement of $1 people per table"],
    [/(\d+) осіб у споруді/g, "$1 people in the structure"],
    [/^(\d+) (?:осіб|особи|особа): розміщення за таблицею$/gu, "$1 people: placement per table"],
    [/^максимум: ([\d.,]+XL) —$/gu, "maximum: $1 —"],
    [/^\+(\d+) запас$/gu, "+$1 spare"], [/^(\d+) споруд[иа]?$/gu, "$1 structures"], [/^осіб · по (\d+)$/gu, "people · $1 each"],
    [/(?<!\p{L})кожна(?!\p{L})/gu, "each"], [/^ширина ([\d,.]+) м$/gu, "width $1 m"],
    [/Число під розміром — кількість осіб\. Сірим — розміри, у які (\d+) осіб не вміщуються\./g, "The number under each size is the capacity. Grey — sizes that can't hold $1 people."],
    [/(\d+) осіб при ([\d,.]+) m²/g, "$1 people at $2 m²"],
    [/картка найближчої моделі лінійки/g, "card of the nearest model in the line"],
    [/(\d+) осіб разом/g, "$1 people in total"],
    [/по (\d+) у кожній/g, "$1 in each"],
    [/запас (\d+) місць/g, "$1 spare places"],
    [/(\d+) × Фортеця/g, "$1 × Fortress"],
    [/(\d+) × Хоббіт/g, "$1 × Hobbit"],
    [/Одномодульне укриття/g, "1-module shelter"],
    [/Двомодульне укриття/g, "2-module shelter"],
    [/Тримодульне укриття/g, "3-module shelter"],
    [/(\d+)[‑-]модульне укриття/g, "$1-module shelter"],
    [/Модульне укриття/g, "Modular shelter"],
    [/Конфігурації з двох споруд/g, "Two-structure configurations"],
    [/Нові моделі (\d+)/g, "New models $1"],
    [/наземні ПМУ/g, "above-ground PMU"],
    [/Підземні/g, "Underground"],
    [/Протирадіаційні укриття/g, "Radiation shelters"],
    [/Наземне протирадіаційне укриття/g, "Above-ground radiation shelter"],
    [/Підземне протирадіаційне укриття/g, "Underground radiation shelter"],
    [/^Креслення (?=\p{Lu})/u, "Drawing: "], [/^Візуалізація (?=\p{Lu})/u, "Rendering: "],
    [/Жодна одна споруда не вміщує (\d+) осіб за цих умов\./g, "No single structure holds $1 people under these conditions."],
    [/запас (\d+) місц(?:е|я|ь)/gu, "$1 spare"],
    [/Збережено (\d+) з (\d+) файлів \(([\d.,]+) МБ з ([\d.,]+) МБ\)\./g, "Saved $1 of $2 files ($3 MB of $4 MB)."],
    [/Завантажити все для офлайну/g, "Download everything for offline"], [/Без відео/g, "Without video"],
    [/^(\d+) кадр(?:и|ів)?$/gu, "$1 images"], [/^Усі · (\d+)$/gu, "All · $1"],
    [/Немає доступу до камери \(([^)]*)\)\. Дозвольте камеру в налаштуваннях браузера або натисніть «Із фото»\./g, "No camera access ($1). Allow the camera in the browser settings or tap «From photo»."],
    [/Протирадіаційне укриття/g, "Radiation shelter"],
    [/МБ/g, "MB"],
    [/Фортеці/g, "Fortress"], [/Фортеця/g, "Fortress"], [/Хоббіт/g, "Hobbit"],
    [/м²\/ос\./g, "m²/person"],
    [/(\d) ос\./g, "$1 pers."],
    [/(?<!\p{L})площа(?!\p{L})/gu, "area"],
    [/наземне/g, "above-ground"], [/підземне/g, "underground"],
    [/Д × Ш × В/g, "L × W × H"], [/Д × Ш/g, "L × W"], [/Ш × В/g, "W × H"],
    [/(\d)\s?мм/g, "$1 mm"], [/м²/g, "m²"], [/м³/g, "m³"], [/(\d) м(?!\p{L})/gu, "$1 m"],
    [/кПа/g, "kPa"], [/(\d) год(?!\p{L})/gu, "$1 h"], [/(\d+) років/g, "$1 years"], [/(\d+) днів/g, "$1 days"],
    [/ДСТУ/g, "DSTU"], [/ДБН/g, "DBN"], [/ПМУ/g, "PMU"], [/ПРУ/g, "PRU"], [/КП/g, "quote"],
    [/(\d),(\d)/g, "$1.$2"],
    [/(?<!\p{L})та(?!\p{L})/gu, "and"], [/(?<!\p{L})і(?!\p{L})/gu, "and"], [/(?<!\p{L})або(?!\p{L})/gu, "or"],
    [/(?<!\p{L})до(?!\p{L})/gu, "up to"], [/(?<!\p{L})від(?!\p{L})/gu, "from"]
  ];

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function tr(s) {
    const k = norm(s);
    if (!k || !CY.test(k)) return null;
    let t = DICT[k];
    if (t == null) {
      t = k;
      for (const [re, to] of RULES) t = t.replace(re, to);
      if (CY.test(t)) return null;
    }
    const lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
    return lead + t + tail;
  }
  window.HHtr = s => (lang === "en" && tr(s)) || s;
  window.HHlang = () => lang;

  const ORIG = new WeakMap();      // текстовий вузол → український оригінал
  const ORIGA = new WeakMap();     // елемент → {атрибут: оригінал}
  let busy = false;

  function doText(n) {
    const p = n.parentElement;
    if (!p || p.closest("script,style,[data-noi18n]")) return;
    if (lang === "en") {
      const src = ORIG.has(n) ? ORIG.get(n) : n.nodeValue;
      const t = tr(src);
      if (t != null) { ORIG.set(n, src); if (n.nodeValue !== t) n.nodeValue = t; }
    } else if (ORIG.has(n)) {
      const o = ORIG.get(n); ORIG.delete(n); if (n.nodeValue !== o) n.nodeValue = o;
    }
  }
  function doAttrs(e) {
    if (e.closest("[data-noi18n]")) return;
    for (const a of ATTRS) {
      if (!e.hasAttribute(a)) continue;
      const store = ORIGA.get(e) || {};
      if (lang === "en") {
        const src = a in store ? store[a] : e.getAttribute(a);
        const t = tr(src);
        if (t != null) { store[a] = src; ORIGA.set(e, store); if (e.getAttribute(a) !== t) e.setAttribute(a, t); }
      } else if (a in store) { e.setAttribute(a, store[a]); delete store[a]; }
    }
    // data-title екранів використовується в заголовку і в меню
    if (e.dataset && e.dataset.title != null) {
      const store = ORIGA.get(e) || {};
      if (lang === "en") {
        const src = "dataTitle" in store ? store.dataTitle : e.dataset.title;
        const t = tr(src); if (t != null) { store.dataTitle = src; ORIGA.set(e, store); e.dataset.title = t; }
      } else if ("dataTitle" in store) { e.dataset.title = store.dataTitle; delete store.dataTitle; }
    }
  }
  let mo = null;
  function walk(root) {
    if (!root) return;
    busy = true;
    try {
      if (root.nodeType === 3) { doText(root); return; }
      if (root.nodeType !== 1) return;
      doAttrs(root);
      root.querySelectorAll("*").forEach(doAttrs);
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n; while ((n = w.nextNode())) doText(n);
    } finally { busy = false; if (mo) mo.takeRecords(); /* власні заміни не обробляємо як нові тексти */ }
  }

  mo = new MutationObserver(list => {
    if (busy) return;
    for (const m of list) {
      if (m.type === "characterData") { ORIG.delete(m.target); walk(m.target); }
      else if (m.type === "attributes") { const st = ORIGA.get(m.target); if (st) delete st[m.attributeName]; walk(m.target); }
      else m.addedNodes.forEach(walk);
    }
  });

  function apply() {
    document.documentElement.lang = lang === "en" ? "en" : "uk";
    document.documentElement.classList.toggle("lang-en", lang === "en");
    walk(document.body);
    if (document.title) document.title = lang === "en" ? "Hobbit House · Sales presenter" : "Hobbit House · Презентер продажів";
    document.querySelectorAll(".langsw button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }

  window.HHsetLang = function (l) {
    lang = l === "en" ? "en" : "uk";
    try { localStorage.setItem(KEY, lang); } catch (_) {}
    apply();
    document.dispatchEvent(new Event("hh-lang"));
  };

  function addSwitch() {
    const box = document.createElement("div");
    box.className = "langsw"; box.setAttribute("data-noi18n", "");
    box.setAttribute("role", "group"); box.setAttribute("aria-label", "Language / Мова");
    box.innerHTML = '<button type="button" data-lang="uk">UA</button><button type="button" data-lang="en">EN</button>';
    box.addEventListener("click", e => { const b = e.target.closest("button"); if (b) window.HHsetLang(b.dataset.lang); });
    const bar = document.querySelector("#bar");
    if (bar) bar.appendChild(box);
  }

  const css = document.createElement("style");
  css.textContent =
    ".langsw{display:inline-flex;gap:2px;background:var(--line-2,#E8EBED);border-radius:999px;padding:3px;margin-left:6px;flex:none}" +
    ".langsw button{min-width:40px;min-height:32px;padding:4px 10px;border-radius:999px;font:600 13px var(--body);color:var(--muted,#5F6B73);letter-spacing:.02em}" +
    ".langsw button[aria-pressed=true]{background:var(--ink,#1F2328);color:#fff}" +
    "@media (pointer:coarse){.langsw button{min-height:40px;min-width:46px}}";
  document.head.appendChild(css);

  // тексти для відправки клієнту теж англійською (построково; неперекладене лишається як є)
  const trLines = v => typeof v === "string" ? v.split("\n").map(l => window.HHtr(l)).join("\n") : v;
  if (typeof window.openShare === "function") {
    const orig = window.openShare;
    window.openShare = function (o) {
      if (lang === "en" && o) o = Object.assign({}, o, { title: trLines(o.title), text: trLines(o.text), subject: trLines(o.subject) });
      return orig.call(this, o);
    };
  }

  function start() {
    addSwitch();
    apply();
    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
