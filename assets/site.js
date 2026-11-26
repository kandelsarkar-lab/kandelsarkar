/* ============================================================
   Kandel Sarkar — kandelbishal.com.np
   Faithful rebuild of the razorpay.com/ai-builders interactions:
   · canvas-rendered animated ASCII (hero scene, sculpture)
   · rotating 3D ASCII torus (drag to spin, inertia)
   · draggable OS windows (AirDrop / reality / brain)
   · scan line, count-up portals, scramble text, grain
   Vanilla JS, zero dependencies.
   ============================================================ */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reducedMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  var finePointer = !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches);

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(html) {
    var el = $("#toast");
    if (!el) return;
    el.innerHTML = html;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 3600);
  }

  /* ---------- animator: rAF loop that only runs while visible ---------- */
  function makeAnimator(el, drawFrame) {
    var running = false, raf = null;
    var t0 = performance.now();
    function frame(now) {
      if (!running) return;
      drawFrame((now - t0) / 1000);
      raf = requestAnimationFrame(frame);
    }
    if (reducedMotion) { drawFrame(0); return; }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !running) { running = true; raf = requestAnimationFrame(frame); }
          else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
        });
      }, { rootMargin: "100px" });
      io.observe(el);
    } else { running = true; raf = requestAnimationFrame(frame); }
  }

  /* ---------- nav burger ---------- */
  var nav = $("#nav");
  var burger = $("#burger");
  if (nav && burger) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav-link, .nav-cta", nav).forEach(function (a) {
      a.addEventListener("click", function () { nav.classList.remove("open"); });
    });
  }

  /* ---------- reveal on scroll ---------- */
  if ("IntersectionObserver" in window && !reducedMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    $$("[data-reveal]").forEach(function (el) { io.observe(el); });
  } else {
    $$("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- scramble headings (re-triggers on re-entry) ---------- */
  var SCRAMBLE_CHARS = "!<>-_\\/[]{}—=+*^?#@";
  function scrambleOnce(el) {
    if (el.dataset.scrambling === "1" || el.dataset.done === "1") return;
    var finalText = el.dataset.text || el.textContent;
    el.dataset.text = finalText;
    el.dataset.scrambling = "1";
    if (reducedMotion) { el.textContent = finalText; el.dataset.done = "1"; el.dataset.scrambling = "0"; return; }

    var queue = [];
    for (var i = 0; i < finalText.length; i++) {
      queue.push({
        start: Math.floor(Math.random() * 14),
        end: Math.floor(Math.random() * 22),
        ch: finalText.charAt(i)
      });
    }
    var frameN = 0;
    function step() {
      var out = "", done = 0;
      for (var j = 0; j < queue.length; j++) {
        var q = queue[j];
        if (frameN >= q.end) { out += q.ch; done++; }
        else if (frameN >= q.start) {
          if (!q.c || Math.random() < 0.28) { q.c = SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length)); }
          out += '<span style="color:rgba(91,132,255,0.6)">' + q.c + "</span>";
        } else { out += q.ch; }
      }
      el.innerHTML = out;
      if (done === queue.length) {
        el.textContent = finalText;
        el.dataset.done = "1";
        el.dataset.scrambling = "0";
        return;
      }
      frameN++;
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { scrambleOnce(e.target); }
        else if (e.target.dataset.done === "1") { e.target.dataset.done = "0"; } /* allow replay */
      });
    }, { threshold: 0.4 });
    $$("[data-scramble]").forEach(function (el) { so.observe(el); });
  } else {
    $$("[data-scramble]").forEach(function (el) { el.dataset.done = "1"; });
  }

  /* ---------- AirDrop parody ---------- */
  var airAccept = $("#airAccept");
  var airDecline = $("#airDecline");
  if (airAccept) {
    airAccept.addEventListener("click", function () {
      toast("Opening the newest upload… see you on YouTube ▶");
      window.open("https://youtu.be/wjW6yKTuyHw", "_blank", "noopener");
    });
  }
  if (airDecline) {
    airDecline.addEventListener("click", function () {
      airDecline.textContent = "maybe next upload";
      var win = airDecline.closest(".os-window");
      if (win) {
        win.classList.remove("shaking");
        void win.offsetWidth; /* restart the animation */
        win.classList.add("shaking");
      }
      var bin = win && win.querySelector(".bin");
      if (bin) {
        bin.classList.remove("gulp");
        void bin.offsetWidth;
        bin.classList.add("gulp");
      }
      toast("Fine. The algorithm will show you eventually.");
    });
  }

  /* ---------- reality portal ---------- */
  var reality = $("#reality");
  var realityClose = $("#realityClose");
  if (reality && realityClose) {
    if ("IntersectionObserver" in window && !reducedMotion) {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { reality.classList.add("on"); ro.unobserve(reality); }
        });
      }, { threshold: 0.15, rootMargin: "150px 0px 150px 0px" });
      ro.observe(reality);
    } else { reality.classList.add("on"); }
    realityClose.addEventListener("click", function () {
      var shut = reality.classList.toggle("shut");
      realityClose.textContent = shut ? "OPEN" : "CLOSE";
    });
  }

  /* ---------- stat portals: SCROLL / CLOSE + count-up ---------- */
  $$(".portal").forEach(function (p) {
    var rows = $(".portal-rows", p);
    var closeBtn = $("[data-close]", p);
    var scrollBtn = $("[data-scroll]", p);
    if (closeBtn && rows) {
      closeBtn.addEventListener("click", function () {
        rows.classList.toggle("shut");
        closeBtn.textContent = rows.classList.contains("shut") ? "OPEN" : "CLOSE";
      });
    }
    if (scrollBtn) {
      scrollBtn.addEventListener("click", function () {
        var next = document.getElementById(p.getAttribute("data-next") || "");
        if (next) next.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
      });
    }
  });

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    if (isNaN(target) || el.dataset.counted === "1") return;
    el.dataset.counted = "1";
    var suffix = el.getAttribute("data-suffix") || "";
    function fmt(v) { return v.toLocaleString("en-US") + suffix; }
    if (reducedMotion) { el.textContent = fmt(target); return; }
    var dur = 1100, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(eased * target));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { $$("[data-count]", e.target).forEach(countUp); co.unobserve(e.target); }
      });
    }, { threshold: 0.35 });
    $$("[data-count-up]").forEach(function (p) { co.observe(p); });
  } else {
    $$("[data-count]").forEach(countUp);
  }

  /* ---------- upload graph (deterministic seeded PRNG) ---------- */
  var graph = $("#graph");
  if (graph) {
    var seed = 20832023;
    function rand() {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    var frag = document.createDocumentFragment();
    for (var w = 0; w < 52; w++) {
      for (var d = 0; d < 7; d++) {
        var cell = document.createElement("span");
        cell.className = "graph-cell";
        var r = rand();
        if (r > 0.62) cell.classList.add("l1");
        if (r > 0.76) cell.classList.add("l2");
        if (r > 0.88) cell.classList.add("l3");
        if (r > 0.955) cell.classList.add("l4");
        cell.setAttribute("aria-hidden", "true");
        frag.appendChild(cell);
      }
    }
    graph.appendChild(frag);
  }

  /* ============================================================
     HERO SCENE — canvas-rendered drifting ASCII clouds + sparks
     (their page renders its ASCII art on <canvas>, so do we)
     ============================================================ */
  (function heroScene() {
    var canvas = $("#scene");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0;
    var clouds = [];
    var sparks = [];
    var SPARK_CHARS = ["*", "˚", "·", ".", "+", "˙"];

    /* ASCII clouds drawn with the same character language as their pre blocks */
    var CLOUD_ART = [
      ["      .~<xnnn?3XXXnxs,,--,,vvnnnnnv<;",
       "   ~<x?3XSSSXXnxs,          ,sXXnvv<;",
       "  <nXSXXnx:                  ~vnv;",
       "  <xXnx:              ,,      ~vn<",
       "   :x:          ~<x?3Xnxs,    ,v:",
       "     ~<xnnn?3XXXnxs,,--,,vvnnnnnv<;"],
      ["   ~<xn?3Xnxs,,vvv<;",
       "  <xXSSXnxs,   ,vn<;",
       "   :xnxs,   ,,  ~v<",
       "     ~<xnnnxs,--vv<;"],
      ["        .~<xnnn?3XXXnxs,,--,,vvnnnnnv<;",
       "     ~<x?3XSSSXXnxs,        ,sXXnvv<;",
       "    <nXSXXnx:                ~vnv;",
       "    <xXnx:            ,,      ~vn<",
       "     ~<xnnxs,,--,,vvnnnnnv<;"]
    ];

    function measure(art, size) {
      var maxW = 0;
      for (var i = 0; i < art.length; i++) maxW = Math.max(maxW, art[i].length);
      return { w: maxW * size * 0.6, h: art.length * size * 1.15 };
    }

    function resize() {
      var r = canvas.parentElement.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      clouds = [];
      var configs = [
        { art: 0, size: 11, speed: 9, yPct: 0.16, alpha: 0.5 },
        { art: 1, size: 9, speed: 14, yPct: 0.34, alpha: 0.65 },
        { art: 2, size: 12, speed: 6, yPct: 0.52, alpha: 0.42 },
        { art: 1, size: 8, speed: 18, yPct: 0.7, alpha: 0.55 },
        { art: 0, size: 7, speed: 22, yPct: 0.86, alpha: 0.35 }
      ];
      configs.forEach(function (c, i) {
        var m = measure(CLOUD_ART[c.art], c.size);
        clouds.push({
          art: CLOUD_ART[c.art],
          size: c.size,
          speed: c.speed,
          x: Math.random() * W,
          y: H * c.yPct + (i % 2 ? 20 : -14),
          alpha: c.alpha,
          w: m.w, h: m.h,
          phase: Math.random() * 6.28
        });
      });

      sparks = [];
      var n = Math.max(24, Math.round((W * H) / 34000));
      for (var s = 0; s < n; s++) {
        sparks.push({
          x: Math.random() * W,
          y: Math.random() * H,
          ch: SPARK_CHARS[Math.floor(Math.random() * SPARK_CHARS.length)],
          phase: Math.random() * 6.28,
          speed: 0.6 + Math.random() * 1.6
        });
      }
    }

    function drawCloud(c, t) {
      var bob = Math.sin(t * 0.12 + c.phase) * 10;
      ctx.font = c.size + 'px "Courier New", monospace';
      ctx.fillStyle = "rgba(115,153,255," + c.alpha + ")";
      for (var i = 0; i < c.art.length; i++) {
        ctx.fillText(c.art[i], Math.round(c.x), Math.round(c.y + bob + i * c.size * 1.15));
      }
    }

    function drawFrame(t) {
      ctx.clearRect(0, 0, W, H);
      /* sparkles */
      ctx.font = '10px "Courier New", monospace';
      for (var i = 0; i < sparks.length; i++) {
        var s = sparks[i];
        var a = 0.18 + 0.42 * (0.5 + 0.5 * Math.sin(t * s.speed + s.phase));
        ctx.fillStyle = "rgba(244,244,244," + a.toFixed(3) + ")";
        ctx.fillText(s.ch, Math.round(s.x), Math.round(s.y));
      }
      /* clouds drift left, wrap around */
      for (var j = 0; j < clouds.length; j++) {
        var c = clouds[j];
        c.x -= c.speed / 60;
        if (c.x < -c.w - 40) c.x = W + 40;
        drawCloud(c, t);
      }
    }

    resize();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); if (reducedMotion) drawFrame(0); }).observe(canvas.parentElement);
    } else {
      window.addEventListener("resize", function () { resize(); if (reducedMotion) drawFrame(0); });
    }
    makeAnimator(canvas, drawFrame);
  })();

  /* ============================================================
     THE SCULPTURE — rotating 3D ASCII torus on canvas
     (classic donut math · drag to spin · inertia · fps-capped)
     ============================================================ */
  (function torusSculpture() {
    var canvas = $("#torus");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var CHARS = ".,-~:;=!*#$@";
    var R1 = 1, R2 = 2, K2 = 5;
    var cw = 10, chh = 12;
    var cols = 0, rows = 0, originX = 0, originY = 0, K1 = 1;
    var zbuf = null, cells = null;
    var A = 1.1, B = 0.4;
    var vA = 0.0035, vB = 0.007;
    var BASE_VA = 0.0035, BASE_VB = 0.007;
    var dragging = false, lastX = 0, lastY = 0;
    var lastDraw = 0;

    function resize() {
      var r = canvas.getBoundingClientRect();
      var cssW = Math.max(1, Math.round(r.width));
      var cssH = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      canvas.style.width = cssW + "px";
      canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var boxW = Math.min(cssW, 620);
      cols = Math.max(20, Math.floor(boxW / cw));
      rows = Math.max(16, Math.floor(cssH / chh));
      originX = (cssW - cols * cw) / 2;
      originY = (cssH - rows * chh) / 2;
      K1 = cols * 0.62;
      zbuf = new Float32Array(cols * rows);
      cells = new Array(cols * rows);
    }

    function draw() {
      A += vA; B += vB;
      var cA = Math.cos(A), sA = Math.sin(A), cB = Math.cos(B), sB = Math.sin(B);
      for (var z = 0; z < zbuf.length; z++) { zbuf[z] = 0; cells[z] = null; }

      for (var th = 0; th < 6.2832; th += 0.07) {
        var ct = Math.cos(th), st = Math.sin(th);
        var circlex = R2 + R1 * ct;
        var circley = R1 * st;
        for (var ph = 0; ph < 6.2832; ph += 0.03) {
          var cp = Math.cos(ph), sp = Math.sin(ph);
          /* local point + normal */
          var px = circlex * cp, py = circlex * sp, pz = circley;
          var nx = ct * cp, ny = ct * sp, nz = st;
          /* rotate Rx(A) */
          var rx1 = px, ry1 = py * cA - pz * sA, rz1 = py * sA + pz * cA;
          var nrx = nx, nry = ny * cA - nz * sA, nrz = ny * sA + nz * cA;
          /* rotate Rz(B) */
          var rx2 = rx1 * cB - ry1 * sB, ry2 = rx1 * sB + ry1 * cB, rz2 = rz1;
          var nsx = nrx * cB - nry * sB, nsy = nrx * sB + nry * cB, nsz = nrz;

          var zc = rz2 + K2;
          if (zc <= 0.25) continue;
          var ooz = 1 / zc;
          var xp = Math.round(cols / 2 + K1 * ooz * rx2);
          var yp = Math.round(rows / 2 - K1 * ooz * ry2 * (cw / chh));
          if (xp < 0 || xp >= cols || yp < 0 || yp >= rows) continue;

          var L = nsy * 0.707 + nsz * 0.707; /* light from top-front */
          var oozCell = ooz;
          var idx = yp * cols + xp;
          if (oozCell > zbuf[idx]) {
            zbuf[idx] = oozCell;
            var ci = Math.floor((L + 1) * 6);
            if (ci < 0) ci = 0; else if (ci > 11) ci = 11;
            cells[idx] = { ch: CHARS.charAt(ci), a: Math.max(0.25, Math.min(1, 0.3 + 0.7 * Math.max(L, 0))) };
          }
        }
      }

      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.font = (chh - 2) + 'px "Courier New", monospace';
      ctx.textBaseline = "top";
      for (var yy = 0; yy < rows; yy++) {
        for (var xx = 0; xx < cols; xx++) {
          var c = cells[yy * cols + xx];
          if (!c) continue;
          ctx.fillStyle = "rgba(244,244,244," + c.a.toFixed(3) + ")";
          ctx.fillText(c.ch, originX + xx * cw, originY + yy * chh);
        }
      }
    }

    function drawNow() { lastDraw = performance.now(); draw(); }

    /* drag to rotate — with inertia */
    canvas.addEventListener("pointerdown", function (e) {
      dragging = true;
      canvas.dataset.dragged = "1";
      lastX = e.clientX; lastY = e.clientY;
      if (finePointer && canvas.setPointerCapture) {
        try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
    });
    canvas.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      B += dx * 0.01;
      A += dy * 0.01;
      vB = Math.max(-0.12, Math.min(0.12, dx * 0.06));
      vA = Math.max(-0.12, Math.min(0.12, dy * 0.06));
      if (reducedMotion) { vA = 0; vB = 0; drawNow(); }
    });
    function endDrag() { dragging = false; }
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", function () { if (dragging) endDrag(); });

    /* animate: single rAF loop from makeAnimator, fps-capped at ~30, inertia decays to base spin */
    function tick() {
      var now = performance.now();
      if (now - lastDraw >= 33) {
        if (!dragging) {
          vA += (BASE_VA - vA) * 0.02;
          vB += (BASE_VB - vB) * 0.02;
        }
        drawNow();
      }
    }

    resize();
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { resize(); drawNow(); }).observe(canvas);
    } else {
      window.addEventListener("resize", function () { resize(); drawNow(); });
    }
    if (reducedMotion) { vA = 0; vB = 0; drawNow(); }
    else {
      makeAnimator(canvas, tick);
      drawNow();
    }
  })();

  /* ---------- draggable windows (desktop only — CSS vars keep it layout-safe) ---------- */
  function makeDraggable(win, handle) {
    if (!win || !handle) return;
    var dragging = false, startX = 0, startY = 0;
    function enabled() {
      return finePointer && window.matchMedia("(min-width: 1021px)").matches;
    }
    handle.addEventListener("pointerdown", function (e) {
      if (!enabled()) return;
      if (e.target.closest && e.target.closest("button, a, input")) return; /* keep controls clickable */
      dragging = true;
      win.dataset.dragged = "1";
      win.classList.add("dragging");
      startX = e.clientX; startY = e.clientY;
      if (handle.setPointerCapture) {
        try { handle.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      e.preventDefault();
    });
    handle.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      win.style.setProperty("--dx", (e.clientX - startX) + "px");
      win.style.setProperty("--dy", (e.clientY - startY) + "px");
    });
    function stop() { dragging = false; win.classList.remove("dragging"); }
    handle.addEventListener("pointerup", stop);
    handle.addEventListener("pointercancel", stop);
  }
  $$("[data-drag]").forEach(function (win) {
    makeDraggable(win, win.querySelector(".os-bar") || win);
  });

  /* ============================================================
     PHOTO -> ASCII (their PhotoCanvas technique)
     kandel-sarkar-profile.jpg rendered live as ASCII characters:
     develops row by row, then a scan band sweeps forever.
     ============================================================ */
  (function asciiPhoto() {
    var canvas = document.getElementById("ascii-photo");
    if (!canvas || !canvas.getContext) return;
    var stack = canvas.parentElement;
    var img = stack && stack.querySelector("img");
    if (!img) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var RAMP = ".,-~:;=!*#$@";
    var cw = 6, chh = 7;
    var cols = 0, rows = 0, chars = null, alphas = null, drawnRows = 0;
    var off = document.createElement("canvas");
    var offCtx = off.getContext("2d");
    var t0 = null, developDone = false, developed = 0;

    function fail() { canvas.style.display = "none"; }

    function build() {
      if (!img.naturalWidth) { fail(); return false; }
      var r = stack.getBoundingClientRect();
      var cssW = Math.max(1, Math.round(r.width));
      var cssH = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      off.width = canvas.width;
      off.height = canvas.height;
      offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.max(10, Math.floor(cssW / cw));
      rows = Math.max(10, Math.floor(cssH / chh));
      try {
        var oc = document.createElement("canvas");
        oc.width = cols; oc.height = rows;
        var octx = oc.getContext("2d", { willReadFrequently: true });
        octx.drawImage(img, 0, 0, cols, rows);
        var data = octx.getImageData(0, 0, cols, rows).data;
      } catch (e) { fail(); return false; }
      chars = []; alphas = [];
      for (var i = 0; i < cols * rows; i++) {
        var b = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
        var ci = Math.floor(b * RAMP.length);
        if (ci < 0) ci = 0; else if (ci >= RAMP.length) ci = RAMP.length - 1;
        chars.push(RAMP.charAt(ci));
        alphas.push(0.22 + 0.78 * b);
      }
      offCtx.fillStyle = "#0a0a0a";
      offCtx.fillRect(0, 0, cssW, cssH);
      offCtx.font = (chh - 1) + 'px "Courier New", monospace';
      offCtx.textBaseline = "top";
      drawnRows = 0;
      return true;
    }

    function drawMore(target) {
      if (!chars) return;
      var end = Math.min(rows, Math.ceil(target * rows));
      for (var y = drawnRows; y < end; y++) {
        for (var x = 0; x < cols; x++) {
          var idx = y * cols + x;
          offCtx.fillStyle = "rgba(244,244,244," + alphas[idx].toFixed(3) + ")";
          offCtx.fillText(chars[idx], x * cw, y * chh);
        }
      }
      drawnRows = end;
    }

    function composite() {
      var cssW = canvas.width / dpr, cssH = canvas.height / dpr;
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.drawImage(off, 0, 0, cssW, cssH);
    }

    function frame(t) {
      if (!chars) return;
      var tt = t || 0;
      if (t0 === null) t0 = tt;
      if (!developDone) {
        developed = Math.min(1, (tt - t0) / 1.3);
        drawMore(developed);
        if (developed >= 1) developDone = true;
      }
      composite();
      if (developDone) {
        var band = Math.floor((tt * 12) % (rows + 24) - 12);
        ctx.font = (chh - 1) + 'px "Courier New", monospace';
        ctx.textBaseline = "top";
        for (var y = Math.max(0, band - 1); y <= Math.min(drawnRows - 1, band + 1); y++) {
          for (var x = 0; x < cols; x++) {
            ctx.fillStyle = "rgba(115,153,255,0.9)";
            ctx.fillText(chars[y * cols + x], x * cw, y * chh);
          }
        }
      }
    }

    function init() {
      if (!build()) return;
      if ("ResizeObserver" in window) {
        new ResizeObserver(function () {
          if (build()) drawMore(developDone ? 1 : developed);
        }).observe(stack);
      }
      makeAnimator(canvas, frame);
      composite(); /* paint the dark plate now; develop starts when visible */
    }

    if (img.complete && img.naturalWidth > 0) init();
    else {
      img.addEventListener("load", init, { once: true });
      img.addEventListener("error", fail, { once: true });
    }
  })();

  /* ---------- catch the atom game ---------- */
  var gameStart = $("#gameStart");
  var arena = $("#gameArena");
  var atom = $("#atom");
  var gameStatus = $("#gameStatus");
  var gameScore = $("#gameScore");
  var gameTime = $("#gameTime");
  var game = { running: false, caught: 0, timeLeft: 0, tick: null };

  function setStats() {
    if (gameScore) gameScore.textContent = String(game.caught);
    if (gameTime) gameTime.textContent = String(Math.max(0, Math.ceil(game.timeLeft)));
  }

  function endGame(win) {
    game.running = false;
    clearInterval(game.tick);
    game.tick = null;
    if (arena) arena.classList.remove("on");
    if (gameStart) gameStart.textContent = "PLAY AGAIN";
    if (gameStatus) {
      gameStatus.classList.toggle("win", win);
      gameStatus.textContent = win
        ? "You win. Flawless reflexes. Your prize: subscribing counts as scientific research."
        : "You lost. Bet you couldn't. Redemption arc: watch a video and try again.";
    }
    if (win) toast("You won the game 🏆 <a href='https://youtube.com/@kandelsarkar' target='_blank' rel='noopener'>Claim your prize on YouTube →</a>");
  }

  function moveAtom() {
    if (!atom || !arena) return;
    var pad = 8;
    var maxX = arena.clientWidth - atom.offsetWidth - pad * 2;
    var maxY = arena.clientHeight - atom.offsetHeight - pad * 2;
    if (maxX < 0) maxX = 0;
    if (maxY < 0) maxY = 0;
    atom.style.left = (pad + Math.random() * maxX) + "px";
    atom.style.top = (pad + Math.random() * maxY) + "px";
  }

  function spawnFx(x, y) {
    if (!arena || reducedMotion) return;
    var ring = document.createElement("span");
    ring.className = "ripple";
    ring.style.left = x + "px";
    ring.style.top = y + "px";
    var badge = document.createElement("span");
    badge.className = "pop-badge";
    badge.textContent = "+1";
    badge.style.left = (x + 4) + "px";
    badge.style.top = (y - 20) + "px";
    arena.appendChild(ring);
    arena.appendChild(badge);
    setTimeout(function () {
      if (ring.parentNode) ring.parentNode.removeChild(ring);
      if (badge.parentNode) badge.parentNode.removeChild(badge);
    }, 750);
  }

  if (gameStart && arena && atom) {
    gameStart.addEventListener("click", function () {
      if (game.running) return;
      game.running = true;
      game.caught = 0;
      game.timeLeft = 12;
      setStats();
      if (gameStatus) { gameStatus.textContent = ""; gameStatus.classList.remove("win"); }
      gameStart.textContent = "RUNNING…";
      arena.classList.add("on");
      moveAtom();
      game.tick = setInterval(function () {
        game.timeLeft -= 0.1;
        setStats();
        if (game.timeLeft <= 0) endGame(false);
      }, 100);
    });
    atom.addEventListener("click", function () {
      if (!game.running) return;
      game.caught++;
      setStats();
      spawnFx(atom.offsetLeft + atom.offsetWidth / 2, atom.offsetTop + atom.offsetHeight / 2);
      if (game.caught >= 5) { endGame(true); return; }
      moveAtom();
    });
  }

  /* ---------- footer ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  var heart = $("#footHeart");
  var taps = 0, tapTimer = null;
  if (heart) {
    heart.addEventListener("click", function () {
      taps += 1;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(function () { taps = 0; }, 1800);
      if (taps >= 7) {
        taps = 0;
        toast("🇳🇵 धन्यवाद! You found it — see you in the next upload.");
      }
    });
  }
})();
