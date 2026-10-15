/* ==========================================================================
   ABOUT — scroll-scrubbed portrait render
   Eleven passes (BLOCK → HALFTONE → ASCII → DITHER) drawn from a cached
   per-grid luminance map, then a scan-wipe resolves to the photo while the
   aurora lifts for a beat. Redraws only when the pass index changes.
   Source pixels come from a data URI (js/portrait-data.js), so
   getImageData never taints — works from file://.
   Reduced motion / no GSAP / any failure → the plain photo.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s) { return document.querySelector(s); };
  var fig = $('#render');
  if (!fig) return;

  var frame = $('#renderFrame'), cv = $('#renderCanvas'), photo = $('#renderPhoto'), scan = $('#renderScan');
  var ui = { mode: $('#rMode'), grid: $('#rGrid'), pass: $('#rPass'), pct: $('#rPct'), bar: $('#rBar'), state: $('#rState') };

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n, l) { n = String(n); while (n.length < l) n = '0' + n; return n; }
  function txt(el, s) { if (el && el.textContent !== s) el.textContent = s; }

  var STEPS = [
    { m: 'Block', c: 44 }, { m: 'Block', c: 30 }, { m: 'Block', c: 20 },
    { m: 'Halftone', c: 15 }, { m: 'Halftone', c: 11 },
    { m: 'ASCII', c: 13 }, { m: 'ASCII', c: 10 }, { m: 'ASCII', c: 7.5 },
    { m: 'Dither', c: 4 }, { m: 'Dither', c: 3 }, { m: 'Dither', c: 2 }
  ];
  var PASSES = STEPS.length + 1;            // + the source photo
  var EDGE = 0.64, WIPE_END = 0.88;         // progress: passes → wipe → hold

  /* the plain photo: reduced motion, no GSAP, or anything failing */
  function showSource() {
    fig.classList.remove('is-live');
    photo.style.clipPath = '';
    txt(ui.mode, 'Source'); txt(ui.grid, '564×752'); txt(ui.pass, '12/12');
    txt(ui.pct, '100%'); txt(ui.state, 'in focus');
    if (ui.bar) ui.bar.style.transform = 'scaleX(1)';
  }

  var motion = doc.classList.contains('motion') && !!(window.gsap && window.ScrollTrigger) &&
               !!window.UST_PORTRAIT && !!(cv && cv.getContext && photo && frame);
  if (!motion) { showSource(); return; }

  var ctx;
  try { ctx = cv.getContext('2d'); } catch (e) { ctx = null; }
  if (!ctx) { showSource(); return; }

  /* ---------------------------------------------------------- palette
     spatial brand ramp (violet → magenta → electric blue, top-left to
     bottom-right); luminance drives size / alpha; the brightest cells
     turn pale lilac */
  var RAMP = [[0, [139, 108, 255]], [0.5, [255, 95, 208]], [1, [70, 128, 255]]];
  var LILAC = [236, 226, 255];
  var NB = 10, NL = 6;
  var BAND = [], BAND_STR = [], BLOCK_STR = [];
  (function () {
    for (var b = 0; b < NB; b++) {
      var t = (b + 0.5) / NB, c;
      var k = t <= 0.5 ? t / 0.5 : (t - 0.5) / 0.5;
      var a = t <= 0.5 ? RAMP[0][1] : RAMP[1][1], z = t <= 0.5 ? RAMP[1][1] : RAMP[2][1];
      c = [0, 1, 2].map(function (j) { return Math.round(a[j] + (z[j] - a[j]) * k); });
      BAND.push(c);
      BAND_STR.push('rgb(' + c.join(',') + ')');
      var row = [];
      for (var l = 0; l < NL; l++) row.push('rgba(' + c.join(',') + ',' + (0.16 + (l / (NL - 1)) * 0.7).toFixed(3) + ')');
      BLOCK_STR.push(row);
    }
  })();
  var LILAC_STR = 'rgb(' + LILAC.join(',') + ')';
  var BRIGHT = 0.8;
  function bandAt(i, j, n, m) {
    var t = 0.34 * (i / Math.max(1, n - 1)) + 0.66 * (j / Math.max(1, m - 1));
    return Math.min(NB - 1, Math.floor(t * NB));
  }

  /* ---------------------------------------------------------- source */
  var SW = 300, SH = 400, ASPECT = SH / SW;
  var lum = new Float32Array(SW * SH), alp = new Float32Array(SW * SH);
  var cache = {};
  var BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  var off = document.createElement('canvas'), octx = off.getContext('2d');
  var ready = false, W = 0, H = 0, FH = 0, dpr = 1, cur = -1, P = 0, lastQ = -1, lastPct = -1, lastLift = -1;
  var aura = window.AuraField && window.AuraField.current && window.AuraField.current.ok ? window.AuraField.current : null;

  /* per-grid luminance (-1 = background), cached by column count */
  function grid(n) {
    if (cache[n]) return cache[n];
    var m = Math.ceil(n * ASPECT), k = SW / n;
    var out = new Float32Array(n * m);
    for (var j = 0; j < m; j++) {
      var y0 = Math.min(SH - 1, Math.floor(j * k)), y1 = Math.min(SH, Math.max(y0 + 1, Math.floor((j + 1) * k)));
      for (var i = 0; i < n; i++) {
        var x0 = Math.min(SW - 1, Math.floor(i * k)), x1 = Math.min(SW, Math.max(x0 + 1, Math.floor((i + 1) * k)));
        var s = 0, a = 0, c = 0;
        for (var y = y0; y < y1; y++) for (var x = x0; x < x1; x++) { var q = y * SW + x; s += lum[q] * alp[q]; a += alp[q]; c++; }
        out[j * n + i] = (a / c) < 0.35 ? -1 : s / a;
      }
    }
    var g = { n: n, m: m, v: out };
    cache[n] = g;
    return g;
  }

  function draw(idx) {
    if (!ready || !W) return;
    var st = STEPS[idx];
    var n = clamp(Math.round(W / st.c), 6, SW);
    var g = grid(n), m = g.m, v = g.v;
    var cell = W / n;
    var i, j, val, b, x, y;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    if (st.m === 'Block') {
      ctx.fillStyle = 'rgba(200,182,255,0.1)';
      for (j = 0; j < m; j++) for (i = 0; i < n; i++) {
        if (v[j * n + i] < 0) ctx.fillRect(i * cell + cell / 2 - 1, j * cell + cell / 2 - 1, 2, 2);
      }
      var gap = Math.max(1, cell * 0.07);
      for (j = 0; j < m; j++) for (i = 0; i < n; i++) {
        val = v[j * n + i];
        if (val < 0) continue;
        ctx.fillStyle = val >= BRIGHT ? LILAC_STR : BLOCK_STR[bandAt(i, j, n, m)][Math.round(val * (NL - 1))];
        ctx.fillRect(i * cell + gap, j * cell + gap, cell - gap * 2, cell - gap * 2);
      }
    } else if (st.m === 'Halftone') {
      var paths = [], bright = new Path2D();
      for (b = 0; b < NB; b++) paths.push(new Path2D());
      for (j = 0; j < m; j++) for (i = 0; i < n; i++) {
        val = v[j * n + i];
        if (val < 0) continue;
        var r = (cell / 2) * Math.sqrt(val) * 1.04, cx = i * cell + cell / 2, cy = j * cell + cell / 2;
        var p = val >= BRIGHT ? bright : paths[bandAt(i, j, n, m)];
        p.moveTo(cx + r, cy);
        p.arc(cx, cy, r, 0, Math.PI * 2);
      }
      for (b = 0; b < NB; b++) { ctx.fillStyle = BAND_STR[b]; ctx.fill(paths[b]); }
      ctx.fillStyle = LILAC_STR; ctx.fill(bright);
    } else if (st.m === 'ASCII') {
      var ramp = ' .:-=+*#%@';
      ctx.font = '500 ' + Math.max(6, Math.round(cell * 1.22)) + 'px "JetBrains Mono", ui-monospace, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var buckets = [];
      for (b = 0; b <= NB; b++) buckets.push([]);
      for (j = 0; j < m; j++) for (i = 0; i < n; i++) {
        val = v[j * n + i];
        if (val < 0) continue;
        buckets[val >= BRIGHT ? NB : bandAt(i, j, n, m)].push(j * n + i);
      }
      for (b = 0; b <= NB; b++) {
        var list = buckets[b];
        if (!list.length) continue;
        ctx.fillStyle = b === NB ? LILAC_STR : BAND_STR[b];
        for (var q = 0; q < list.length; q++) {
          var id = list[q];
          val = v[id];
          i = id % n; j = (id - i) / n;
          ctx.fillText(ramp[Math.min(ramp.length - 1, 1 + Math.floor(val * (ramp.length - 1)))], i * cell + cell / 2, j * cell + cell / 2);
        }
      }
    } else {
      off.width = n; off.height = m;
      var im = octx.createImageData(n, m), px = im.data;
      for (j = 0; j < m; j++) for (i = 0; i < n; i++) {
        val = v[j * n + i];
        if (val < 0) continue;
        if (val * 1.04 > (BAYER[(j % 8) * 8 + (i % 8)] + 0.5) / 64) {
          var col = val >= BRIGHT + 0.06 ? LILAC : BAND[bandAt(i, j, n, m)];
          var o = (j * n + i) * 4;
          px[o] = col[0]; px[o + 1] = col[1]; px[o + 2] = col[2]; px[o + 3] = 255;
        }
      }
      octx.putImageData(im, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, 0, 0, n * cell, m * cell);
    }
  }

  /* MODE / GRID / PASS reflect the pass on screen, or the wipe once it starts */
  function tele(q) {
    if (q > 0) {
      txt(ui.mode, q >= 1 ? 'Source' : 'Resolve');
      txt(ui.pass, PASSES + '/' + PASSES);
      if (q >= 1) txt(ui.grid, '564×752');
    } else if (cur >= 0) {
      var s = STEPS[cur], n = clamp(Math.round(W / s.c), 6, SW);
      txt(ui.mode, s.m);
      txt(ui.grid, n + '×' + Math.ceil(n * ASPECT));
      txt(ui.pass, pad(cur + 1, 2) + '/' + PASSES);
    }
    txt(ui.state, q >= 1 ? 'in focus' : q > 0 ? 'resolving' : 'rendering');
  }

  function set(p) {
    P = clamp(p, 0, 1);
    var idx = Math.min(STEPS.length - 1, Math.floor((P / EDGE) * STEPS.length));
    var changed = idx !== cur;
    if (changed) { cur = idx; draw(idx); }
    var q = clamp((P - EDGE) / (WIPE_END - EDGE), 0, 1);
    q = q > 0.995 ? 1 : Math.round(q * 1000) / 1000;
    if (changed || q !== lastQ) tele(q);
    if (q !== lastQ) {
      lastQ = q;
      photo.style.clipPath = 'inset(0 0 ' + ((1 - q) * 100).toFixed(2) + '% 0)';
      scan.style.opacity = q > 0 && q < 1 ? '1' : '0';
      scan.style.transform = 'translate3d(0,' + (q * FH).toFixed(1) + 'px,0)';
      frame.style.setProperty('--wipe', Math.sin(Math.PI * q).toFixed(3));
      // the aurora swells while the scan line runs, then settles back
      var lift = Math.round(Math.sin(Math.PI * q) * 0.7 * 100) / 100;
      if (aura && lift !== lastLift) { lastLift = lift; aura.lift(lift); }
    }
    var pc = q >= 1 ? 100 : Math.min(99, Math.floor(clamp(P / WIPE_END, 0, 1) * 100));
    if (pc !== lastPct) {
      lastPct = pc;
      txt(ui.pct, pad(pc, 3) + '%');
      if (ui.bar) ui.bar.style.transform = 'scaleX(' + (pc / 100).toFixed(3) + ')';
    }
  }

  function size() {
    var w = cv.clientWidth || frame.clientWidth;
    if (!w) return;
    var nd = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
    var h = w * ASPECT;
    FH = frame.clientHeight;
    if (w === W && nd === dpr && cv.width === Math.round(w * nd)) { lastQ = -1; set(P); return; }
    W = w; H = h; dpr = nd;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
    cur = -1; lastQ = -1;
    set(P);
  }

  function load(done) {
    var img = new Image();
    img.onload = function () {
      try {
        var c = document.createElement('canvas');
        c.width = SW; c.height = SH;
        var cx = c.getContext('2d', { willReadFrequently: true });
        cx.drawImage(img, 0, 0, SW, SH);
        var data = cx.getImageData(0, 0, SW, SH).data;
        var vals = [];
        for (var i = 0; i < SW * SH; i++) {
          alp[i] = data[i * 4 + 3] / 255;
          lum[i] = data[i * 4] / 255;
          if (alp[i] > 0.5) vals.push(lum[i]);
        }
        vals.sort(function (a, b) { return a - b; });
        var lo = vals[Math.floor(vals.length * 0.03)] || 0, hi = vals[Math.floor(vals.length * 0.985)] || 1;
        for (var k = 0; k < SW * SH; k++) lum[k] = 0.1 + 0.9 * Math.pow(clamp((lum[k] - lo) / ((hi - lo) || 1), 0, 1), 0.9);
        ready = true;
        done(true);
      } catch (e) { done(false); }
    };
    img.onerror = function () { done(false); };
    img.src = window.UST_PORTRAIT;
  }

  var st = null, proxy = { p: 0 };
  function build() {
    var mm = gsap.matchMedia();
    function make(vars) {
      proxy.p = 0;
      var tw = gsap.to(proxy, {
        p: 1, ease: 'none',
        onUpdate: function () { set(proxy.p); },
        scrollTrigger: {
          trigger: vars.trigger, start: vars.start, end: vars.end, scrub: 0.35,
          invalidateOnRefresh: true,
          onRefresh: function (self) { proxy.p = self.progress; set(self.progress); }
        }
      });
      st = tw.scrollTrigger;
      return function () { tw.kill(); };
    }
    // desktop: the figure is CSS-sticky beside the copy — trigger off the (non-sticky) grid
    mm.add('(min-width: 1024px)', function () {
      return make({ trigger: '.about-grid', start: 'top 62%', end: 'bottom 84%' });
    });
    // tablet / phone: plain in-view scrub on the figure itself
    mm.add('(max-width: 1023px)', function () {
      return make({ trigger: fig, start: 'top 72%', end: 'center 24%' });
    });
  }

  load(function (ok) {
    if (!ok) { showSource(); return; }
    try {
      fig.classList.add('is-live');
      size();
      build();
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
      var rt;
      window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 140); });
      ScrollTrigger.addEventListener('refresh', function () { if (fig.classList.contains('is-live')) size(); });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { if (cur >= 0 && STEPS[cur].m === 'ASCII') draw(cur); });
      }
    } catch (e) {
      if (window.console) console.warn('Render sequence disabled:', e);
      if (aura) aura.lift(0);
      showSource();
    }
  });
})();
