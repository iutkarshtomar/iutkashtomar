const PROJECTS = [];
/* ^^^ EDIT ME — Utkarsh's projects live in the array above.
   Leave it empty and the site shows an honest "in the lab" state.
   Add objects like the example below and they render as cards automatically.
   Only `title` is required; everything else is optional.

   {
     title: "Project name",
     year: "2026",
     description: "What it does and why it matters, in a line or two.",
     tags: ["Python", "Backend"],
     links: { live: "https://example.com", code: "https://github.com/your-handle/repo" }
   },
*/

/* ==========================================================================
   UTKARSH SINGH TOMAR — portfolio · main script
   Lenis (smooth scroll) + GSAP ScrollTrigger + a WebGL aurora.
   Works from file:// — no modules, no fetch, no local pixel reads.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  // the <head> watchdog flips to .static if the CDN libraries stall; once it has, stay static
  // even if they arrive later (a motion build on the static layout would be half-wired)
  window.__ustBooted = true;
  if (window.__ustWatchdog) clearTimeout(window.__ustWatchdog);
  var motion = !reduce && hasGSAP && !doc.classList.contains('static');
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var isMobile = window.matchMedia('(max-width: 720px)').matches;

  if (!motion) { doc.classList.remove('motion'); doc.classList.add('static'); }

  try { window.scrollTo(0, 0); } catch (e) { /* noop */ }

  /* ------------------------------------------------------------------ utils */
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    return /^(https?:|mailto:)/i.test(u) ? u : '';
  }

  /* Split an element's text into word spans, preserving inline elements (em, strong). */
  function splitWords(root, cls) {
    var words = [];
    (function walk(node) {
      var kids = Array.prototype.slice.call(node.childNodes);
      kids.forEach(function (k) {
        if (k.nodeType === 3) {
          var parts = k.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span');
            s.className = cls;
            s.textContent = p;
            frag.appendChild(s);
            words.push(s);
          });
          node.replaceChild(frag, k);
        } else if (k.nodeType === 1) {
          walk(k);
        }
      });
    })(root);
    return words;
  }

  /* =======================================================================
     PROJECTS — render from the editable array
     ======================================================================= */
  function renderProjects() {
    var host = $('#projects');
    if (!host) return;
    var list = Array.isArray(PROJECTS) ? PROJECTS.filter(function (p) { return p && p.title; }) : [];

    if (!list.length) {
      // "Selected work." would promise work the lab card says isn't out yet
      var hs = $$('#work .sec-title .reveal-line > span');
      if (hs.length === 2) { hs[0].textContent = 'Next'; hs[1].textContent = 'up.'; }
      host.innerHTML =
        '<div class="lab" data-reveal>' +
          '<div class="lab-copy">' +
            '<p class="lab-kicker mono"><span class="dot-live"></span>status: in the lab</p>' +
            '<h3 class="lab-title">In the <em class="grad">lab.</em></h3>' +
            '<p class="lab-text">Projects are compiling behind closed doors. When they ship, they land right here — first.</p>' +
            '<div class="lab-log mono" aria-hidden="true">' +
              '<p><b>$</b> make projects</p>' +
              '<p>compiling projects<span class="dots"></span></p>' +
              '<p>shipped ........ <span class="ok">dropping soon</span></p>' +
            '</div>' +
            '<figure class="mini-quote mini-quote--lab">' +
              '<blockquote><p>“The best way to predict the future is to invent it.”</p></blockquote>' +
              '<figcaption class="q-attr q-attr--start"><span class="q-attr-line" aria-hidden="true"></span><cite class="q-attr-name mono">Alan Kay</cite></figcaption>' +
            '</figure>' +
          '</div>' +
          '<div class="lab-orb" aria-hidden="true">' +
            '<span class="ring"><i></i></span><span class="ring"><i></i></span><span class="ring"><i></i></span>' +
            '<span class="lab-core"></span>' +
            '<span class="lab-orb-label mono">build in progress</span>' +
          '</div>' +
        '</div>';
      return;
    }

    var html = '<div class="proj-grid">';
    list.forEach(function (p, i) {
      var tags = Array.isArray(p.tags) ? p.tags : [];
      var links = p.links || {};
      var live = safeUrl(links.live), code = safeUrl(links.code);
      html +=
        '<article class="proj" data-reveal data-tilt>' +
          '<div class="proj-top mono"><span>' + pad(i + 1, 2) + ' / ' + pad(list.length, 2) + '</span><span>' + esc(p.year || '') + '</span></div>' +
          '<h3 class="proj-title">' + esc(p.title) + '</h3>' +
          (p.description ? '<p class="proj-desc">' + esc(p.description) + '</p>' : '') +
          (tags.length ? '<ul class="proj-tags">' + tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '') +
          ((live || code) ? '<div class="proj-links">' +
            (live ? '<a class="btn" href="' + esc(live) + '" target="_blank" rel="noopener noreferrer" data-magnetic data-cursor="Open"><span class="btn-fill" aria-hidden="true"></span><span class="btn-label">Live</span><span class="btn-ico" aria-hidden="true">↗</span></a>' : '') +
            (code ? '<a class="btn" href="' + esc(code) + '" target="_blank" rel="noopener noreferrer" data-magnetic data-cursor="Code"><span class="btn-fill" aria-hidden="true"></span><span class="btn-label">Code</span><span class="btn-ico" aria-hidden="true">↗</span></a>' : '') +
          '</div>' : '') +
        '</article>';
    });
    html += '</div>';
    host.innerHTML = html;
  }

  /* =======================================================================
     IST CLOCK · DEGREE PROGRESS · COPY EMAIL · MENU
     ======================================================================= */
  var bootAt = Date.now() - ((window.performance && performance.now) ? performance.now() : 0);
  function initClock() {
    var nodes = $$('[data-ist]');
    var up = $('#uptime');
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    } catch (e) { fmt = null; }
    function tick() {
      var s;
      if (fmt) { s = fmt.format(new Date()); }
      else {
        var d = new Date(Date.now() + (330 + new Date().getTimezoneOffset()) * 60000);
        s = pad(d.getHours(), 2) + ':' + pad(d.getMinutes(), 2) + ':' + pad(d.getSeconds(), 2);
      }
      nodes.forEach(function (n) { n.textContent = n.id === 'clock' ? s : 'IST ' + s.slice(0, 5); });
      if (up) {
        var t = Math.max(0, Math.floor((Date.now() - bootAt) / 1000));
        up.textContent = pad(Math.floor(t / 3600), 2) + ':' + pad(Math.floor(t / 60) % 60, 2) + ':' + pad(t % 60, 2);
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  var degree = { p: 0, year: 1 };
  function initDegree() {
    var start = new Date(2025, 7, 1).getTime();      // Aug 2025
    var end = new Date(2029, 6, 31).getTime();       // Jul 2029
    var now = Date.now();
    var p = clamp((now - start) / (end - start), 0, 1);
    var year = clamp(Math.floor((now - start) / (365.25 * 864e5)) + 1, 1, 4);
    degree.p = p; degree.year = year;
    var pct = (p * 100).toFixed(1) + '%';
    var fill = $('#degreeFill'), dot = $('#degreeDot'), bar = $('#degreeBar');
    if (fill) fill.style.width = (p * 100) + '%';
    if (dot) dot.style.left = (p * 100) + '%';
    if (bar) bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    var pctEl = $('#degreePct'); if (pctEl) pctEl.textContent = pct;
    var yEl = $('#degreeYear');
    if (yEl) yEl.textContent = (p >= 1 ? 'Graduated' : 'Year ' + year + ' of 4') + ' · BU’29';
    // the hero role and the About "Year" fact follow the same calendar (no drift each August)
    var WORD = ['Freshman', 'Sophomore', 'Junior', 'Senior'], ORD = ['1st', '2nd', '3rd', '4th'];
    $$('[data-year-word]').forEach(function (n) { n.textContent = p >= 1 ? 'Graduate' : WORD[year - 1]; });
    var fy = $('#factYear');
    if (fy) fy.textContent = p >= 1 ? 'Graduated — BU’29' : WORD[year - 1] + ' — ' + ORD[year - 1] + ' year';
  }

  function initCopy() {
    var btn = $('#copyBtn'), label = $('#copyLabel'), toast = $('#toast');
    if (!btn) return;
    var email = btn.getAttribute('data-email');
    var timer;
    function done(ok) {
      clearTimeout(timer);
      btn.classList.toggle('is-copied', ok);
      label.textContent = ok ? 'Copied ✓' : 'Selected ✓';
      toast.textContent = ok ? 'Email copied — go say hi ✦' : 'Email selected — press ⌘/Ctrl + C';
      if (!ok) {
        try {
          var t = $('.contact-mail-text');
          var sel = window.getSelection();
          if (t && sel) { sel.removeAllRanges(); var r = document.createRange(); r.selectNodeContents(t); sel.addRange(r); }
        } catch (e) { /* noop */ }
      }
      toast.classList.add('is-on');
      timer = setTimeout(function () {
        btn.classList.remove('is-copied');
        label.textContent = 'Copy email';
        toast.classList.remove('is-on');
      }, 2400);
    }
    function fallback() {
      try {
        var ta = document.createElement('textarea');
        ta.value = email; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0'; ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand('copy');
        document.body.removeChild(ta);
        done(!!ok);
      } catch (e) { done(false); }
    }
    btn.addEventListener('click', function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(function () { done(true); }, fallback);
      } else { fallback(); }
    });
  }

  var lenis = null;

  function scrollToTarget(target) {
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.8, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    } else {
      var el = typeof target === 'number' ? null : target;
      if (el) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      else window.scrollTo({ top: target || 0, behavior: reduce ? 'auto' : 'smooth' });
    }
  }

  var menuOpen = false;
  /* while the menu is open, everything behind it is inert: Tab can't wander
     into the hidden page (and scroll it) behind the overlay */
  function setBackdropInert(on) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el.id === 'nav' || el.id === 'menu' || el.tagName === 'SCRIPT') return;
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function setMenu(open) {
    var menu = $('#menu'), btn = $('#menuBtn');
    if (!menu || !btn) return;
    menuOpen = open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.nav-menu-label', btn).textContent = open ? 'Close' : 'Menu';
    setBackdropInert(open);
    if (open) {
      if (hud.nav) setNavHidden(false);
      menu.hidden = false;
      if (lenis) lenis.stop();
      if (motion) {
        gsap.fromTo($$('.menu-links a', menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: .7, stagger: .05, ease: 'expo.out' });
        gsap.fromTo(menu, { opacity: 0 }, { opacity: 1, duration: .35 });
      }
      var first = $('.menu-links a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.hidden = true;
      if (lenis) lenis.start();
    }
  }

  function initNavLinks() {
    var btn = $('#menuBtn');
    if (btn) btn.addEventListener('click', function () { setMenu(!menuOpen); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); if (btn) btn.focus(); }
      // fallback for browsers without `inert`: wrap Tab between the menu button and the last link
      if (e.key === 'Tab' && menuOpen && btn && !('inert' in HTMLElement.prototype)) {
        var links = $$('#menu a');
        var last = links[links.length - 1];
        if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); btn.focus(); }
        else if (e.shiftKey && document.activeElement === btn) { e.preventDefault(); last.focus(); }
      }
    });
    $$('a[data-scroll]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href') || '';
        if (href.charAt(0) !== '#') return;
        var target = href === '#top' ? 0 : $(href);
        if (target === null) return;
        e.preventDefault();
        if (menuOpen) setMenu(false);
        scrollToTarget(target);
        if (target && target.focus && typeof target !== 'number') {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
          setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (err) { /* noop */ } }, 50);
        }
      });
    });
  }

  /* =======================================================================
     AURORA FIELD (WebGL background, js/aura.js)
     ======================================================================= */
  var aura = null;
  var focusState = { heroY: 0, heroX: 0.5, heroH: 1 };
  function initAura() {
    var canvas = $('#aura');
    if (!canvas || !window.AuraField) return;
    aura = new window.AuraField(canvas, { static: !motion, mobile: isMobile });
    if (!aura.ok) { aura = null; return; }
    measureHero();
    updateAuraFocus(0);
    if (motion) {
      aura.start();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) aura.stop(); else aura.start();
      });
    } else {
      aura.render(true);
    }
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { aura.resize(); measureHero(); }, 120);
    });
  }

  function measureHero() {
    var fig = $('#heroFigure');
    if (!fig) return;
    var r = fig.getBoundingClientRect();
    var sy = window.scrollY || 0;
    focusState.heroX = (r.left + r.width * 0.49) / window.innerWidth;
    focusState.heroY = r.top + sy + r.height * 0.36;
    focusState.heroH = ($('.hero') || fig).offsetHeight;
  }

  var activeAura = 1;
  var inQuote = false;
  function updateAuraFocus(scroll) {
    if (!aura) return;
    var vh = window.innerHeight;
    if (scroll < focusState.heroH) {
      var y = focusState.heroY - scroll;
      var k = 1 - clamp(scroll / focusState.heroH, 0, 1);
      aura.setFocus(focusState.heroX, 1 - y / vh, 0.35 + 0.65 * k);
    } else if (inQuote) {
      aura.setFocus(0.5, 0.5, 0.55);
    } else {
      aura.setFocus(0.5, 0.45, 0.12);
    }
  }

  /* =======================================================================
     HUD — progress bar, scroll meter, section label, nav state
     ======================================================================= */
  var hud = {};
  function initHudRefs() {
    hud.bar = $('#progressBar');
    hud.meter = $('#meterBar');
    hud.val = $('#meterVal');
    hud.nav = $('#nav');
    hud.box = $('.hud');
    hud.last = -1;
    hud.scrolled = false;
    hud.on = null;
    hud.lastY = 0;
    hud.hidden = false;
    hud.navFocus = false;
    if (hud.nav && !hud.nav.__bound) {
      hud.nav.__bound = true;
      hud.nav.addEventListener('focusin', function () { hud.navFocus = true; setNavHidden(false); });
      hud.nav.addEventListener('focusout', function () { hud.navFocus = false; });
    }
  }
  function setNavHidden(h) {
    if (h === hud.hidden || !hud.nav) return;
    hud.hidden = h;
    hud.nav.classList.toggle('is-hidden', h);
  }
  function updateNav(scroll) {
    var d = scroll - hud.lastY;
    hud.lastY = scroll;
    if (hud.holdNav) { hud.holdNav = false; setNavHidden(false); return; }
    if (scroll < window.innerHeight * 0.5 || menuOpen || hud.navFocus) setNavHidden(false);
    else if (d > 4) setNavHidden(true);
    else if (d < -4) setNavHidden(false);
  }
  function updateHud(scroll, progress) {
    if (hud.bar) hud.bar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    if (hud.meter) hud.meter.style.transform = 'scaleY(' + progress.toFixed(4) + ')';
    var v = Math.round(progress * 100);
    if (v !== hud.last && hud.val) {
      hud.last = v;
      hud.val.textContent = pad(v, 3) + '%';
    }
    var on = scroll > window.innerHeight * 0.55 && !hud.off;
    if (on !== hud.on && hud.box) {
      hud.on = on;
      hud.box.classList.toggle('is-on', on);
    }
    var s = scroll > 40;
    if (s !== hud.scrolled && hud.nav) {
      hud.scrolled = s;
      hud.nav.classList.toggle('is-scrolled', s);
    }
    updateNav(scroll);
    if (aura) aura.set('scroll', progress);
    updateAuraFocus(scroll);
  }

  /* =======================================================================
     STATIC MODE (reduced motion or no GSAP): everything visible, native scroll
     ======================================================================= */
  function initStatic() {
    var pre = $('#preloader');
    if (pre) pre.classList.add('is-done');
    initHudRefs();
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        var sc = window.scrollY || 0;
        updateHud(sc, clamp(sc / max, 0, 1));
        if (aura) aura.render(true);
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    // Section label for the HUD, without ScrollTrigger
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setSectionLabel(en.target); });
      }, { rootMargin: '-50% 0px -50% 0px' });
      $$('[data-section]').forEach(function (s) { io.observe(s); });
    }
    var target = hashTarget();
    if (target) { try { target.scrollIntoView(); } catch (e) { /* noop */ } }
  }

  function hashTarget() {
    var h = location.hash;
    if (!h || h.length < 2 || h === '#top') return null;
    try { return document.getElementById(decodeURIComponent(h.slice(1))); } catch (e) { return null; }
  }

  var hudIdx, hudName, hudSep;
  function setSectionLabel(sec) {
    hudIdx = hudIdx || $('#hudIdx');
    hudName = hudName || $('#hudName');
    hudSep = hudSep || $('#hudSep');
    if (!hudIdx || !hudName) return;
    var idx = sec.getAttribute('data-section');
    var label = sec.getAttribute('data-label');
    hud.off = sec.hasAttribute('data-hud-off');
    if (hud.box && hud.on !== null) {
      var vis = (window.scrollY || 0) > window.innerHeight * 0.55 && !hud.off;
      if (vis !== hud.on) { hud.on = vis; hud.box.classList.toggle('is-on', vis); }
    }
    if (hudName.textContent !== label) {
      var isQ = idx === '—';
      hudIdx.textContent = isQ ? '✦' : idx;
      if (hudSep) hudSep.textContent = isQ ? '' : '/07';
      hudName.textContent = label;
    }
    var id = sec.id;
    $$('.nav-links a').forEach(function (a) {
      a.classList.toggle('is-active', !!id && a.getAttribute('href') === '#' + id);
    });
  }

  /* =======================================================================
     MOTION MODE
     ======================================================================= */
  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    gsap.defaults({ ease: 'expo.out' });

    /* --- Lenis, wired exactly as specified --- */
    if (window.Lenis) {
      lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
      window.lenis = lenis;
      lenis.stop();
    }

    initHudRefs();
    function readScroll() {
      if (lenis) return { s: lenis.scroll, p: clamp(lenis.progress || 0, 0, 1) };
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var sc = window.scrollY || 0;
      return { s: sc, p: clamp(sc / max, 0, 1) };
    }
    if (lenis) lenis.on('scroll', function (e) { updateHud(e.scroll, clamp(e.progress || 0, 0, 1)); });
    else window.addEventListener('scroll', function () { var r = readScroll(); updateHud(r.s, r.p); }, { passive: true });

    buildIntro();
    buildHeroScroll();
    buildQuotes();
    buildReveals();
    buildAbout();
    buildStack();
    buildCerts();
    buildEducation();
    buildNow();
    buildFooter();
    buildSectionTracking();
    initMarquees();
    initCursor();
    initMagnetic();
    initTilt();

    if (pendingFinish) { var pf = pendingFinish; pendingFinish = null; pf(); }
    initResizeAnchor();

    // Refresh once fonts & images have settled (positions depend on them)
    var refresh = function () { ScrollTrigger.refresh(); measureHero(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(refresh, 60); });
    window.addEventListener('load', function () { setTimeout(refresh, 120); });
    ScrollTrigger.addEventListener('refresh', function () { measureHero(); var r = readScroll(); updateHud(r.s, r.p); });
  }

  /* --------------------------------------------------------- preloader + hero intro
     ≤ 2.0s to unlock. Click / tap / any key skips it. A sessionStorage flag
     (set by the inline <head> script as html.intro-seen) skips it on repeat
     visits in the same tab. Afterwards a #hash in the URL is honoured. */
  var pendingFinish = null;
  function buildIntro() {
    var pre = $('#preloader');
    var count = $('#plCount'), bar = $('#plBar');
    var word = $('.pl-word');
    var finished = false, heroPlayed = false;
    var seen = doc.classList.contains('intro-seen');

    // hero initial states (hidden behind the preloader)
    var chars = $$('.hero-name .ch');
    var figInner = $('.hero-figure-inner');
    var lastSpans = $$('.hero-last span');
    var metas = $$('.hero-top-meta > *, .hero-role-line, .hero-tag, .hero-scroll');
    gsap.set(chars, { yPercent: 105 });
    gsap.set(figInner, { y: 70, scale: 0.94, opacity: 0, filter: 'blur(14px)' });
    gsap.set(lastSpans, { yPercent: 110, opacity: 0 });
    gsap.set(metas, { y: 18, opacity: 0 });
    gsap.set('.hero-halo', { opacity: 0 });
    gsap.set('#nav', { y: -20, opacity: 0 });

    function heroIn() {
      if (heroPlayed) return;
      heroPlayed = true;
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to('.hero-halo', { opacity: 1, duration: 1.6, ease: 'power2.out' }, 0)
        .to(chars, { yPercent: 0, duration: 1.15, stagger: 0.055 }, 0.02)
        .to(figInner, { y: 0, scale: 1, opacity: 1, filter: 'blur(0px)', duration: 1.25, clearProps: 'filter' }, 0.12)
        .to(lastSpans, { yPercent: 0, opacity: 1, duration: 1.0, stagger: 0.08 }, 0.38)
        .to(metas, { y: 0, opacity: 1, duration: 0.9, stagger: 0.05 }, 0.45)
        .to('#nav', { y: 0, opacity: 1, duration: 0.9, clearProps: 'transform,opacity' }, 0.4);
      if (aura) { aura.cur.fa = 0; }
    }

    var hashEl = null, hashY = null;
    function goToHash() {
      hashEl = hashTarget();
      if (!hashEl) return;
      ScrollTrigger.refresh();
      hud.holdNav = true; // a deep-link jump is not a "scroll down": keep the nav visible
      if (lenis) lenis.scrollTo(hashEl, { immediate: true, force: true });
      else hashEl.scrollIntoView();
      hashY = Math.round(window.scrollY || 0);
      ScrollTrigger.update();
    }
    // late layout shifts (fonts / images) move the target: re-seat once if the visitor hasn't scrolled yet
    ScrollTrigger.addEventListener('refresh', function () {
      if (!hashEl || hashY === null) return;
      if (Math.abs((window.scrollY || 0) - hashY) > 2) { hashY = null; return; }
      var top = hashEl.getBoundingClientRect().top;
      if (Math.abs(top) > 2 && lenis) {
        hud.holdNav = true; // a re-seat is not a "scroll down" either
        lenis.scrollTo(hashEl, { immediate: true, force: true });
        hashY = Math.round(window.scrollY || 0);
      }
    });

    function finish(fade) {
      if (finished) return;
      finished = true;
      detachSkip();
      try { sessionStorage.setItem('ust:intro', '1'); } catch (e) { /* storage blocked */ }
      try {
        if (pre && !fade) pre.classList.add('is-done');
        if (lenis) { lenis.scrollTo(0, { immediate: true, force: true }); }
        window.scrollTo(0, 0);
      } finally {
        if (lenis) lenis.start();
      }
      goToHash();
    }

    function skip() {
      if (finished) return;
      if (tl) tl.kill();
      heroIn();
      if (pre) {
        gsap.to(pre, {
          opacity: 0, duration: 0.35, ease: 'power2.out', overwrite: true,
          onComplete: function () { pre.classList.add('is-done'); }
        });
      }
      finish(true);
    }
    var PASS_KEYS = ['Tab', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn'];
    var SCROLL_KEYS = [' ', 'Spacebar', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'End', 'Home'];
    function onKey(e) {
      if (PASS_KEYS.indexOf(e.key) > -1) return;
      // skip() unlocks scrolling synchronously: without this, the same Space / PageDown
      // would then scroll the page natively and land the visitor past the hero
      if (SCROLL_KEYS.indexOf(e.key) > -1 && !e.metaKey && !e.ctrlKey && !e.altKey) e.preventDefault();
      skip();
    }
    function detachSkip() {
      window.removeEventListener('pointerdown', skip, true);
      window.removeEventListener('keydown', onKey, true);
    }

    if (!pre || seen) {
      if (pre) pre.classList.add('is-done');
      heroIn();
      // finish() (and its #hash jump) runs at the end of initMotion, once every
      // section — the pinned stack especially — has its final height
      pendingFinish = finish;
      return;
    }

    window.addEventListener('pointerdown', skip, true);
    window.addEventListener('keydown', onKey, true);

    var counter = { v: 0 };
    var tl = gsap.timeline();
    tl.fromTo(word, { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'expo.out' }, 0.05)
      .to(counter, {
        v: 100, duration: 1.2, ease: 'power2.inOut',
        onUpdate: function () { if (count) count.textContent = pad(Math.round(counter.v), 3); }
      }, 0.05)
      .fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: 'power2.inOut' }, 0.05)
      .fromTo('.pl-glow', { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1.15, duration: 1.3, ease: 'power2.out' }, 0.05)
      .to('.pl-inner, .pl-skip', { y: -40, opacity: 0, duration: 0.4, ease: 'power2.in' }, 1.25)
      .fromTo(pre, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.7, ease: 'expo.inOut' }, 1.3)
      .call(heroIn, null, 1.45)
      .call(finish, null, 2.0);

    // hard failsafe: never leave the page locked
    setTimeout(function () { heroIn(); finish(); }, 2500);
  }

  /* --------------------------------------------------------- hero scroll parallax */
  function buildHeroScroll() {
    var hero = $('.hero');
    if (!hero) return;
    var chars = $$('.hero-name .ch');
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      // invalidateOnRefresh: the letter spread is width-based, so re-measure after a resize
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true }
    });
    tl.to('.hero-name-inner', { yPercent: 55 }, 0)
      .fromTo(chars, { x: 0 }, { x: function (i) { return (i - 3) * window.innerWidth * 0.022; } }, 0)
      .to('#heroFigure', { yPercent: 12, scale: 1.05 }, 0)
      .to('.hero-last', { yPercent: -70 }, 0)
      .to('.hero-bottom, .hero-top-meta, .hero-role', { y: -60, opacity: 0 }, 0);

    // pointer parallax (fine pointers only)
    if (finePointer) {
      var pic = $('.hero-figure picture');
      var nm = $('.hero-name');
      var qx1 = gsap.quickTo(pic, 'x', { duration: 1.2, ease: 'power3.out' });
      var qy1 = gsap.quickTo(pic, 'y', { duration: 1.2, ease: 'power3.out' });
      var qx2 = gsap.quickTo(nm, 'x', { duration: 1.4, ease: 'power3.out' });
      hero.addEventListener('pointermove', function (e) {
        var nx = e.clientX / window.innerWidth - 0.5;
        var ny = e.clientY / window.innerHeight - 0.5;
        qx1(nx * 18); qy1(ny * 10); qx2(nx * -26);
      });
    }
  }

  /* --------------------------------------------------------- quote interstitials
     Geometry (see CSS): a stage of height h pinned at t is held from
     "top t%" until "bottom (t + h)%". Every reveal below finishes with a short
     hold (15–25vh) before the unpin, so the full line + attribution always get
     their moment. */
  var GRAD_STOPS = [[0, [165, 139, 255]], [0.46, [241, 59, 184]], [0.6, [255, 154, 217]], [1, [91, 140, 255]]];
  function gradAt(t) {
    t = clamp(t, 0, 1);
    for (var i = 1; i < GRAD_STOPS.length; i++) {
      var a = GRAD_STOPS[i - 1], b = GRAD_STOPS[i];
      if (t <= b[0]) {
        var k = (t - a[0]) / (b[0] - a[0] || 1);
        return 'rgb(' + [0, 1, 2].map(function (j) { return Math.round(a[1][j] + (b[1][j] - a[1][j]) * k); }).join(',') + ')';
      }
    }
    return 'rgb(91,140,255)';
  }

  /* Split into per-character spans, words kept unbreakable. */
  function splitChars(root) {
    var chars = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (k) {
        if (k.nodeType === 3) {
          var frag = document.createDocumentFragment();
          k.textContent.split(/(\s+)/).forEach(function (w) {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
            var ws = document.createElement('span');
            ws.className = 't-w';
            Array.prototype.forEach.call(w, function (ch) {
              var c = document.createElement('span');
              c.className = 't-ch';
              c.textContent = ch;
              ws.appendChild(c);
              chars.push(c);
            });
            frag.appendChild(ws);
          });
          node.replaceChild(frag, k);
        } else if (k.nodeType === 1) { walk(k); }
      });
    })(root);
    return chars;
  }

  function attrTo(tl, q, at) {
    var line = $('.q-attr-line', q);
    var txt = $$('.q-attr-name, .q-attr-src', q);
    if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.14, ease: 'none' }, at);
    if (txt.length) tl.fromTo(txt, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.12, stagger: 0.03, ease: 'none' }, at + 0.03);
  }

  function buildQuotes() {
    $$('.quote').forEach(function (q) {
      var type = q.getAttribute('data-quote');
      var cap = $('.q-line', q);
      if (cap) {
        gsap.fromTo(cap, { scaleX: 0 }, {
          scaleX: 1, ease: 'none', transformOrigin: 'left',
          scrollTrigger: { trigger: q, start: 'top 90%', end: 'top 30%', scrub: 0.4 }
        });
      }
      var tl;

      if (type === 'typed') {
        var bq = $('.quote-text', q);
        var tp = $('p', bq);
        var said = tp.textContent.replace(/\s+/g, ' ').trim();
        var chars = splitChars(tp);
        // screen readers get the line once, whole — not hundreds of one-letter spans
        $$('.t-w', tp).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
        var srq = document.createElement('span');
        srq.className = 'sr-only';
        srq.textContent = said;
        tp.insertBefore(srq, tp.firstChild);
        var gchars = chars.filter(function (c) { return !!(c.closest && c.closest('.grad')); });
        gchars.forEach(function (c, i) { c.style.color = gradAt(gchars.length > 1 ? i / (gchars.length - 1) : 0); });
        bq.classList.add('is-split');
        var caret = document.createElement('span');
        caret.className = 't-caret';
        caret.setAttribute('aria-hidden', 'true');
        var shown = -1;
        var setN = function (n) {
          n = clamp(n, 0, chars.length);
          if (n === shown) return;
          for (var i = 0; i < chars.length; i++) chars[i].classList.toggle('is-on', i < n);
          if (n === 0) chars[0].parentNode.insertBefore(caret, chars[0]);
          else chars[n - 1].parentNode.insertBefore(caret, chars[n - 1].nextSibling);
          shown = n;
        };
        setN(0);
        var proxy = { p: 0 };
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 72%', end: isMobile ? 'top -6%' : 'top -12%', scrub: 0.3 } });
        tl.to(proxy, { p: 1, duration: 0.8, onUpdate: function () { setN(Math.round(proxy.p * chars.length)); } }, 0);
        attrTo(tl, q, 0.8);
      }

      if (type === 'glow') {
        var p = $('.quote-text p', q);
        var words = splitWords(p, 'q-word');
        var sticky = $('.quote-sticky', q);
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 74%', end: isMobile ? 'top -8%' : 'top -14%', scrub: 0.4 } });
        tl.fromTo(words,
          { opacity: 0.3, yPercent: 24, filter: 'blur(8px)' },
          { opacity: 1, yPercent: 0, filter: 'blur(0px)', duration: 0.5, stagger: 0.3 / Math.max(1, words.length - 1) }, 0);
        if (q.classList.contains('quote--surge') && sticky) {
          tl.fromTo(sticky, { '--surge': 0 }, { '--surge': 1, duration: 0.8 }, 0);
        }
        attrTo(tl, q, 0.8);
      }

      if (type === 'drift') {
        var l = $('.drift-l', q), r = $('.drift-r', q);
        var amt = isMobile ? 6 : 20; // phones: gentle enough that the glyphs stay inside the gutter
        gsap.fromTo(l, { x: function () { return -window.innerWidth * amt / 100; } }, {
          x: function () { return window.innerWidth * amt / 100 * 0.6; }, ease: 'none',
          scrollTrigger: { trigger: q, start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true }
        });
        gsap.fromTo(r, { x: function () { return window.innerWidth * amt / 100; } }, {
          x: function () { return -window.innerWidth * amt / 100 * 0.6; }, ease: 'none',
          scrollTrigger: { trigger: q, start: 'top bottom', end: 'bottom top', scrub: 0.5, invalidateOnRefresh: true }
        });
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 88%', end: 'top 18%', scrub: 0.4 } });
        tl.fromTo([l, r], { opacity: 0.25 }, { opacity: 1, duration: 0.7, stagger: 0.12 }, 0);
        attrTo(tl, q, 0.72);
      }

      if (type === 'wide') {
        var line = $('.wide-line', q);
        // the line rises into view with its head parked at +12vw and only starts crawling
        // just before the stage pins (pin top = 24vh), so the pinned line always opens on
        // "Everybody"; the section is taller (css) to keep the crawl's pace
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 30%', end: 'bottom 86%', scrub: 0.35, invalidateOnRefresh: true } });
        tl.fromTo(line,
          { x: function () { return window.innerWidth * 0.12; } },
          { x: function () { return -(line.scrollWidth - window.innerWidth * (isMobile ? 0.92 : 0.86)); }, duration: 1 }, 0);
        attrTo(tl, q, 0.45);
      }

      if (type === 'fill') {
        var top = $('.fill-top', q);
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 66%', end: isMobile ? 'top -6%' : 'top -12%', scrub: 0.35 } });
        tl.fromTo(top, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8 }, 0);
        attrTo(tl, q, 0.8);
      }

      if (type === 'stack') {
        var stks = $$('.stk', q);
        gsap.set(stks[0], { transformOrigin: 'left center' });
        gsap.set(stks[1], { transformOrigin: 'center center' });
        gsap.set(stks[2], { transformOrigin: 'right center' });
        tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: q, start: 'top 72%', end: isMobile ? 'top -12%' : 'top -20%', scrub: 0.4 } });
        tl.fromTo(stks,
          { opacity: 0.14, scale: 0.8, yPercent: 30 },
          { opacity: 1, scale: 1, yPercent: 0, duration: 0.44, stagger: 0.18 }, 0);
        attrTo(tl, q, 0.84);
      }
    });
  }

  /* --------------------------------------------------------- generic reveals */
  function buildReveals() {
    $$('.sec-title, .contact-title').forEach(function (t) {
      var spans = $$('.reveal-line > span', t);
      if (!spans.length) return;
      gsap.from(spans, {
        yPercent: 112, duration: 1, stagger: 0.08, ease: 'expo.out',
        scrollTrigger: { trigger: t, start: 'top 94%', once: true }
      });
    });

    $$('[data-reveal]').forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 0.95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 95%', once: true }
      });
    });

    $$('[data-reveal-group]').forEach(function (g) {
      gsap.from(g.children, {
        y: 30, opacity: 0, duration: 0.85, stagger: 0.06, ease: 'power3.out',
        scrollTrigger: { trigger: g, start: 'top 95%', once: true }
      });
    });

    $$('.sec-idx, .sec-sub, .stack-note, .certs-note, .contact-mail, .contact-actions .btn').forEach(function (el) {
      gsap.from(el, {
        y: 24, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 96%', once: true }
      });
    });
  }

  /* --------------------------------------------------------- about */
  function buildAbout() {
    var lead = $('[data-lit]');
    if (lead) {
      var words = splitWords(lead, 'lit-word');
      gsap.fromTo(words, { opacity: 0.24 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: lead, start: 'top 82%', end: isMobile ? 'bottom 62%' : 'bottom 52%', scrub: 0.3 }
      });
    }
    var img = $('.about-portrait img');
    if (img) {
      gsap.fromTo(img, { yPercent: 0 }, {
        yPercent: -15, ease: 'none',
        scrollTrigger: { trigger: '.about-portrait', start: 'top bottom', end: 'bottom top', scrub: 0.4 }
      });
    }
  }

  /* --------------------------------------------------------- stack (horizontal on desktop) */
  function buildStack() {
    var section = $('#stack'), track = $('#stackTrack');
    if (!section || !track) return;
    var mm = gsap.matchMedia();

    mm.add('(min-width: 1024px)', function () {
      /* The track's laid-out width, ignoring transforms. scrollWidth would count the
         skill rows' x offsets (and it is read on refreshInit, before tweens revert),
         which made the travel ~180px too long and the page height drift per refresh. */
      function trackW() {
        var last = track.lastElementChild;
        if (!last) return track.scrollWidth;
        return last.getBoundingClientRect().right - track.getBoundingClientRect().left +
          (parseFloat(getComputedStyle(track).paddingRight) || 0);
      }
      function setHeight() {
        section.style.height = Math.round(trackW() - window.innerWidth + window.innerHeight) + 'px';
      }
      setHeight();
      ScrollTrigger.addEventListener('refreshInit', setHeight);

      var tween = gsap.to(track, {
        x: function () { return -(trackW() - window.innerWidth); },
        ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: 0.45, invalidateOnRefresh: true }
      });

      // glyph parallax inside the moving track
      $$('.lang-card', track).forEach(function (card) {
        gsap.fromTo($('.lang-glyph > span', card), { xPercent: 8 }, {
          xPercent: -4, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true }
        });
      });
      /* Top-skill rows slide in with the panel and are fully settled just before the
         track stops (the panel's right edge ends at innerWidth − gutter). The trigger is
         the untransformed panel, so the rows' own offsets never skew the measurement. */
      var panel = $('.skills-panel', track), rows = $$('.skill-row', track);
      if (panel && rows.length) {
        gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: panel, containerAnimation: tween, scrub: true,
            start: 'left 100%',
            end: function () { return 'right ' + Math.round(window.innerWidth - (parseFloat(getComputedStyle(track).paddingRight) || 0) + 40) + 'px'; }
          }
        }).fromTo(rows, { x: function (i) { return 120 + i * 60; }, opacity: 0.2 }, { x: 0, opacity: 1, duration: 1, stagger: 0.25 });
      }

      return function () {
        ScrollTrigger.removeEventListener('refreshInit', setHeight);
        section.style.height = '';
      };
    });

    mm.add('(max-width: 1023px)', function () {
      $$('.lang-card, .skill-row', section).forEach(function (el) {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true }
        });
      });
    });
  }

  /* --------------------------------------------------------- certs */
  function buildCerts() {
    $$('.cert').forEach(function (c) {
      ScrollTrigger.create({
        trigger: c, start: 'top 58%', end: 'bottom 58%',
        onToggle: function (self) { c.classList.toggle('is-hot', self.isActive); }
      });
    });
    var n = $('#certCount');
    if (n) {
      var o = { v: 0 };
      gsap.to(o, {
        v: 5, duration: 1.2, ease: 'power2.out',
        onUpdate: function () { n.textContent = pad(Math.round(o.v), 2); },
        scrollTrigger: { trigger: n, start: 'top 95%', once: true }
      });
    }
  }

  /* --------------------------------------------------------- education */
  function buildEducation() {
    var rail = $('#eduRail');
    if (rail) {
      gsap.fromTo(rail, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: '.edu-list', start: 'top 75%', end: 'bottom 65%', scrub: 0.4 }
      });
    }
    var fill = $('#degreeFill'), dot = $('#degreeDot'), pctEl = $('#degreePct');
    if (fill) {
      var o = { v: 0 };
      var tl = gsap.timeline({ scrollTrigger: { trigger: '#degree', start: 'top 95%', once: true } });
      tl.fromTo(fill, { scaleX: 0 }, { scaleX: 1, duration: 1.3, ease: 'expo.out' }, 0)
        .fromTo(dot, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2)' }, 0.35)
        .to(o, { v: degree.p * 100, duration: 1.3, ease: 'expo.out', onUpdate: function () { pctEl.textContent = o.v.toFixed(1) + '%'; } }, 0);
    }
  }

  /* --------------------------------------------------------- now */
  function buildNow() {
    var lines = $$('#termBody p');
    if (lines.length) {
      gsap.from(lines, {
        opacity: 0, x: -10, duration: 0.5, stagger: 0.06, ease: 'power2.out',
        scrollTrigger: { trigger: '#termBody', start: 'top 92%', once: true }
      });
    }
  }

  /* --------------------------------------------------------- footer */
  function buildFooter() {
    var so = $('#signoff');
    if (so) {
      var ws = $$('.signoff-w > *', so);
      var stl = gsap.timeline({ scrollTrigger: { trigger: so, start: 'top 86%', once: true } });
      stl.from($('.signoff-k', so), { opacity: 0, y: 14, duration: 0.8, ease: 'power3.out' }, 0)
        .from(ws[0], { yPercent: 112, duration: 1.1, ease: 'expo.out' }, 0.05)
        .from(ws[1], { yPercent: -120, rotate: -9, duration: 1.1, ease: 'bounce.out' }, 0.3)
        .from($('.q-attr-line', so), { scaleX: 0, duration: 0.9, ease: 'expo.out' }, 0.7)
        .from($('.q-attr-name', so), { opacity: 0, y: 10, duration: 0.7, ease: 'power3.out' }, 0.8);
    }
    var g = $('.footer-giant span');
    if (g) {
      gsap.fromTo(g, { yPercent: 45, scale: 0.94 }, {
        yPercent: 0, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: 0.4 }
      });
    }
  }

  /* --------------------------------------------------------- section tracking (HUD + aura intensity) */
  function buildSectionTracking() {
    $$('[data-section]').forEach(function (sec) {
      var boost = parseFloat(sec.getAttribute('data-aura') || '0.4');
      var isQuote = sec.classList.contains('quote');
      ScrollTrigger.create({
        trigger: sec, start: 'top 55%', end: 'bottom 55%',
        onToggle: function (self) {
          if (!self.isActive) return;
          setSectionLabel(sec);
          inQuote = isQuote;
          if (aura) aura.set('boost', boost);
        }
      });
    });
  }

  /* --------------------------------------------------------- keep the reading position across a width change
     (e.g. rotating an iPad across the 1024px breakpoint re-lays the stack from
     horizontal to vertical and shifts every section below it). Section offsets are
     cached on refresh, the anchor (section + fraction) is kept current on scroll with no
     DOM reads, frozen the moment the width changes, and restored after the refresh. */
  function initResizeAnchor() {
    var cache = [], anchor = null, frozen = false, lastW = window.innerWidth, thaw;
    function cacheSections() {
      var sy = window.scrollY || 0;
      cache = $$('[data-section]').map(function (el) {
        return { el: el, top: el.getBoundingClientRect().top + sy, h: el.offsetHeight || 1 };
      });
    }
    function snap(y) {
      if (frozen) return;
      for (var i = cache.length - 1; i >= 0; i--) {
        if (y >= cache[i].top) { anchor = { el: cache[i].el, frac: clamp((y - cache[i].top) / cache[i].h, 0, 1) }; return; }
      }
      anchor = null;
    }
    cacheSections();
    if (lenis) lenis.on('scroll', function (e) { snap(e.scroll); });
    else window.addEventListener('scroll', function () { snap(window.scrollY || 0); }, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth === lastW || frozen) return;
      frozen = true;
      clearTimeout(thaw);
      thaw = setTimeout(function () { frozen = false; }, 2500); // never stay frozen if no refresh follows
    });
    ScrollTrigger.addEventListener('refresh', function () {
      var restore = frozen && anchor && window.innerWidth !== lastW && (window.scrollY || 0) > 0;
      if (restore && anchor.el.isConnected) {
        var r = anchor.el.getBoundingClientRect();
        var y = Math.round(r.top + (window.scrollY || 0) + anchor.frac * anchor.el.offsetHeight);
        hud.holdNav = true;
        if (lenis) lenis.scrollTo(y, { immediate: true, force: true });
        else window.scrollTo(0, y);
      }
      frozen = false;
      clearTimeout(thaw);
      lastW = window.innerWidth;
      cacheSections();
      snap(window.scrollY || 0);
    });
  }

  /* --------------------------------------------------------- velocity marquees */
  function initMarquees() {
    $$('[data-marquee]').forEach(function (m) {
      var track = $('.marquee-track', m);
      var group = $('.marquee-group', m);
      if (!track || !group) return;
      var baseDir = parseFloat(m.getAttribute('data-marquee')) || 1;
      var gw = group.offsetWidth || 1;
      var copies = Math.max(2, Math.ceil((window.innerWidth * 2) / gw) + 1);
      for (var i = 1; i < copies; i++) {
        var c = group.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
      var x = 0, dir = baseDir, visible = false, skew = 0;
      var setX = gsap.quickSetter(track, 'x', 'px');
      var setSkew = gsap.quickSetter(track, 'skewX', 'deg');
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { rootMargin: '100px 0px' }).observe(m);
      } else { visible = true; }
      var measure = function () { gw = group.offsetWidth || gw; };
      window.addEventListener('resize', measure);
      ScrollTrigger.addEventListener('refresh', measure);

      gsap.ticker.add(function (time, dt) {
        if (!visible) return;
        var vel = lenis ? lenis.velocity : 0;
        if (lenis && lenis.direction) dir = baseDir * lenis.direction;
        var speed = (0.9 + Math.min(Math.abs(vel) * 0.45, 14)) * (dt / 16.67);
        x -= speed * dir;
        if (x <= -gw) x += gw;
        if (x > 0) x -= gw;
        setX(x);
        var targetSkew = clamp(-vel * 0.35, -9, 9);
        skew += (targetSkew - skew) * 0.12;
        setSkew(skew);
      });
    });
  }

  /* --------------------------------------------------------- cursor */
  function initCursor() {
    if (!finePointer) return;
    var cur = $('.cursor'), dot = $('.cursor-dot'), ring = $('.cursor-ring'), label = $('.cursor-label');
    if (!cur) return;
    doc.classList.add('has-cursor');
    var mx = window.innerWidth / 2, my = window.innerHeight / 2, rx = mx, ry = my;
    var setDX = gsap.quickSetter(dot, 'x', 'px'), setDY = gsap.quickSetter(dot, 'y', 'px');
    var setRX = gsap.quickSetter(ring, 'x', 'px'), setRY = gsap.quickSetter(ring, 'y', 'px');
    var seen = false;
    cur.classList.add('is-hidden');
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; cur.classList.remove('is-hidden'); }
    }, { passive: true });
    document.addEventListener('pointerleave', function () { cur.classList.add('is-hidden'); });
    document.addEventListener('pointerenter', function () { if (seen) cur.classList.remove('is-hidden'); });
    window.addEventListener('pointerdown', function () { cur.classList.add('is-down'); });
    window.addEventListener('pointerup', function () { cur.classList.remove('is-down'); });
    gsap.ticker.add(function () {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      setDX(mx); setDY(my); setRX(rx); setRY(ry);
    });
    var sel = 'a, button, [data-cursor], .lang-card, .cert, .now-row, .skill-row';
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest ? e.target.closest(sel) : null;
      if (!t) { cur.classList.remove('is-hover', 'is-label'); return; }
      var l = t.getAttribute('data-cursor');
      if (l) { label.textContent = l; cur.classList.add('is-label'); cur.classList.remove('is-hover'); }
      else { cur.classList.add('is-hover'); cur.classList.remove('is-label'); }
    });
  }

  /* --------------------------------------------------------- magnetic buttons */
  function initMagnetic() {
    if (!finePointer) return;
    document.addEventListener('pointermove', function () {}, { passive: true });
    $$('[data-magnetic]').forEach(bindMagnet);
  }
  function bindMagnet(el) {
    if (el.__mag) return; el.__mag = true;
    var qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    var qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    var rect = null;
    el.addEventListener('pointerenter', function () { rect = el.getBoundingClientRect(); });
    el.addEventListener('pointermove', function (e) {
      if (!rect) rect = el.getBoundingClientRect();
      var dx = e.clientX - (rect.left + rect.width / 2);
      var dy = e.clientY - (rect.top + rect.height / 2);
      qx(dx * 0.32); qy(dy * 0.4);
    });
    el.addEventListener('pointerleave', function () {
      rect = null;
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, 0.4)' });
    });
  }

  /* --------------------------------------------------------- card glow + tilt */
  function initTilt() {
    if (!finePointer) return;
    $$('[data-tilt]').forEach(function (card) {
      var rx = gsap.quickTo(card, 'rotationX', { duration: 0.8, ease: 'power3.out' });
      var ry = gsap.quickTo(card, 'rotationY', { duration: 0.8, ease: 'power3.out' });
      gsap.set(card, { transformPerspective: 900 });
      var rect = null;
      card.addEventListener('pointerenter', function () { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', function (e) {
        if (!rect) rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
        ry((px - 0.5) * 8); rx((0.5 - py) * 6);
      });
      card.addEventListener('pointerleave', function () { rect = null; rx(0); ry(0); });
    });
  }

  /* =======================================================================
     BOOT
     ======================================================================= */
  renderProjects();
  initClock();
  initDegree();
  initCopy();
  initAura();

  if (motion) {
    try {
      initMotion();
    } catch (err) {
      // If anything in the motion layer fails, fall back to a fully visible static page.
      if (window.console) console.warn('Motion layer disabled:', err);
      doc.classList.remove('motion'); doc.classList.add('static');
      if (window.gsap) { try { gsap.globalTimeline.clear(); ScrollTrigger.getAll().forEach(function (s) { s.kill(); }); gsap.set('*', { clearProps: 'all' }); } catch (e) { /* noop */ } }
      if (lenis) { lenis.destroy(); lenis = null; window.lenis = undefined; }
      initStatic();
    }
  } else {
    initStatic();
  }
  initNavLinks();
})();
