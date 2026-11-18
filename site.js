/* Visitor gate + analytics for the Manotsava EEG pages.

   Loaded synchronously at the top of every page's <head>, after config.js.
   - Content pages: a visitor who has not filled the Google Form yet is sent to
     welcome.html first (and brought back to the page they asked for afterwards).
   - Analytics (GA4, Clarity) load only after the form is submitted, because the
     form is where the visitor agrees to them.
   This is a soft gate: a static site cannot stop someone who reads the source. */
(function () {
  var C = window.SITE_CONFIG || {};
  var KEY = "manotsava-eeg-visitor";
  var page = location.pathname.split("/").pop() || "index.html";
  var isGate = page === "welcome.html";
  var isOpen = isGate || page === "privacy.html";
  var gateOn = !!C.formEmbedUrl;

  /* ---------- remembering that the form was filled ---------- */
  function readPass() {
    var v = null;
    try { v = localStorage.getItem(KEY); } catch (e) {}
    if (!v) { try { v = sessionStorage.getItem(KEY); } catch (e) {} }
    if (!v && /(^|[#&])entered\b/.test(location.hash)) { writePass(); return true; }
    if (!v) return false;
    var t = +v;
    if (t && C.formValidDays > 0 && Date.now() - t > C.formValidDays * 864e5) return false;
    return true;
  }
  function writePass() {
    var v = String(Date.now()), ok = false;
    try { localStorage.setItem(KEY, v); ok = true; } catch (e) {}
    try { sessionStorage.setItem(KEY, v); ok = true; } catch (e) {}
    return ok;
  }
  function storageWorks() {
    try { localStorage.setItem(KEY + "-t", "1"); localStorage.removeItem(KEY + "-t"); return true; }
    catch (e) { return false; }
  }

  var passed = !gateOn || readPass();
  if (!isOpen && !passed) {
    /* the detour through the form would make every visit look "direct" in GA4,
       so keep where the visitor came from (referrer, utm_* tags) for the first analytics hit */
    try { sessionStorage.setItem(KEY + "-src", JSON.stringify({ ref: document.referrer, q: location.search })); } catch (e) {}
    location.replace("welcome.html?next=" + encodeURIComponent(page));
    return;
  }
  function arrival() {
    var out = {};
    try {
      var a = JSON.parse(sessionStorage.getItem(KEY + "-src") || "null");
      if (!a) return out;
      sessionStorage.removeItem(KEY + "-src");
      if (a.ref) out.page_referrer = a.ref;
      var q = new URLSearchParams(a.q || "");
      [["utm_source", "campaign_source"], ["utm_medium", "campaign_medium"], ["utm_campaign", "campaign_name"],
       ["utm_content", "campaign_content"], ["utm_term", "campaign_term"]].forEach(function (k) {
        if (q.get(k[0])) out[k[1]] = q.get(k[0]);
      });
    } catch (e) {}
    return out;
  }

  /* ---------- analytics ---------- */
  var loaded = false;
  function loadAnalytics() {
    if (loaded) return;
    loaded = true;
    if (C.ga4Id) {
      var g = document.createElement("script");
      g.async = true;
      g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(C.ga4Id);
      document.head.appendChild(g);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", C.ga4Id, arrival());
    }
    if (C.clarityId) {
      window.clarity = window.clarity || function () { (window.clarity.q = window.clarity.q || []).push(arguments); };
      var c = document.createElement("script");
      c.async = true;
      c.src = "https://www.clarity.ms/tag/" + encodeURIComponent(C.clarityId);
      document.head.appendChild(c);
    }
  }
  var sent = 0;
  function track(name, params) {
    if (!loaded || sent > 400) return;   /* cap per page view so a busy slider cannot flood GA */
    sent++;
    params = params || {};
    params.page = page;
    if (window.gtag) window.gtag("event", name, params);
    if (window.clarity) window.clarity("event", name);
  }

  /* what the visitor does on the interactive pages */
  function label(el) {
    var t = el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || el.name || el.id || el.tagName;
    return String(t).replace(/\s+/g, " ").trim().slice(0, 60);
  }
  var lastKey = "", lastAt = 0;
  function onUse(kind) {
    return function (e) {
      var el = e.target.closest ? e.target.closest("button,[role=tab],[role=button],a,summary,input,select") : null;
      if (!el) return;
      if (el.tagName === "A") {
        var href = el.getAttribute("href") || "";
        if (/\.pdf($|\?)/i.test(href)) track("pdf_open", { file: href.split("/").pop() });
        else if (/^https?:/i.test(href) && el.host !== location.host) track("outbound_link", { url: href.slice(0, 100) });
        return;
      }
      var key = kind + label(el), now = Date.now();
      if (key === lastKey && now - lastAt < 800) return;
      lastKey = key; lastAt = now;
      track(kind === "click" ? "ui_click" : "ui_change", { control: label(el) });
    };
  }
  var marks = [25, 50, 75, 100], hit = {};
  function onScroll() {
    var d = document.documentElement, max = d.scrollHeight - innerHeight;
    var pct = max > 0 ? Math.round(scrollY / max * 100) : 100;
    marks.forEach(function (m) {
      if (pct >= m && !hit[m]) { hit[m] = 1; track("scroll_depth", { percent: m }); }
    });
  }

  /* if the browser blocks storage, carry the pass along internal links instead */
  function carryPass() {
    if (!gateOn || storageWorks()) return;
    document.querySelectorAll("a[href$='.html']").forEach(function (a) {
      var h = a.getAttribute("href");
      if (!/^https?:/i.test(h) && h.indexOf("#") < 0) a.setAttribute("href", h + "#entered");
    });
  }

  function wire() {
    document.addEventListener("click", onUse("click"), true);
    document.addEventListener("change", onUse("change"), true);
    addEventListener("scroll", onScroll, { passive: true });
    carryPass();
  }

  window.ManotsavaSite = {
    config: C,
    /* called by welcome.html once the form has been submitted */
    formDone: function () {
      var stored = writePass();
      loadAnalytics();
      track("visitor_form_submitted", {});
      var next = new URLSearchParams(location.search).get("next") || "index.html";
      if (!/^[\w-]+\.html$/.test(next)) next = "index.html";
      return next + (stored ? "" : "#entered");
    },
    gateOn: gateOn
  };

  if (!isGate && passed) loadAnalytics();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
