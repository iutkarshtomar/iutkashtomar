/* ==========================================================================
   NOW — interactive terminal
   Commands print only what's on his profile. History on ↑/↓, ctrl+L
   clears, quick-command keys for touch. The wheel is handed to the
   output only while it can actually scroll in that direction (Lenis'
   per-event `lenisStopPropagation`), so the page never gets stuck here.
   ========================================================================== */
(function () {
  'use strict';

  var doc = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var tty = $('#tty');
  if (!tty) return;
  var out = $('#ttyOut'), screen = $('#ttyScreen'), form = $('#ttyForm'), inp = $('#ttyIn');
  var caret = $('.tty-caret', tty), meas = $('.tty-measure', tty);
  if (!out || !screen || !form || !inp) return;

  var motion = doc.classList.contains('motion') && !!(window.gsap && window.ScrollTrigger);
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------ facts */
  var EMAIL = 'utkarshsingh4155@gmail.com';
  var LINKEDIN = 'https://www.linkedin.com/in/utkarsh-singh-tomar-1627992b6';
  var QUOTES = [
    ['Talk is cheap. Show me the code.', 'Linus Torvalds'],
    ['Stay hungry. Stay foolish.', 'Steve Jobs'],
    ['Everybody has a plan until they get punched in the mouth.', 'Mike Tyson'],
    ['Be water, my friend.', 'Bruce Lee'],
    ['I am the one who knocks.', 'Walter White', 'Breaking Bad'],
    ['Throughout Heaven and Earth, I alone am the honored one.', 'Satoru Gojo', 'Jujutsu Kaisen'],
    ['Do. Or do not. There is no try.', 'Yoda', 'The Empire Strikes Back'],
    ['Discipline equals freedom.', 'Jocko Willink'],
    ['The best way to predict the future is to invent it.', 'Alan Kay'],
    ['I am inevitable.', 'Thanos', 'Avengers: Endgame'],
    ['Float like a butterfly, sting like a bee.', 'Muhammad Ali'],
    ["You miss 100% of the shots you don't take.", 'Wayne Gretzky'],
    ['Mamba out.', 'Kobe Bryant']
  ];
  var SECTIONS = {
    top: 'top', home: 'top',
    about: 'about', whoami: 'about',
    stack: 'stack', skills: 'stack',
    certs: 'certs', certifications: 'certs',
    edu: 'education', education: 'education',
    now: 'now',
    work: 'work', projects: 'work', lab: 'work',
    contact: 'contact'
  };

  /* same anchors and year formula as the Education bar (js/main.js) */
  function degree() {
    var start = new Date(2025, 7, 1).getTime(), end = new Date(2029, 6, 31).getTime(), now = Date.now();
    return {
      p: clamp((now - start) / (end - start), 0, 1),
      year: clamp(Math.floor((now - start) / (365.25 * 864e5)) + 1, 1, 4)
    };
  }

  /* ------------------------------------------------------------ output */
  function node(tag, cls, html) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html != null) el.innerHTML = html;
    out.appendChild(el);
    return el;
  }
  function line(html, cls) { return node('p', cls, html); }
  function kv(rows, cls) {
    var dl = node('dl', 't-kv' + (cls ? ' ' + cls : ''));
    rows.forEach(function (r) {
      var d = document.createElement('div');
      d.innerHTML = '<dt>' + esc(r[0]) + '</dt><dd>' + r[1] + '</dd>';
      dl.appendChild(d);
    });
    return dl;
  }

  function yearLabel() {
    var d = degree();
    return 'BU’29 · ' + (d.p >= 1 ? 'graduated' : ['1st', '2nd', '3rd', '4th'][d.year - 1] + ' year');
  }
  // keep the pre-rendered `status` in step with the calendar
  $$('.t-kv dt', out).forEach(function (dt) { if (dt.textContent === 'class' && dt.nextElementSibling) dt.nextElementSibling.textContent = yearLabel(); });

  var lastQuote = -1;
  var CMDS = {
    help: function () {
      var rows = [
        ['help', 'this list'],
        ['whoami', 'who I am'],
        ['status', 'the short version'],
        ['stack', 'languages, craft & top skills'],
        ['certs', 'the five certifications'],
        ['edu', 'education + live degree progress'],
        ['now', 'what I’m into right now'],
        ['contact', 'email & LinkedIn'],
        ['quote', 'a famous line, at random'],
        ['goto <section>', 'about · stack · certs · edu · now · work · contact'],
        ['clear', 'wipe the screen (ctrl + L)']
      ];
      var dl = node('dl', 't-help');
      rows.forEach(function (r) {
        var d = document.createElement('div');
        d.innerHTML = '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>';
        dl.appendChild(d);
      });
      line('↑ ↓ scroll through history', 't-dim');
    },
    whoami: function () {
      line('Utkarsh Singh Tomar', 't-ok');
      line('B.Tech CSE Sophomore @ Bennett University | BU’29 | Python Enthusiast | Building with Data Structures &amp; Backend Systems');
      line('Greater Noida, India', 't-dim');
    },
    status: function () {
      kv([
        ['name', 'Utkarsh Singh Tomar'],
        ['role', 'B.Tech CSE sophomore, Bennett University'],
        ['class', yearLabel()],
        ['base', 'Greater Noida, India'],
        ['building', 'data structures, backend systems'],
        ['exploring', 'cloud, devops, scalable applications'],
        ['open to', 'collaborating on projects that make an impact']
      ]);
    },
    stack: function () {
      kv([
        ['languages', 'Python · Java · C'],
        ['craft', 'Web Development'],
        ['interests', 'Cloud · DevOps · Scalable Applications'],
        ['top skills', 'Machine Learning · Electronic Circuits · Digital Circuit Design']
      ]);
      line('# top skills', 't-dim');
    },
    certs: function () {
      [
        'Electronic Circuits and Number System',
        'Digital Electronics <span class="t-dim">— Online Digital Electronics Courses</span>',
        'Combinational Digital Circuits',
        'Introduction to Programming Using Python',
        'Machine Learning'
      ].forEach(function (c, i) { line('<span class="t-pk">✦</span> 0' + (i + 1) + '  ' + c); });
      line('5 certificates on record', 't-dim');
    },
    edu: function () {
      var d = degree(), pct = (d.p * 100).toFixed(1), n = 20, f = Math.round(d.p * n);
      line('Bennett University', 't-ok');
      kv([
        ['degree', 'B.Tech — Computer Science &amp; Engineering'],
        ['when', 'Aug 2025 → Jul 2029 · ' + (d.p >= 1 ? 'graduated' : 'year ' + d.year + ' of 4') + ' · BU’29'],
        ['progress', '<span class="t-meter">[<i>' + new Array(f + 1).join('█') + '</i>' + new Array(n - f + 1).join('░') + ']</span> <span class="t-pk" data-degree-pct>' + pct + '%</span> compiled']
      ]);
      line('CBSE', 't-ok');
      kv([['class', 'Class 12 (10+2) — PCM']]);
      line('# progress is live — computed from today’s date', 't-dim');
    },
    now: function () {
      kv([
        ['building', 'with data structures &amp; backend systems'],
        ['passion', 'web development — real-world solutions with modern technologies'],
        ['exploring', 'cloud, devops, scalable applications'],
        ['loves', 'exploring new tools, improving problem-solving skills'],
        ['open to', 'collaborating on projects that make an impact']
      ]);
    },
    contact: function () {
      kv([
        ['email', '<a href="mailto:' + EMAIL + '">' + EMAIL + '</a>'],
        ['linkedin', '<a href="' + LINKEDIN + '" target="_blank" rel="noopener noreferrer">linkedin.com/in/utkarsh-singh-tomar-1627992b6</a>']
      ]);
      line('Let’s connect and build something cool!', 't-ok');
    },
    quote: function () {
      var i;
      do { i = Math.floor(Math.random() * QUOTES.length); } while (i === lastQuote && QUOTES.length > 1);
      lastQuote = i;
      var q = QUOTES[i];
      var fig = node('figure', 't-quote');
      fig.innerHTML = '<q>' + esc(q[0]) + '</q>' +
        '<p class="t-by"><span class="t-name">' + esc(q[1]) + (q[2] ? ',' : '') + '</span>' +
        (q[2] ? '<cite>' + esc(q[2]) + '</cite>' : '') + '</p>';
    },
    goto: function (arg) {
      var key = String(arg || '').replace(/^[#~\/.]+/, '').replace(/\/$/, '').toLowerCase();
      var id = SECTIONS[key];
      var el = id && document.getElementById(id);
      if (!el) {
        line('usage: goto &lt;about|stack|certs|edu|now|work|contact&gt;', 't-dim');
        return;
      }
      line('→ jumping to ~/' + esc(key === 'education' ? 'edu' : key), 't-ok');
      setTimeout(function () { jump(el, id); }, 180);
    },
    clear: function () { out.innerHTML = ''; }
  };
  var ALIAS = { '?': 'help', man: 'help', ls: 'help', education: 'edu', certifications: 'certs', skills: 'stack', email: 'contact', linkedin: 'contact', cd: 'goto', cls: 'clear' };

  function jump(el, id) {
    try { inp.blur(); } catch (e) { /* noop */ }
    var L = window.lenis;
    var target = id === 'top' ? 0 : el;
    if (L && L.scrollTo && !reduce) {
      L.scrollTo(target, { duration: 1.8, easing: function (t) { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); } });
    } else if (target === 0) {
      window.scrollTo(0, 0);
    } else {
      el.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    setTimeout(function () { try { el.focus({ preventScroll: true }); } catch (e) { /* noop */ } }, reduce ? 30 : 1300);
  }

  /* ------------------------------------------------------------ run */
  var hist = [], hi = 0;
  function run(raw) {
    finishIntro();
    raw = String(raw || '').trim();
    line('<b>$</b> ' + esc(raw), 't-cmd');
    if (raw) {
      if (hist[hist.length - 1] !== raw) hist.push(raw);
      if (hist.length > 50) hist.shift();
    }
    hi = hist.length;
    if (raw) {
      var parts = raw.split(/\s+/);
      var name = parts[0].toLowerCase();
      name = ALIAS[name] || name;
      var fn = Object.prototype.hasOwnProperty.call(CMDS, name) ? CMDS[name] : null;
      if (fn) fn(parts.slice(1).join(' '));
      else line('<span class="t-err">command not found:</span> ' + esc(parts[0]) + ' <span class="t-dim">— type <span class="t-pk">help</span></span>');
    }
    while (out.children.length > 160) out.removeChild(out.firstChild);
    screen.scrollTop = screen.scrollHeight;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var v = inp.value;
    inp.value = '';
    run(v);
    placeCaret();
  });

  inp.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp' && hist.length) {
      e.preventDefault();
      hi = Math.max(0, hi - 1); inp.value = hist[hi];
      setEnd();
    } else if (e.key === 'ArrowDown' && hist.length) {
      e.preventDefault();
      hi = Math.min(hist.length, hi + 1); inp.value = hist[hi] || '';
      setEnd();
    } else if ((e.key === 'l' || e.key === 'L') && e.ctrlKey) {
      e.preventDefault();
      out.innerHTML = '';
    } else if (e.key === 'Escape') {
      inp.blur();
    }
    typing();
    requestAnimationFrame(placeCaret);
  });
  function setEnd() { var n = inp.value.length; try { inp.setSelectionRange(n, n); } catch (err) { /* noop */ } }

  // clicking the screen focuses the prompt (unless text is being selected)
  screen.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) return;
    var sel = window.getSelection ? String(window.getSelection()) : '';
    if (!sel) inp.focus({ preventScroll: true });
  });

  // quick commands
  $$('[data-run]', tty).forEach(function (b) {
    b.addEventListener('click', function () {
      run(b.getAttribute('data-run'));
      if (!coarse) inp.focus({ preventScroll: true }); // no surprise keyboard on phones
    });
  });

  /* wheel hand-off: only while the output can scroll further that way */
  screen.addEventListener('wheel', function (e) {
    var max = screen.scrollHeight - screen.clientHeight;
    if (max <= 1) return;
    var dy = e.deltaY;
    if ((dy < 0 && screen.scrollTop > 0) || (dy > 0 && screen.scrollTop < max - 1)) e.lenisStopPropagation = true;
  }, { passive: true });

  /* ------------------------------------------------------------ block caret */
  var cw = 0, typeT;
  function measure() {
    var w = meas ? meas.getBoundingClientRect().width : 0;
    cw = w > 0 ? w / 10 : 0;
    tty.classList.toggle('has-caret', cw > 0);
    placeCaret();
  }
  function placeCaret() {
    tty.classList.toggle('is-typed', inp.value.length > 0);
    if (!cw || !caret) return;
    var s = inp.selectionStart, en = inp.selectionEnd;
    if (s == null || document.activeElement !== inp) { s = en = inp.value.length; }
    tty.classList.toggle('is-range', s !== en);
    var x = clamp(s * cw - inp.scrollLeft, 0, Math.max(0, inp.clientWidth - cw));
    caret.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
  }
  function typing() {
    tty.classList.add('is-typing');
    clearTimeout(typeT);
    typeT = setTimeout(function () { tty.classList.remove('is-typing'); }, 520);
  }
  ['input', 'click', 'focus', 'blur', 'select', 'scroll'].forEach(function (ev) {
    inp.addEventListener(ev, function () { if (ev === 'input') typing(); placeCaret(); });
  });
  document.addEventListener('selectionchange', function () { if (document.activeElement === inp) placeCaret(); });
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(measure, 150); });
  measure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

  /* ------------------------------------------------------------ intro:
     `status` types itself in, then the lines land (motion only) */
  var introDone = !motion, introOn = false, typedEl = $('.t-typed', out), introTimers = [];
  var pres = $$('.t-pre', out);
  function finishIntro() {
    if (introDone) return;
    introDone = true;
    introTimers.forEach(clearTimeout);
    tty.classList.remove('is-pre');
    if (typedEl) { typedEl.textContent = typedEl.getAttribute('data-cmd') || 'status'; typedEl.removeAttribute('aria-hidden'); }
    pres.forEach(function (el) { el.classList.remove('t-pre'); el.style.visibility = ''; });
  }
  function intro() {
    if (introDone || introOn) return;
    introOn = true;
    var cmd = (typedEl && typedEl.getAttribute('data-cmd')) || 'status';
    var i = 0;
    function tick() {
      if (introDone) return;
      i++;
      if (typedEl) typedEl.textContent = cmd.slice(0, i);
      if (i < cmd.length) { introTimers.push(setTimeout(tick, 70)); return; }
      if (typedEl) typedEl.removeAttribute('aria-hidden');
      tty.classList.remove('is-pre');
      pres.forEach(function (el) { el.style.visibility = 'hidden'; el.classList.remove('t-pre'); });
      pres.forEach(function (el, k) {
        introTimers.push(setTimeout(function () {
          el.style.visibility = '';
          if (k === pres.length - 1) introDone = true;
        }, 160 + k * 85));
      });
    }
    introTimers.push(setTimeout(tick, 260));
  }
  if (motion) {
    tty.classList.add('is-pre');
    // keep the live region quiet while "status" types itself letter by letter
    if (typedEl) { typedEl.textContent = ''; typedEl.setAttribute('aria-hidden', 'true'); }
    try {
      ScrollTrigger.create({
        trigger: tty, start: 'top 80%', end: 'bottom top',
        onEnter: intro, onEnterBack: intro, onLeave: intro,
        onUpdate: function (s) { if (s.progress > 0) intro(); }
      });
    } catch (e) { finishIntro(); }
    inp.addEventListener('focus', finishIntro);
    // never leave it half-drawn (e.g. a deep link straight past it)
    setTimeout(function () { if (!introDone && tty.getBoundingClientRect().top < window.innerHeight) intro(); }, 4000);
  }

  // all add-on triggers exist now: order them and measure once
  if (window.ScrollTrigger && motion) {
    try { ScrollTrigger.sort(); ScrollTrigger.refresh(); } catch (e) { /* noop */ }
  }
})();
