/* Language switcher for the Manotsava EEG pages: English, ಕನ್ನಡ, தமிழ், हिन्दी, తెలుగు.

   Loaded first in each page's <head>. The choice is kept under the same key ("manotsava-lang") as the
   switcher built into sensor_net.html and where_from.html, so picking a language on one page carries to all.
   A link can also set it: ...manotsava-eeg/?lang=kn (handy for a Kannada QR code).

   The translations live in lang/kn.js, lang/ta.js, lang/hi.js and lang/te.js: one line per piece of English
   text, with its translation beside it. To correct a translation, edit only the right-hand side there.
   English text with no translation simply stays in English.

   Pages written in plain HTML need nothing else: once the page has loaded, every paragraph, heading, button and
   label whose English text is in the language file is swapped for its translation. Numbers are carried over,
   so "{0}" in a translation stands for the first number in the English text. Text built by a page's own
   script goes through window.T("English with {name} slots", {name: value}).
   Anything inside translate="no" (the reference list, for example) is left alone. */
(function () {
  "use strict";
  var KEY = "manotsava-lang";
  /* The language menu, and the on/off switch: delete a language's entry (e.g.  ["ta", "தமிழ்"], ) to hide it
     until its translation has been checked. A switched-off language shows the pages in English. */
  var LANGS = [["en", "English"], ["kn", "ಕನ್ನಡ"], ["ta", "தமிழ்"], ["hi", "हिन्दी"], ["te", "తెలుగు"]];
  var ON = {};
  LANGS.forEach(function (l) { ON[l[0]] = true; });
  var FONT = { kn: "Noto Sans Kannada", ta: "Noto Sans Tamil", hi: "Noto Sans Devanagari", te: "Noto Sans Telugu" };
  var me = document.currentScript;
  var base = me && me.src ? me.src.replace(/[^\/]*$/, "") : "";
  var q = new URLSearchParams(location.search);
  var report = q.get("i18n") === "report";          /* lists untranslated text; used by check_i18n.py */
  var stored = true;

  /* ---------- which language ---------- */
  var urlLang = q.get("lang");
  var okCode = /^(en|kn|ta|hi|te|ml)$/;              /* ml: offered by the two interactive pages only */
  if (urlLang && (okCode.test(urlLang) || (report && urlLang === "zz"))) {
    try { localStorage.setItem(KEY, urlLang); } catch (e) { stored = false; }
  } else urlLang = null;
  var lang = "en";
  try { lang = localStorage.getItem(KEY) || "en"; } catch (e) { stored = false; }
  if (urlLang) lang = urlLang;
  var active = lang !== "en" && (ON[lang] || (report && (!!FONT[lang] || lang === "zz")));

  var pairs = null, dict = null, misses = report ? {} : null, missOrder = [];
  function norm(s) { return String(s).replace(/\s+/g, " ").trim(); }
  function load() {
    if (dict) return dict;
    dict = {};
    (window.SITE_I18N || []).forEach(function (p) { if (p && p[1]) dict[norm(p[0])] = p[1]; });
    return dict;
  }
  var MARK = "\u2063";   /* report mode: tags text that T() already handled, so it is not listed twice */
  function miss(k) {
    if (!misses || !/[A-Za-z]/.test(k) || k.indexOf(MARK) >= 0 || misses[k]) return;
    misses[k] = 1; missOrder.push(k);
  }
  function fill(s, v) {
    return v ? String(s).replace(/\{(\w+)\}/g, function (m, n) { return v[n] != null ? v[n] : m; }) : String(s);
  }

  /* Text built by page scripts: T("Districts with fewer than {min} people", {min: 10}) */
  window.T = function (s, v) {
    if (!active) return fill(s, v);
    var k = norm(s), tr = load()[k];
    if (tr == null && !/\{[a-z]\w*\}/.test(k) && /\d/.test(k)) {
      /* "Visit 2" is found under "Visit {0}", as on the page */
      tr = lookup(k, false);
    } else if (tr == null) miss(k);
    if (tr == null) tr = s;
    return (report ? MARK : "") + fill(tr, v);
  };
  window.SiteLang = { lang: active ? lang : "en", chosen: lang, list: LANGS };

  /* ---------- the language tabs ---------- */
  var TAB_CSS =
    ".i18n-bar{display:flex;justify-content:flex-end;align-items:center;gap:4px;padding:12px 0 0;line-height:1.2}" +
    ".i18n-bar>svg{width:18px;height:18px;flex:none;opacity:.7}" +
    ".i18n-tabs{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:2px}" +
    ".i18n-tabs button{font:inherit;font-size:15px;color:inherit;background:none;border:0;border-radius:0;" +
    "border-bottom:3px solid transparent;padding:8px 10px 6px;min-height:40px;cursor:pointer;opacity:.68;" +
    "white-space:nowrap;letter-spacing:0;text-transform:none}" +
    ".i18n-tabs button:hover{opacity:1;border-bottom-color:color-mix(in srgb,currentColor 35%,transparent)}" +
    ".i18n-tabs button[aria-pressed=true]{opacity:1;font-weight:700;border-bottom-color:currentColor;cursor:default}" +
    ".i18n-tabs button:focus-visible{outline:2px solid currentColor;outline-offset:2px}" +
    "@media (max-width:420px){.i18n-bar>svg{display:none}.i18n-tabs{gap:0}.i18n-tabs button{padding:8px 5px 6px;font-size:14px}}";
  function tabs(list, current, label, pick) {
    var nav = document.createElement("nav");
    nav.className = "i18n-tabs";
    nav.setAttribute("aria-label", label);
    nav.setAttribute("translate", "no");
    list.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.lang = l[0];
      b.textContent = l[1];
      b.setAttribute("data-en", "language " + l[0]);     /* analytics label (site.js) */
      b.setAttribute("aria-pressed", String(l[0] === current));
      b.addEventListener("click", function () { if (b.getAttribute("aria-pressed") !== "true") pick(l[0], nav); });
      nav.appendChild(b);
    });
    return nav;
  }
  function mark(nav, code) {
    [].forEach.call(nav.querySelectorAll("button"), function (b) { b.setAttribute("aria-pressed", String(b.lang === code)); });
  }

  /* The two interactive pages run their own translations (with Malayalam too) from a drop-down menu.
     Here it is shown as tabs: a tab sets that menu, and the page's own code does the rest. */
  if (me && me.hasAttribute("data-own-i18n")) {
    var own = document.createElement("style");
    own.textContent = TAB_CSS + ".langbar.i18n-own{position:static;justify-content:flex-end;margin-bottom:8px}" +
      ".langbar.i18n-own>label,.langbar.i18n-own>select{display:none}";
    document.head.appendChild(own);
    document.addEventListener("DOMContentLoaded", function () {
      var sel = document.getElementById("lang"), holder = sel && sel.closest(".langbar");
      if (!holder || !sel.options.length) return;
      var list = [].map.call(sel.options, function (o) { return [o.value, o.textContent]; });
      var nav = tabs(list, sel.value, sel.getAttribute("aria-label") || "Language", function (v, n) {
        sel.value = v;
        sel.dispatchEvent(new Event("change"));
        mark(n, v);
      });
      sel.addEventListener("change", function () { mark(nav, sel.value); });
      holder.appendChild(nav);
      holder.classList.add("i18n-own");
    });
    return;
  }

  if (active) {
    document.documentElement.lang = lang;
    document.documentElement.className += " i18n-wait";
    /* parser-blocking on purpose: the dictionary must be in place before the page's own scripts run */
    document.write('<script src="' + base + "lang/" + lang + '.js"><\/script>');
    if (FONT[lang]) document.write('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=' +
      FONT[lang].replace(/ /g, "+") + ':wght@400;600;700;800&display=swap">');
  }
  var css = document.createElement("style");
  css.textContent =
    "html.i18n-wait body{visibility:hidden}" + TAB_CSS +
    /* Indian scripts: no letter-spacing (it breaks joined letters), no capitals, more room between lines */
    "html:not([lang=en]) *{letter-spacing:0!important;text-transform:none!important}" +
    "html:not([lang=en]) body{line-height:1.7}" +
    "html:not([lang=en]) h1,html:not([lang=en]) h2,html:not([lang=en]) h3,html:not([lang=en]) h4{line-height:1.32;overflow-wrap:break-word}" +
    "html:not([lang=en]) .hero h1{font-size:clamp(32px,6.2vw,64px)}" +
    "html:not([lang=en]) h1{overflow-wrap:break-word}";
  document.head.appendChild(css);

  /* ---------- swapping the page's text ---------- */
  var INLINE = /^(A|B|I|EM|STRONG|SUP|SUB|SMALL|SPAN|BR|CODE|ABBR|MARK|U|S|Q|WBR|TIME|DFN|CITE|TSPAN)$/;
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|IFRAME|SELECT|OPTION|TEXTAREA|INPUT|DEFS|PATH|LINE|CIRCLE|RECT|POLYLINE|POLYGON)$/;
  var ATTRS = ["aria-label", "title", "alt", "placeholder"];
  var NUM = /\d+(?:[.,:]\d+)*/g;
  var done = new WeakMap(), attrDone = new WeakMap();   /* what was last written, so nothing is translated twice */

  /* "Step 4 of 6" -> key "Step {0} of {1}", numbers ["4", "6"]; numbers inside tags are left alone */
  function keyOf(s, isHtml) {
    var nums = [], parts = isHtml ? norm(s).split(/(<[^>]*>)/) : [norm(s)];
    var key = parts.map(function (p, i) {
      return i % 2 ? p : p.replace(NUM, function (m) { nums.push(m); return "{" + (nums.length - 1) + "}"; });
    }).join("");
    return { key: key, nums: nums };
  }
  function lookup(s, isHtml) {
    var k = keyOf(s, isHtml);
    if (!/[A-Za-z]/.test(k.key)) return null;
    var tr = load()[k.key];
    if (tr == null) { miss(k.key); return null; }
    return tr.replace(/\{(\d+)\}/g, function (m, i) { return k.nums[i] != null ? k.nums[i] : m; });
  }
  function letters(n) { return n.nodeType === 3 && /[A-Za-z]/.test(n.nodeValue); }
  function skip(el) {
    return SKIP.test(el.tagName.toUpperCase()) || el.getAttribute("translate") === "no" ||
           (el.classList && el.classList.contains("i18n-bar"));
  }
  function inlineOnly(el) {
    var all = el.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
      if (!INLINE.test(all[i].tagName.toUpperCase()) || all[i].id || all[i].hasAttribute("translate")) return false;
    }
    return true;
  }
  function attrs(el) {
    var seen = attrDone.get(el) || {};
    ATTRS.forEach(function (a) {
      var v = el.getAttribute(a);
      if (!v || seen[a] === v) return;
      var tr = lookup(v, false);
      if (tr != null) {
        if (!el.hasAttribute("data-en-label") && (a === "aria-label" || a === "title")) el.setAttribute("data-en-label", v);
        el.setAttribute(a, tr);
      }
      seen[a] = el.getAttribute(a);
    });
    attrDone.set(el, seen);
  }
  function walk(el) {
    if (skip(el)) return;
    attrs(el);
    var kids = el.childNodes, direct = false, i;
    for (i = 0; i < kids.length; i++) if (letters(kids[i])) { direct = true; break; }
    if (direct && inlineOnly(el)) {
      if (done.get(el) === el.innerHTML) return;
      var tr = lookup(el.innerHTML, true);
      if (tr != null) {
        /* keep the English for analytics labels (site.js) */
        if (/^(BUTTON|A|SUMMARY|LABEL)$/.test(el.tagName) && !el.hasAttribute("data-en")) el.setAttribute("data-en", norm(el.textContent));
        el.innerHTML = tr;
      }
      done.set(el, el.innerHTML);
      var inner = el.getElementsByTagName("*");
      for (i = 0; i < inner.length; i++) attrs(inner[i]);
      return;
    }
    for (i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.nodeType === 1) walk(c);
      else if (direct && letters(c) && done.get(c) !== c.nodeValue) {
        var t = lookup(c.nodeValue, false);
        if (t != null) c.nodeValue = c.nodeValue.replace(/^(\s*)[\s\S]*?(\s*)$/, "$1" + t.replace(/\$/g, "$$$$") + "$2");
        done.set(c, c.nodeValue);
      }
    }
  }
  function translateHead() {
    var t = lookup(document.title, false);
    if (t != null) document.title = t;
    var m = document.querySelector('meta[name="description"]');
    if (m) { var d = lookup(m.getAttribute("content") || "", false); if (d != null) m.setAttribute("content", d); }
  }

  /* ---------- the tabs at the top of the page ---------- */
  function bar() {
    var host = document.querySelector(".wrap") || document.body;
    var box = document.createElement("div");
    box.className = "i18n-bar";
    box.setAttribute("translate", "no");
    box.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
      '<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5' +
      'M12 2.5C9.4 5.3 8.1 8.5 8.1 12s1.3 6.7 3.9 9.5"/></svg>';
    box.appendChild(tabs(LANGS, active ? lang : "en", window.T("Language"), function (v) {
      var ok = true;
      try { localStorage.setItem(KEY, v); } catch (e) { ok = false; }
      if (!ok || q.has("lang")) {
        var u = new URL(location.href);
        u.searchParams.set("lang", v);
        location.replace(u.href);
      } else location.reload();
    }));
    host.insertBefore(box, host.firstChild);
  }

  function reportOut() {
    var pre = document.createElement("pre");
    pre.id = "i18n-report";
    pre.hidden = true;
    pre.textContent = JSON.stringify(missOrder);
    document.body.appendChild(pre);
  }

  function start() {
    try {
      bar();
      if (active) {
        /* Latin text keeps the page's own fonts; Indian-script letters come from the matching Noto font */
        if (FONT[lang]) {
          var cs = getComputedStyle(document.documentElement);
          ["--f-display", "--f-body", "--f-mono", "--f-head"].forEach(function (v) {
            var f = cs.getPropertyValue(v).trim();
            if (f) document.documentElement.style.setProperty(v, f.replace(/^([^,]+)/, "$1,'" + FONT[lang] + "'"));
          });
        }
        translateHead();
        walk(document.body);
        new MutationObserver(function (list) {
          list.forEach(function (m) {
            var t = m.type === "characterData" ? m.target.parentNode : m.target;
            if (t && t.nodeType === 1 && document.body.contains(t)) walk(t);
          });
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
      }
    } finally {
      document.documentElement.classList.remove("i18n-wait");
    }
    if (report) setTimeout(reportOut, 1200);
  }
  if (active) setTimeout(function () { document.documentElement.classList.remove("i18n-wait"); }, 3000);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
