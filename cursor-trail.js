/* ============================================================
   CURSOR TRAIL — Vanilla JS
   Flowing colorful lines that follow the mouse cursor
   ============================================================ */
(function () {

  // skip on touch-only devices
  if (!window.matchMedia('(hover: hover)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var ctx, f, e = 0, pos = {}, lines = [];

  var E = {
    friction:   0.5,
    trails:     60,
    size:       50,
    dampening:  0.025,
    tension:    0.99,
  };

  /* ── Oscillator (hue cycling) ── */
  function Oscillator(opts) {
    this.phase     = opts.phase     || 0;
    this.offset    = opts.offset    || 0;
    this.frequency = opts.frequency || 0.001;
    this.amplitude = opts.amplitude || 1;
  }
  Oscillator.prototype.update = function () {
    this.phase += this.frequency;
    e = this.offset + Math.sin(this.phase) * this.amplitude;
    return e;
  };
  Oscillator.prototype.value = function () { return e; };

  /* ── Node ── */
  function Node() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
  }

  /* ── Line ── */
  function Line(opts) {
    this.spring   = opts.spring + 0.1 * Math.random() - 0.05;
    this.friction = E.friction  + 0.01 * Math.random() - 0.005;
    this.nodes    = [];
    for (var i = 0; i < E.size; i++) {
      var n = new Node();
      n.x = pos.x || 0;
      n.y = pos.y || 0;
      this.nodes.push(n);
    }
  }
  Line.prototype.update = function () {
    var spring = this.spring;
    var t = this.nodes[0];
    t.vx += (pos.x - t.x) * spring;
    t.vy += (pos.y - t.y) * spring;
    for (var n, i = 0, len = this.nodes.length; i < len; i++) {
      t = this.nodes[i];
      if (i > 0) {
        n = this.nodes[i - 1];
        t.vx += (n.x - t.x) * spring;
        t.vy += (n.y - t.y) * spring;
        t.vx += n.vx * E.dampening;
        t.vy += n.vy * E.dampening;
      }
      t.vx *= this.friction;
      t.vy *= this.friction;
      t.x  += t.vx;
      t.y  += t.vy;
      spring *= E.tension;
    }
  };
  Line.prototype.draw = function () {
    var x = this.nodes[0].x;
    var y = this.nodes[0].y;
    var n, next;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (var i = 1, len = this.nodes.length - 2; i < len; i++) {
      n    = this.nodes[i];
      next = this.nodes[i + 1];
      x = 0.5 * (n.x + next.x);
      y = 0.5 * (n.y + next.y);
      ctx.quadraticCurveTo(n.x, n.y, x, y);
    }
    n    = this.nodes[i];
    next = this.nodes[i + 1];
    ctx.quadraticCurveTo(n.x, n.y, next.x, next.y);
    ctx.stroke();
    ctx.closePath();
  };

  /* ── Render loop ── */
  function render() {
    if (!ctx.running) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'hsla(' + Math.round(f.update()) + ',100%,60%,0.028)';
    ctx.lineWidth   = 12;
    for (var i = 0; i < E.trails; i++) {
      lines[i].update();
      lines[i].draw();
    }
    ctx.frame++;
    requestAnimationFrame(render);
  }

  /* ── Build lines ── */
  function buildLines() {
    lines = [];
    for (var i = 0; i < E.trails; i++) {
      lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
    }
  }

  /* ── Mouse / touch handlers ── */
  function onMove(ev) {
    if (ev.touches) {
      pos.x = ev.touches[0].pageX;
      pos.y = ev.touches[0].pageY;
    } else {
      pos.x = ev.clientX;
      pos.y = ev.clientY;
    }
    ev.preventDefault();
  }
  function onTouchStart(ev) {
    if (ev.touches.length === 1) {
      pos.x = ev.touches[0].pageX;
      pos.y = ev.touches[0].pageY;
    }
  }

  function firstMove(ev) {
    document.removeEventListener('mousemove', firstMove);
    document.removeEventListener('touchstart', firstMove);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchstart', onTouchStart);
    onMove(ev);
    buildLines();
    render();
  }

  /* ── Resize ── */
  function resize() {
    ctx.canvas.width  = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
  }

  /* ── Init ── */
  function init() {
    var canvas = document.getElementById('trailCanvas');
    if (!canvas) return;

    ctx         = canvas.getContext('2d');
    ctx.running = true;
    ctx.frame   = 1;

    f = new Oscillator({
      phase:     Math.random() * 2 * Math.PI,
      amplitude: 85,
      frequency: 0.0015,
      offset:    285,
    });

    resize();
    window.addEventListener('resize', resize);

    document.addEventListener('mousemove', firstMove);
    document.addEventListener('touchstart', firstMove);

    window.addEventListener('focus', function () {
      if (!ctx.running) { ctx.running = true; render(); }
    });
    window.addEventListener('blur', function () {
      ctx.running = false;
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
