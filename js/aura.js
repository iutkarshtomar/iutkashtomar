/* ==========================================================================
   AURA — the living background.
   A single full-screen WebGL fragment shader: domain-warped fbm aurora in
   violet / magenta / electric blue, with a breathing "focus halo" that sits
   behind the hero cutout. Rendered at reduced resolution (it is soft by
   nature): at most ~0.55 backing pixels per CSS pixel whatever the DPR, paced
   to ~60fps on high-refresh screens, paused on hidden tabs.
   No image pixels are ever read — nothing here can taint on file://.
   ========================================================================== */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 aPos;',
    'void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision mediump float;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform float uScroll;',
    'uniform float uBoost;',
    'uniform vec3 uFocus;',
    'float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }',
    'float noise(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); vec2 u=f*f*(3.0-2.0*f);',
    '  float a=hash(i); float b=hash(i+vec2(1.0,0.0)); float c=hash(i+vec2(0.0,1.0)); float d=hash(i+vec2(1.0,1.0));',
    '  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y); }',
    'float fbm(vec2 p){ float v=0.0; float a=0.5; mat2 m=mat2(1.6,1.2,-1.2,1.6);',
    '  for(int i=0;i<4;i++){ v+=a*noise(p); p=m*p; a*=0.5; } return v; }',
    'vec3 pal(float t){',
    '  vec3 v = vec3(0.49,0.33,1.0); vec3 m = vec3(0.95,0.20,0.70); vec3 b = vec3(0.20,0.45,1.0);',
    '  t = fract(t);',
    '  vec3 c = mix(v, m, smoothstep(0.0, 0.34, t));',
    '  c = mix(c, b, smoothstep(0.34, 0.67, t));',
    '  c = mix(c, v, smoothstep(0.67, 1.0, t));',
    '  return c; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float asp = uRes.x / uRes.y;',
    '  vec2 p = vec2((uv.x-0.5)*asp, uv.y-0.5);',
    '  float t = uTime * 0.045;',
    '  vec2 q = vec2(fbm(p*1.2 + vec2(0.0, t)), fbm(p*1.2 + vec2(5.2, -t*0.8)));',
    '  float f = fbm(p*1.55 + q*1.9 + vec2(t*0.6, -t*0.3));',
    '  float bands = sin((p.x + q.y*1.1)*3.4 + t*2.2)*0.5 + 0.5;',
    '  float curtain = smoothstep(0.28, 0.95, f) * (0.45 + 0.55*bands);',
    '  curtain *= smoothstep(-0.75, 0.3, p.y + (q.x-0.5)*0.8) * 0.85 + 0.15;',
    '  vec3 col = pal(f*0.85 + q.x*0.55 + uv.x*0.22 + uScroll*0.85);',
    '  vec3 c = col * curtain * (0.22 + 1.05*uBoost);',
    '  vec2 fp = vec2((uFocus.x-0.5)*asp, uFocus.y-0.5);',
    '  vec2 dv = (p - fp) * vec2(1.0, 0.82);',
    '  float d = length(dv);',
    '  float halo = exp(-d*d*4.2) * uFocus.z;',
    '  float core = exp(-d*d*14.0) * uFocus.z;',
    '  vec3 hcol = pal(0.08 + d*0.55 + t*0.5 + uScroll*0.85);',
    '  float breathe = 0.82 + 0.18*sin(uTime*0.8);',
    '  c += hcol * halo * 0.62 * breathe + vec3(0.62,0.48,1.0) * core * 0.22 * breathe;',
    '  c *= smoothstep(1.35, 0.2, length(p*vec2(0.8, 1.0)));',
    '  c = c / (1.0 + c*0.55);',
    '  c += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * (2.0/255.0);',
    '  gl_FragColor = vec4(c + vec3(0.0196, 0.0196, 0.0275), 1.0);',
    '}'
  ].join('\n');

  function Aura(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.static = !!opts.static;
    this.mobile = !!opts.mobile;
    this.quality = opts.quality || (this.mobile ? 0.42 : 0.45);
    this.running = false;
    this.visible = true;
    this.t0 = performance.now();
    this.timeOffset = 12.0;
    this.cur = { boost: 1.0, scroll: 0, fx: 0.5, fy: 0.62, fa: 0.0, lift: 0 };
    this.tgt = { boost: 1.0, scroll: 0, fx: 0.5, fy: 0.62, fa: 1.0, lift: 0 };
    this.ok = this._init();
    Aura.current = this; // handle for add-on scripts (js/render.js)
  }

  Aura.prototype._init = function () {
    var gl;
    try {
      gl = this.canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'low-power' }) ||
           this.canvas.getContext('experimental-webgl');
    } catch (e) { gl = null; }
    if (!gl) return false;
    this.gl = gl;

    var vs = this._shader(gl.VERTEX_SHADER, VERT);
    var fs = this._shader(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);
    this.prog = prog;

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    this.u = {
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      scroll: gl.getUniformLocation(prog, 'uScroll'),
      boost: gl.getUniformLocation(prog, 'uBoost'),
      focus: gl.getUniformLocation(prog, 'uFocus')
    };

    var self = this;
    this.canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      self.lost = true;
      self.stop();
      self.canvas.classList.remove('is-ready');
    }, false);

    this.resize();
    return true;
  };

  Aura.prototype._shader = function (type, src) {
    var gl = this.gl, s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  };

  Aura.prototype.resize = function () {
    if (!this.gl) return;
    var cap = this.mobile ? 1.5 : 2;
    var dpr = Math.min(window.devicePixelRatio || 1, cap);
    // a retina screen doesn't need 4x the fragments for a soft field: cap the scale
    var scale = Math.min(dpr * this.quality, 0.55);
    var w = Math.max(2, Math.round(window.innerWidth * scale));
    var h = Math.max(2, Math.round(window.innerHeight * scale));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      this.gl.viewport(0, 0, w, h);
    }
    if (this.static) this.render(true);
  };

  Aura.prototype.set = function (k, v) { this.tgt[k] = v; if (this.static) { this.cur[k] = v; } };
  Aura.prototype.setFocus = function (x, y, a) { this.tgt.fx = x; this.tgt.fy = y; this.tgt.fa = a; };
  /* additive, eased boost on top of the per-section level (section tracking owns `boost`) */
  Aura.prototype.lift = function (v) { this.tgt.lift = v; if (this.static) this.cur.lift = v; };

  Aura.prototype.render = function (force) {
    var gl = this.gl;
    if (!gl || this.lost) return;
    var c = this.cur, t = this.tgt;
    if (this.static || force === true) {
      c.boost = t.boost; c.scroll = t.scroll; c.fx = t.fx; c.fy = t.fy; c.fa = t.fa; c.lift = t.lift;
    } else {
      c.boost += (t.boost - c.boost) * 0.045;
      c.scroll += (t.scroll - c.scroll) * 0.06;
      c.fx += (t.fx - c.fx) * 0.12;
      c.fy += (t.fy - c.fy) * 0.12;
      c.fa += (t.fa - c.fa) * 0.05;
      c.lift += (t.lift - c.lift) * 0.08;
    }
    var time = this.static ? 18.0 : (performance.now() - this.t0) / 1000 + this.timeOffset;
    gl.uniform2f(this.u.res, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.u.time, time);
    gl.uniform1f(this.u.scroll, c.scroll);
    gl.uniform1f(this.u.boost, c.boost + c.lift);
    gl.uniform3f(this.u.focus, c.fx, c.fy, c.fa);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!this.readyFlag) {
      this.readyFlag = true;
      var cv = this.canvas;
      requestAnimationFrame(function () { cv.classList.add('is-ready'); });
    }
  };

  Aura.prototype._loop = function (ts) {
    if (!this.running) return;
    // ~60fps cap: on 120Hz displays draw every other frame (the motion is slow, and
    // the per-frame easing then runs at the same speed everywhere)
    if (!ts || !this.lastTs || ts - this.lastTs >= 15) {
      this.lastTs = ts || 0;
      this.render();
    }
    var self = this;
    this.raf = requestAnimationFrame(function (t) { self._loop(t); });
  };

  Aura.prototype.start = function () {
    if (this.static || this.running || !this.ok || this.lost) return;
    this.running = true;
    this.lastTs = 0;
    this._loop();
  };

  Aura.prototype.stop = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  window.AuraField = Aura;
})();
