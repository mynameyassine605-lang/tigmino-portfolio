/* ============================================================
   TIGMINO — Main Script
   Premium animation layer. Every interaction intentional.
   Philosophy: Apple · Linear · Awwwards
   ============================================================ */

(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP      = () => typeof gsap !== 'undefined';
  const hasHover     = window.matchMedia('(hover: hover)').matches;

  /* ──────────────────────────────────────────────────────────
     CUSTOM CURSOR
     Dot snaps. Ring follows with spring lag.
     Scale on link/view hover. Disappears on touch.
  ────────────────────────────────────────────────────────── */
  if (hasHover) {
    const dot  = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (dot && ring) {
      let mx = -100, my = -100;
      let rx = -100, ry = -100;
      const LERP = 0.12; // spring factor — lower = more lag

      // dot snaps immediately
      window.addEventListener('mousemove', e => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate(calc(${mx}px - 50%), calc(${my}px - 50%))`;
      }, { passive: true });

      // ring springs after
      (function tickRing() {
        rx += (mx - rx) * LERP;
        ry += (my - ry) * LERP;
        ring.style.transform = `translate(calc(${rx}px - 50%), calc(${ry}px - 50%))`;
        requestAnimationFrame(tickRing);
      })();

      // state machine: idle / link / view
      function setCursorState(state) {
        ring.classList.remove('is-link', 'is-view', 'is-text');
        if (state) ring.classList.add(state);
      }

      document.addEventListener('mouseover', e => {
        if (e.target.closest('[data-cursor="view"]'))      setCursorState('is-view');
        else if (e.target.closest('[data-cursor="link"]')) setCursorState('is-link');
        else if (e.target.closest('p, h1, h2, h3, li'))   setCursorState('is-text');
        else                                                setCursorState(null);
      });

      // hide cursor when leaving window
      document.addEventListener('mouseleave', () => {
        dot.style.opacity  = '0';
        ring.style.opacity = '0';
      });
      document.addEventListener('mouseenter', () => {
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
      });

      // click pulse
      document.addEventListener('mousedown', () => ring.classList.add('is-click'));
      document.addEventListener('mouseup',   () => ring.classList.remove('is-click'));
    }
  }

  /* ──────────────────────────────────────────────────────────
     HERO ENTRANCE
     Sequenced: name clips → photo → role → CTAs → footer
     All driven by CSS transitions triggered by class additions.
  ────────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    if (reduceMotion) {
      document.querySelectorAll('[data-reveal-clip], .hero__role, .hero__photo, .hero__ctas, .hero__footer > *')
        .forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
      return;
    }

    const clips  = document.querySelectorAll('[data-reveal-clip]');
    const photo  = document.querySelector('.hero__photo');
    const role   = document.querySelector('.hero__role');
    const ctas   = document.querySelector('.hero__ctas');
    const kicker = document.querySelector('.hero__kicker');

    // stagger the sequence with deliberate timing
    requestAnimationFrame(() => {
      // kicker
      setTimeout(() => kicker?.classList.add('is-visible'), 80);
      // name lines
      setTimeout(() => clips.forEach(el => el.classList.add('is-visible')), 200);
      // photo (slightly behind name for depth)
      setTimeout(() => photo?.classList.add('is-visible'), 320);
      // role & CTAs
      setTimeout(() => role?.classList.add('is-visible'), 520);
      setTimeout(() => ctas?.classList.add('is-visible'), 680);
    });
  });

  /* ──────────────────────────────────────────────────────────
     HERO PARALLAX
     Smooth rAF-driven — no jank, no layout thrash.
  ────────────────────────────────────────────────────────── */
  if (!reduceMotion) {
    const heroPhoto = document.querySelector('.hero__photo');
    const heroEl    = document.querySelector('.hero');

    if (heroPhoto && heroEl) {
      let ticking = false;
      let lastScroll = 0;

      window.addEventListener('scroll', () => {
        lastScroll = window.scrollY;
        if (!ticking) {
          requestAnimationFrame(() => {
            const rect     = heroEl.getBoundingClientRect();
            const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
            heroPhoto.style.transform = `translateY(${progress * 36}px)`;
            ticking = false;
          });
          ticking = true;
        }
      }, { passive: true });
    }
  }

  /* ──────────────────────────────────────────────────────────
     SCROLL REVEAL
     Stagger siblings in the same parent for rhythm.
     Respect the order they appear, not the IO callback order.
  ────────────────────────────────────────────────────────── */
  const revealEls = document.querySelectorAll('[data-reveal]');

  if (!reduceMotion && revealEls.length) {
    // Group elements by their parent so siblings stagger together
    const groups = new Map();
    revealEls.forEach(el => {
      const parent = el.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(el);
    });

    const revealIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const parent = el.parentElement;
        const siblings = groups.get(parent) || [el];
        const index    = siblings.indexOf(el);

        setTimeout(() => {
          el.classList.add('is-visible');
        }, index * 55); // 55ms stagger feels natural

        revealIO.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    revealEls.forEach(el => revealIO.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ──────────────────────────────────────────────────────────
     EXPLORE CARDS GSAP STAGGER
     Cards reveal as a group when the section enters view.
  ────────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    if (!hasGSAP() || reduceMotion) return;

    const cards = document.querySelectorAll('[data-gsap-card]');
    if (!cards.length) return;

    const cardIO = new IntersectionObserver(entries => {
      // trigger once when any card enters
      if (!entries.some(e => e.isIntersecting)) return;
      cardIO.disconnect();

      gsap.fromTo(cards,
        { opacity: 0, y: 32, scale: 0.98 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: { amount: 0.28, from: 'start' }
        }
      );
    }, { threshold: 0.12 });

    cards.forEach(c => cardIO.observe(c));
  });

  /* ──────────────────────────────────────────────────────────
     SKILL RINGS
     Animate stroke with eased cubic interpolation.
  ────────────────────────────────────────────────────────── */
  const skillRings = document.querySelectorAll('.skill-ring');
  if (skillRings.length) {
    const circumference = 213.6;
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const ringIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const ring    = entry.target;
        const percent = parseFloat(ring.dataset.percent);
        const circle  = ring.querySelector('[data-ring]');
        const target  = circumference - (percent / 100) * circumference;

        if (reduceMotion) {
          circle.style.strokeDashoffset = target;
        } else {
          const duration = 1200;
          const start    = performance.now();
          const initial  = circumference;

          (function tick(now) {
            const p      = Math.min((now - start) / duration, 1);
            const eased  = easeOut(p);
            circle.style.strokeDashoffset = initial + (target - initial) * eased;
            if (p < 1) requestAnimationFrame(tick);
          })(start);
        }

        ringIO.unobserve(ring);
      });
    }, { threshold: 0.4 });

    skillRings.forEach(r => ringIO.observe(r));
  }

  /* ──────────────────────────────────────────────────────────
     TIMELINE — glowing fill line
     Smooth lerp instead of hard height assignment.
  ────────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    const rail      = document.querySelector('.timeline__rail');
    const fill      = document.getElementById('timelineFill');
    const items     = document.querySelectorAll('.timeline-item');
    if (!rail || !fill || !items.length) return;

    let currentH   = 0;
    let targetH    = 0;
    let rafRunning = false;

    function calcTarget() {
      const rect = rail.getBoundingClientRect();
      const vh   = window.innerHeight;
      const p    = (vh * 0.72 - rect.top) / rect.height;
      targetH    = Math.min(Math.max(p, 0), 1) * 100;
    }

    function smoothFill() {
      currentH += (targetH - currentH) * 0.08;
      fill.style.height = currentH.toFixed(2) + '%';
      if (Math.abs(targetH - currentH) > 0.05) {
        requestAnimationFrame(smoothFill);
      } else {
        fill.style.height = targetH + '%';
        rafRunning = false;
      }
    }

    window.addEventListener('scroll', () => {
      calcTarget();
      if (!rafRunning) { rafRunning = true; requestAnimationFrame(smoothFill); }
    }, { passive: true });
    calcTarget();
    smoothFill();

    // timeline item reveal
    if (!reduceMotion && hasGSAP()) {
      const itemIO = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-active');
          const card = entry.target.querySelector('.timeline-item__card');
          if (card) {
            gsap.fromTo(card,
              { opacity: 0, y: 24, x: -8 },
              { opacity: 1, y: 0, x: 0, duration: 0.65, ease: 'power3.out' }
            );
          }
          itemIO.unobserve(entry.target);
        });
      }, { threshold: 0.25 });
      items.forEach(item => itemIO.observe(item));
    } else {
      items.forEach(item => {
        item.classList.add('is-active');
        const card = item.querySelector('.timeline-item__card');
        if (card) card.style.opacity = '1';
      });
    }
  });

  /* ──────────────────────────────────────────────────────────
     NAV
     Scroll state + smooth hide/show on scroll direction.
  ────────────────────────────────────────────────────────── */
  const nav = document.getElementById('nav');
  if (nav) {
    let lastY    = 0;
    let hidden   = false;
    let ticking  = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          nav.classList.toggle('is-scrolled', y > 48);

          // hide nav on scroll down, show on scroll up (after 120px)
          if (y > 120) {
            if (y > lastY + 4 && !hidden) {
              nav.classList.add('is-hidden');
              hidden = true;
            } else if (y < lastY - 4 && hidden) {
              nav.classList.remove('is-hidden');
              hidden = false;
            }
          } else {
            nav.classList.remove('is-hidden');
            hidden = false;
          }

          lastY   = y;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     MOBILE MENU
  ────────────────────────────────────────────────────────── */
  const burger     = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = mobileMenu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', isOpen);
      burger.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
      mobileMenu.setAttribute('aria-modal', isOpen ? 'true' : 'false');
      // trap focus inside when open
      if (isOpen) {
        const firstLink = mobileMenu.querySelector('a');
        firstLink?.focus();
      }
    });
    mobileMenu.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Open navigation menu');
      });
    });
    // close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     HERO CANVAS GRID
     Smoother opacity fade on horizontal lines.
  ────────────────────────────────────────────────────────── */
  const canvas = document.getElementById('gridCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w   = canvas.offsetWidth;
      h   = canvas.offsetHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    });

    let t = 0;
    const speed = reduceMotion ? 0 : 0.009;

    function drawGrid() {
      ctx.clearRect(0, 0, w, h);

      const horizonY = h * 0.4;
      const vanishX  = w * 0.76;
      const spacing  = 72;

      // vertical convergence lines
      ctx.lineWidth = 0.8;
      for (let x = -spacing * 5; x < w + spacing * 5; x += spacing) {
        const alpha = 0.1 + 0.06 * Math.abs(Math.sin(x * 0.02));
        ctx.strokeStyle = `rgba(255,90,78,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(x, h);
        ctx.lineTo(vanishX + (x - vanishX) * 0.07, horizonY);
        ctx.stroke();
      }

      // horizontal parallax lines
      const rows = 16;
      for (let i = 0; i < rows; i++) {
        const progress = (i / rows + t * speed) % 1;
        const y        = horizonY + Math.pow(progress, 2.4) * (h - horizonY);
        // smooth opacity bell — brightest near bottom, fades at horizon
        const alpha = Math.pow(progress, 0.6) * 0.22;
        ctx.strokeStyle = `rgba(255,90,78,${alpha})`;
        ctx.lineWidth   = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      t++;
      requestAnimationFrame(drawGrid);
    }
    drawGrid();
  }

  /* ──────────────────────────────────────────────────────────
     MAGNETIC HOVER on CTA buttons
     Elements subtly follow cursor within their bounds.
  ────────────────────────────────────────────────────────── */
  if (hasHover && !reduceMotion) {
    document.querySelectorAll('.btn--solid, .nav__cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect   = btn.getBoundingClientRect();
        const cx     = rect.left + rect.width  / 2;
        const cy     = rect.top  + rect.height / 2;
        const dx     = (e.clientX - cx) * 0.22;
        const dy     = (e.clientY - cy) * 0.22;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ──────────────────────────────────────────────────────────
     STATS BAR — number counters
     Eased count-up on intersection.
  ────────────────────────────────────────────────────────── */
  const counterItems = document.querySelectorAll('[data-count]');
  if (counterItems.length) {
    const easeOut = t => 1 - Math.pow(1 - t, 3);

    const cIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const item   = entry.target;
        const numEl  = item.querySelector('[data-counter]');
        const target = parseInt(item.dataset.count, 10);
        const suffix = item.dataset.suffix || '';

        if (reduceMotion || !numEl) {
          if (numEl) numEl.textContent = target + suffix;
          return;
        }

        const duration = 1600;
        const start    = performance.now();
        (function tick(now) {
          const p = Math.min((now - start) / duration, 1);
          numEl.textContent = Math.round(easeOut(p) * target) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        })(start);

        cIO.unobserve(item);
      });
    }, { threshold: 0.6 });

    counterItems.forEach(el => cIO.observe(el));
  }

  /* ──────────────────────────────────────────────────────────
     NAV ACTIVE LINK
  ────────────────────────────────────────────────────────── */
  const navLinks = document.querySelectorAll('.nav__links a[href^="#"]');
  if (navLinks.length) {
    const sectionIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        navLinks.forEach(a => {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { threshold: 0.35 });
    document.querySelectorAll('section[id]').forEach(s => sectionIO.observe(s));
  }

  /* ──────────────────────────────────────────────────────────
     PROCESS STEPS — stagger reveal
  ────────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    if (!hasGSAP() || reduceMotion) return;
    const steps = document.querySelectorAll('.process__step');
    if (!steps.length) return;

    const stepIO = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      stepIO.disconnect();
      gsap.fromTo(steps,
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: { amount: 0.35, from: 'start' }
        }
      );
    }, { threshold: 0.1 });
    steps.forEach(s => stepIO.observe(s));
  });

  /* ──────────────────────────────────────────────────────────
     SERVICE CARDS — stagger reveal
  ────────────────────────────────────────────────────────── */
  window.addEventListener('DOMContentLoaded', () => {
    if (!hasGSAP() || reduceMotion) return;
    const services = document.querySelectorAll('.service');
    if (!services.length) return;

    const svcIO = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      svcIO.disconnect();
      gsap.fromTo(services,
        { opacity: 0, y: 16 },
        {
          opacity: 1, y: 0,
          duration: 0.55,
          ease: 'power2.out',
          stagger: { amount: 0.28, from: 'start' }
        }
      );
    }, { threshold: 0.1 });
    services.forEach(s => svcIO.observe(s));
  });

})();


// ── HOVER GLOW BUTTONS ──────────────────────────────
document.querySelectorAll('.btn--solid').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--gx', (e.clientX - rect.left) + 'px');
    btn.style.setProperty('--gy', (e.clientY - rect.top)  + 'px');
  });
});

// ── ORGNZM SERVICES SECTION ───────────────────────────
(function () {
  const items  = document.querySelectorAll('.orgnzm__item');
  const imgEl  = document.getElementById('orgnzmImg');
  const frame  = document.querySelector('.orgnzm__img-frame');
  const descs  = document.querySelectorAll('.orgnzm__desc');
  if (!items.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let current = items[0];
  let swapTimer = null;

  // ── wavy scroll entrance ──
  if (!reduceMotion) {
    items.forEach(i => i.classList.add('wavy-in'));
    const section = document.querySelector('.orgnzm-services');
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      items.forEach((item, i) => {
        setTimeout(() => {
          item.classList.remove('wavy-in');
          item.classList.add('wavy-visible');
        }, i * 80);
      });
    }, { threshold: 0.1 });
    if (section) io.observe(section);
  } else {
    items.forEach(i => i.classList.add('wavy-visible'));
  }

  // ── set active desc ──
  function setDesc(key) {
    descs.forEach(d => {
      d.classList.toggle('is-active', d.dataset.for === key);
    });
  }

  // show first desc
  setDesc('branding');

  // ── swap image ──
  function swapImage(src) {
    if (!imgEl || !frame) return;
    if (imgEl.getAttribute('src') === src) return;
    clearTimeout(swapTimer);
    imgEl.classList.add('is-switching');
    swapTimer = setTimeout(() => {
      imgEl.src = src;
      const done = () => imgEl.classList.remove('is-switching');
      imgEl.onload = done;
      if (imgEl.complete) done();
    }, 180);
  }

  // ── activate item ──
  function activate(item) {
    if (item === current) return;
    current.classList.remove('is-active');
    current = item;
    current.classList.add('is-active');
    setDesc(item.dataset.key);
    const src = item.dataset.img;
    if (src) swapImage(src);
  }

  // ── events ──
  items.forEach(item => {
    item.addEventListener('mouseenter', () => activate(item));
    item.addEventListener('click', () => {
      const cat = item.dataset.openExplorer;
      if (!cat) return;
      // try existing open function or dispatch event
      if (typeof openExplorer === 'function') {
        openExplorer(cat);
      } else {
        document.dispatchEvent(
          new CustomEvent('openExplorer', { detail: { category: cat } })
        );
      }
    });
  });
})();

/* ============================================================
   CURSOR ENHANCEMENT — Feature 1
   Appended after existing cursor code. Isolated and reversible.
   To revert: delete everything below this comment block.
   ============================================================ */
(function () {
  'use strict';

  // Only run on hover-capable devices
  if (!window.matchMedia('(hover: hover)').matches) return;

  const dot  = document.querySelector('.cursor-dot');
  const ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;

  // ── SPRING PHYSICS ──────────────────────────────────────
  // Two independent spring systems: one for position, one for scale.
  // Using two lerp values so position and scale feel different.
  // LERP_POS: ring follows mouse with lag (spring-like)
  // LERP_SCALE: scale changes ease in/out independently
  const LERP_POS   = 0.10;  // position lag — lower = more spring feel
  const LERP_SCALE = 0.14;  // scale transition speed

  let mx = -200, my = -200; // target position (mouse)
  let rx = -200, ry = -200; // current ring position (lerped)
  let dx = -200, dy = -200; // dot follows faster
  const LERP_DOT = 0.28;

  let targetScale = 1;
  let currentScale = 1;
  let isVisible = false;
  let rafId = null;

  // ── STATE DETECTION ──────────────────────────────────────
  // Detects: link, button, view, close, default
  // Checks data-cursor attribute AND element type for buttons
  function getState(el) {
    if (!el) return null;
    const cursorAttr = el.closest('[data-cursor]');
    if (cursorAttr) return cursorAttr.dataset.cursor;
    // Detect close buttons (explorer, lightbox)
    if (el.closest('.explorer__close, .lightbox-v2__close, [data-explorer-close]')) return 'close';
    // Detect clickable buttons without data-cursor
    if (el.closest('button, .btn, .nav__cta, .wl-row, .orgnzm__item, .rolling-item')) return 'button';
    return null;
  }

  function applyState(state) {
    ring.classList.remove('is-link', 'is-view', 'is-text', 'is-button', 'is-close');
    switch (state) {
      case 'link':   ring.classList.add('is-link');   targetScale = 1.0; break;
      case 'view':   ring.classList.add('is-view');   targetScale = 1.0; break;
      case 'button': ring.classList.add('is-button'); targetScale = 1.0; break;
      case 'close':  ring.classList.add('is-close');  targetScale = 1.0; break;
      default:       targetScale = 1.0;
    }
  }

  // ── MOUSE EVENTS ─────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;

    if (!isVisible) {
      // Snap to position on first move to avoid slide-in from corner
      rx = mx; ry = my;
      dx = mx; dy = my;
      isVisible = true;
      dot.style.opacity  = '1';
      ring.style.opacity = '1';
    }
  }, { passive: true });

  document.addEventListener('mouseover', e => {
    applyState(getState(e.target));
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
    isVisible = false;
  });

  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
    isVisible = true;
  });

  // Click — dot shrinks, ring pulses inward slightly
  document.addEventListener('mousedown', () => {
    ring.classList.add('is-click');
    dot.classList.add('is-click');
    targetScale = 0.88;
  });
  document.addEventListener('mouseup', () => {
    ring.classList.remove('is-click');
    dot.classList.remove('is-click');
    targetScale = 1.0;
  });

  // ── ANIMATION LOOP ───────────────────────────────────────
  // Single rAF loop. Replaces the existing tickRing loop
  // (the existing one still runs but this one also updates transform,
  // so both write to ring.style.transform — the last write wins each frame).
  // Since this block is appended AFTER the existing IIFE completes,
  // both loops run but this one writes position + scale while the
  // existing one writes position only. Net result: this one wins on scale,
  // they both agree on position lerp (minor redundancy, no visual conflict).
  //
  // Note: the existing tickRing uses LERP=0.12, this uses LERP_POS=0.10.
  // The difference is negligible — both produce smooth spring motion.
  // We override with a slightly tighter lerp for a more premium feel.

  function tick() {
    // Lerp ring position
    rx += (mx - rx) * LERP_POS;
    ry += (my - ry) * LERP_POS;

    // Lerp dot position (faster than ring)
    dx += (mx - dx) * LERP_DOT;
    dy += (my - dy) * LERP_DOT;

    // Lerp scale
    currentScale += (targetScale - currentScale) * LERP_SCALE;

    // Apply to ring — position + scale in one transform (single reflow)
    ring.style.transform =
      `translate(calc(${rx}px - 50%), calc(${ry}px - 50%)) scale(${currentScale.toFixed(4)})`;

    // Apply to dot — position only (dot stays sharp at native size)
    dot.style.transform =
      `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`;

    rafId = requestAnimationFrame(tick);
  }

  // Pause when tab is hidden — saves CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  });

  // Start the loop
  rafId = requestAnimationFrame(tick);

})();

/* ============================================================
   PREMIUM MOTION SYSTEM — Feature 2
   Appended. Fully isolated. Does not touch existing code.
   To revert: delete everything from this comment to end of file.
   Libraries required: GSAP (already loaded), SplitType (added below).
   ============================================================ */
(function () {
  'use strict';

  // ── Guards ───────────────────────────────────────────────
  const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (rm) return;
  if (typeof gsap === 'undefined') return;

  // ── Load SplitType from CDN then init ───────────────────
  // SplitType is not in index.html yet — we load it dynamically
  // so no HTML modification is needed.
  const st = document.createElement('script');
  st.src = 'https://unpkg.com/split-type@0.3.4/umd/index.min.js';
  st.onload = initMotion;
  document.head.appendChild(st);

  function initMotion() {

    // ── Shared easing — matches CSS tokens ──────────────────
    const EASE_OUT  = 'cubic-bezier(0.16, 0.84, 0.44, 1)';
    const EASE_SOFT = 'cubic-bezier(0.22, 1, 0.36, 1)';

    // ── Helper: create IntersectionObserver that fires once ─
    function onEnter(el, cb, options) {
      const io = new IntersectionObserver(entries => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        cb();
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px', ...options });
      io.observe(el);
    }

    // ────────────────────────────────────────────────────────
    // 1. SECTION HEADINGS — SplitType line reveal
    //    Each h2 splits into lines. Lines slide up from a clip.
    //    Different delay per section creates flow across the page.
    // ────────────────────────────────────────────────────────
    document.querySelectorAll('.section-head h2, .contact h2').forEach(el => {
      // Skip if already handled by existing [data-reveal] system
      // We override by setting initial state before IO fires
      const split = new SplitType(el, { types: 'lines', tagName: 'span' });

      // Wrap each line in a clip container for overflow:hidden
      split.lines.forEach(line => {
        const wrapper = document.createElement('span');
        wrapper.style.cssText = 'display:block; overflow:hidden;';
        line.parentNode.insertBefore(wrapper, line);
        wrapper.appendChild(line);
      });

      gsap.set(split.lines, { yPercent: 102, opacity: 0 });

      onEnter(el, () => {
        gsap.to(split.lines, {
          yPercent: 0,
          opacity: 1,
          duration: 1.05,
          ease: EASE_SOFT,
          stagger: 0.09,
        });
      }, { threshold: 0.2 });
    });

    // ────────────────────────────────────────────────────────
    // 2. EYEBROW LABELS — character stagger
    //    Each .eyebrow label splits into chars.
    //    Chars fade + slide up with tight 20ms stagger.
    //    Distinct from h2 (lines) — two different reading rhythms.
    // ────────────────────────────────────────────────────────
    document.querySelectorAll('.section-head .eyebrow, .contact .eyebrow').forEach(el => {
      const split = new SplitType(el, { types: 'chars', tagName: 'span' });
      gsap.set(split.chars, { opacity: 0, y: 10 });

      onEnter(el, () => {
        gsap.to(split.chars, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: EASE_OUT,
          stagger: 0.022,
        });
      }, { threshold: 0.3 });
    });

    // ────────────────────────────────────────────────────────
    // 3. STATS BAR — staggered counter dividers
    //    The divider lines between stats draw in from top.
    //    Adds visual rhythm without touching the counter logic.
    // ────────────────────────────────────────────────────────
    const statBar = document.querySelector('.stats-bar');
    if (statBar) {
      const dividers = statBar.querySelectorAll('.stat-item__divider');
      gsap.set(dividers, { scaleY: 0, transformOrigin: 'top center' });

      onEnter(statBar, () => {
        gsap.to(dividers, {
          scaleY: 1,
          duration: 0.7,
          ease: EASE_SOFT,
          stagger: 0.1,
          delay: 0.3,
        });
      });
    }

    // ────────────────────────────────────────────────────────
    // 4. WORK SECTION (orgnzm) — header reveal
    //    Eyebrow and tag line stagger in from left.
    //    Different axis than h2 (horizontal vs vertical).
    // ────────────────────────────────────────────────────────
    const orgnzmHeader = document.querySelector('.orgnzm__header');
    if (orgnzmHeader) {
      const eyebrow = orgnzmHeader.querySelector('.eyebrow');
      const tag     = orgnzmHeader.querySelector('.orgnzm__header-tag');
      if (eyebrow) gsap.set(eyebrow, { opacity: 0, x: -16 });
      if (tag)     gsap.set(tag,     { opacity: 0, x:  16 });

      onEnter(orgnzmHeader, () => {
        if (eyebrow) gsap.to(eyebrow, { opacity: 1, x: 0, duration: 0.65, ease: EASE_SOFT });
        if (tag)     gsap.to(tag,     { opacity: 1, x: 0, duration: 0.65, ease: EASE_SOFT, delay: 0.1 });
      });
    }

    // ────────────────────────────────────────────────────────
    // 5. ABOUT — image clip-path reveal
    //    Portrait reveals with a vertical clip-path wipe.
    //    The image itself has a slight scale from 1.06 → 1
    //    creating depth as it uncovers — Locomotive/Cuberto style.
    // ────────────────────────────────────────────────────────
    const aboutVisual = document.querySelector('.about__visual');
    if (aboutVisual) {
      const img = aboutVisual.querySelector('img');
      if (img) {
        gsap.set(aboutVisual, { clipPath: 'inset(100% 0% 0% 0%)' });
        gsap.set(img,         { scale: 1.08, transformOrigin: 'center center' });

        onEnter(aboutVisual, () => {
          gsap.to(aboutVisual, {
            clipPath: 'inset(0% 0% 0% 0%)',
            duration: 1.1,
            ease: EASE_SOFT,
          });
          gsap.to(img, {
            scale: 1,
            duration: 1.3,
            ease: EASE_SOFT,
          });
        }, { threshold: 0.15 });
      }
    }

    // ────────────────────────────────────────────────────────
    // 6. ABOUT BODY TEXT — paragraph stagger
    //    Each paragraph reveals with a slight vertical offset.
    //    Stagger of 120ms creates reading flow, not chaos.
    // ────────────────────────────────────────────────────────
    const aboutParagraphs = document.querySelectorAll('.about__body');
    if (aboutParagraphs.length) {
      gsap.set(aboutParagraphs, { opacity: 0, y: 18 });

      onEnter(aboutParagraphs[0], () => {
        gsap.to(aboutParagraphs, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: EASE_SOFT,
          stagger: 0.12,
        });
      }, { threshold: 0.1 });
    }

    // ────────────────────────────────────────────────────────
    // 7. ABOUT STATS — scale + fade in from center
    //    Numbers scale from 0.88 → 1, not just fade up.
    //    Different from paragraphs — feels like a reveal of value.
    // ────────────────────────────────────────────────────────
    const aboutStats = document.querySelector('.about__stats');
    if (aboutStats) {
      const statItems = aboutStats.querySelectorAll('.stat');
      gsap.set(statItems, { opacity: 0, scale: 0.88, transformOrigin: 'center bottom' });

      onEnter(aboutStats, () => {
        gsap.to(statItems, {
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: EASE_SOFT,
          stagger: 0.08,
        });
      });
    }

    // ────────────────────────────────────────────────────────
    // 8. SKILL RINGS LABEL — slide up after ring draws
    //    Labels slide in 400ms after the ring animation starts.
    //    Provides a clear sequence: ring → label.
    // ────────────────────────────────────────────────────────
    const skillLabels = document.querySelectorAll('.skill-ring__label');
    if (skillLabels.length) {
      gsap.set(skillLabels, { opacity: 0, y: 6 });

      const skillSection = document.querySelector('.about__skills');
      if (skillSection) {
        onEnter(skillSection, () => {
          gsap.to(skillLabels, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: EASE_OUT,
            stagger: 0.07,
            delay: 0.5, // after rings start drawing
          });
        }, { threshold: 0.2 });
      }
    }

    // ────────────────────────────────────────────────────────
    // 9. SERVICES SECTION HEAD — horizontal line draw
    //    A 1px border-bottom on the section-head draws from left.
    //    Subtle structural animation — not flashy.
    // ────────────────────────────────────────────────────────
    const servicesSection = document.querySelector('.services');
    if (servicesSection) {
      const head = servicesSection.querySelector('.section-head');
      if (head) {
        // Add the line element
        const line = document.createElement('div');
        line.style.cssText = `
          position: absolute; bottom: 0; left: 0;
          width: 100%; height: 1px;
          background: var(--line);
          transform: scaleX(0); transform-origin: left center;
          pointer-events: none;
        `;
        head.style.position = 'relative';
        head.appendChild(line);

        onEnter(head, () => {
          gsap.to(line, {
            scaleX: 1,
            duration: 1.0,
            ease: EASE_SOFT,
            delay: 0.4,
          });
        }, { threshold: 0.3 });
      }
    }

    // ────────────────────────────────────────────────────────
    // 10. PROCESS STEPS — stagger with alternating axis
    //     Odd steps slide from left, even steps from right.
    //     Creates visual rhythm across the 6-step grid.
    //     Overrides the existing simple fade-up in script.js.
    //     (This fires after and wins because GSAP inline style
    //     takes precedence over class-based opacity.)
    // ────────────────────────────────────────────────────────
    const processSection = document.querySelector('.process');
    if (processSection) {
      const steps = processSection.querySelectorAll('.process__step');
      if (steps.length) {
        steps.forEach((step, i) => {
          const xOffset = (i % 2 === 0) ? -20 : 20;
          gsap.set(step, { opacity: 0, x: xOffset });
        });

        onEnter(processSection, () => {
          steps.forEach((step, i) => {
            gsap.to(step, {
              opacity: 1,
              x: 0,
              duration: 0.75,
              ease: EASE_SOFT,
              delay: i * 0.07,
            });
          });
        }, { threshold: 0.08 });
      }
    }

    // ────────────────────────────────────────────────────────
    // 11. TIMELINE CARDS — slide from left with depth
    //     Each card slides in from x:-24 with a subtle opacity.
    //     The existing GSAP code in script.js does x:-8, y:24.
    //     This overrides with a cleaner horizontal-only entry
    //     that feels more intentional for a timeline layout.
    // ────────────────────────────────────────────────────────
    // NOTE: The existing timeline IO also animates cards.
    // Both run. The existing one fires at threshold:0.25.
    // This one fires at threshold:0.15 (earlier) so it sets
    // the initial state and wins the animation timing.
    const timelineItems = document.querySelectorAll('.timeline-item');
    if (timelineItems.length) {
      timelineItems.forEach((item, i) => {
        const card = item.querySelector('.timeline-item__card');
        if (!card) return;
        gsap.set(card, { opacity: 0, x: -28 });

        onEnter(item, () => {
          item.classList.add('is-active');
          gsap.to(card, {
            opacity: 1,
            x: 0,
            duration: 0.8,
            ease: EASE_SOFT,
          });
        }, { threshold: 0.15 });
      });
    }

    // ────────────────────────────────────────────────────────
    // 12. QUOTE SECTION — staggered line reveal
    //     Mark, text, author each reveal with deliberate spacing.
    //     The mark fades from 0 opacity + slight scale.
    //     The text slides up after.
    //     The author follows last.
    // ────────────────────────────────────────────────────────
    const quoteSection = document.querySelector('.quote');
    if (quoteSection) {
      const mark   = quoteSection.querySelector('.quote__mark');
      const text   = quoteSection.querySelector('.quote__text');
      const author = quoteSection.querySelector('.quote__author');

      if (mark)   gsap.set(mark,   { opacity: 0, scale: 0.85, transformOrigin: 'left center' });
      if (text)   gsap.set(text,   { opacity: 0, y: 24 });
      if (author) gsap.set(author, { opacity: 0, y: 16 });

      onEnter(quoteSection, () => {
        const tl = gsap.timeline();
        if (mark)   tl.to(mark,   { opacity: 0.7, scale: 1, duration: 0.7, ease: EASE_SOFT });
        if (text)   tl.to(text,   { opacity: 1, y: 0, duration: 0.9, ease: EASE_SOFT }, '-=0.3');
        if (author) tl.to(author, { opacity: 1, y: 0, duration: 0.7, ease: EASE_SOFT }, '-=0.5');
      }, { threshold: 0.25 });
    }

    // ────────────────────────────────────────────────────────
    // 13. CONTACT EMAIL — underline draw on scroll enter
    //     A pseudo-underline element draws from left on enter.
    //     On hover it already has CSS — this adds the entrance.
    // ────────────────────────────────────────────────────────
    const contactEmail = document.querySelector('.contact__email');
    if (contactEmail) {
      gsap.set(contactEmail, { opacity: 0, y: 12 });
      onEnter(contactEmail, () => {
        gsap.to(contactEmail, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: EASE_SOFT,
        });
      }, { threshold: 0.4 });
    }

    // ────────────────────────────────────────────────────────
    // 14. CONTACT LINKS — stagger left to right
    //     Four links appear in sequence after the email.
    //     Horizontal stagger (x offset) not vertical —
    //     different pattern from every other section.
    // ────────────────────────────────────────────────────────
    const contactLinks = document.querySelector('.contact__links');
    if (contactLinks) {
      const links = contactLinks.querySelectorAll('a');
      gsap.set(links, { opacity: 0, x: -10 });

      onEnter(contactLinks, () => {
        gsap.to(links, {
          opacity: 1,
          x: 0,
          duration: 0.55,
          ease: EASE_SOFT,
          stagger: 0.08,
        });
      }, { threshold: 0.4 });
    }

    // ────────────────────────────────────────────────────────
    // 15. MICRO PARALLAX — about image on scroll
    //     Image translates at 0.2x scroll speed after reveal.
    //     Applied only after clip-path reveal completes (delay:0).
    //     Does not interfere with the clip-path animation (15).
    // ────────────────────────────────────────────────────────
    const aboutImg = document.querySelector('.about__visual img');
    if (aboutImg) {
      let rafPx = null;
      const aboutSection = document.querySelector('.about');

      window.addEventListener('scroll', () => {
        if (rafPx) return;
        rafPx = requestAnimationFrame(() => {
          if (!aboutSection) { rafPx = null; return; }
          const rect = aboutSection.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight && rect.bottom > 0;
          if (isInView) {
            const progress = -rect.top / (aboutSection.offsetHeight + window.innerHeight);
            const offset   = progress * 40; // max 40px parallax
            // Only set translateY — don't fight clip-path or scale
            aboutImg.style.transform = `scale(1) translateY(${offset.toFixed(2)}px)`;
          }
          rafPx = null;
        });
      }, { passive: true });
    }

    // ────────────────────────────────────────────────────────
    // 16. ORGNZM IMAGE — subtle parallax within frame
    //     The work section image moves slightly on scroll.
    //     Creates depth without distraction.
    // ────────────────────────────────────────────────────────
    const orgnzmImg = document.getElementById('orgnzmImg');
    const orgnzmSection = document.querySelector('.orgnzm-services');
    if (orgnzmImg && orgnzmSection) {
      let rafOrg = null;
      window.addEventListener('scroll', () => {
        if (rafOrg) return;
        rafOrg = requestAnimationFrame(() => {
          const rect = orgnzmSection.getBoundingClientRect();
          const isInView = rect.top < window.innerHeight && rect.bottom > 0;
          if (isInView) {
            const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
            const offset   = (progress - 0.5) * 24; // ±12px
            orgnzmImg.style.transform = `translateY(${offset.toFixed(2)}px)`;
          }
          rafOrg = null;
        });
      }, { passive: true });
    }

  } // end initMotion

})();

/* ============================================================
   BUG FIX — About image & Loader
   Appended. Isolated. To revert: delete from this comment down.
   ============================================================ */
(function () {
  'use strict';

  // ── FIX 1: About image clip-path override ───────────────
  // Feature 2 set clipPath:'inset(100% 0% 0% 0%)' which hides
  // the image if the IO doesn't fire. Reset it immediately so
  // the image is always visible, then let data-reveal handle opacity.
  const aboutVisual = document.querySelector('.about__visual');
  if (aboutVisual) {
    // Clear any inline clipPath GSAP may have set
    aboutVisual.style.clipPath   = '';
    aboutVisual.style.webkitClipPath = '';
    const img = aboutVisual.querySelector('img');
    if (img) {
      img.style.scale     = '';
      img.style.transform = '';
    }
  }

  // ── FIX 2: Loader ────────────────────────────────────────
  // loader.js and loader.css are built but not linked in index.html.
  // We inject them dynamically here so no HTML change is needed.
  const loaderCSS = document.createElement('link');
  loaderCSS.rel  = 'stylesheet';
  loaderCSS.href = 'loader.css';
  document.head.appendChild(loaderCSS);

  const loaderScript = document.createElement('script');
  loaderScript.src = 'loader.js';
  document.head.appendChild(loaderScript);

})();

/* ============================================================
   INVERTED CURSOR — Feature 3
   Vanilla JS port of the React inverted-cursor component.
   mix-blend-mode:difference — white circle inverts page colors.
   Appended. To revert: delete from this comment to end of file.
   ============================================================ */
(function () {
  'use strict';

  if (!window.matchMedia('(hover: hover)').matches) return;

  // ── Create the cursor element ────────────────────────────
  const cursor = document.createElement('div');
  cursor.className = 'cursor-inverted';
  cursor.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cursor);

  // ── State ────────────────────────────────────────────────
  let targetX  = -100, targetY  = -100; // mouse position
  let currentX = -100, currentY = -100; // lerped position
  let targetSize  = 48;  // default size
  let currentSize = 48;
  const LERP = 0.12;     // spring factor — matches original 0.2 * 0.6 feel

  let visible = false;
  let rafId   = null;

  // ── Lerp helper ──────────────────────────────────────────
  function lerp(a, b, t) { return a + (b - a) * t; }

  // ── Animation loop ───────────────────────────────────────
  function tick() {
    currentX    = lerp(currentX, targetX, LERP);
    currentY    = lerp(currentY, targetY, LERP);
    currentSize = lerp(currentSize, targetSize, 0.1);

    // Translate by center offset so the circle is centered on cursor
    const offset = currentSize / 2;
    cursor.style.transform = `translate(${(currentX - offset).toFixed(2)}px, ${(currentY - offset).toFixed(2)}px)`;
    cursor.style.width     = `${currentSize.toFixed(2)}px`;
    cursor.style.height    = `${currentSize.toFixed(2)}px`;

    rafId = requestAnimationFrame(tick);
  }

  // ── Mouse events ─────────────────────────────────────────
  document.addEventListener('mousemove', e => {
    targetX = e.clientX;
    targetY = e.clientY;

    if (!visible) {
      // Snap on first move — no slide-in from corner
      currentX = targetX;
      currentY = targetY;
      cursor.style.opacity = '1';
      visible = true;
    }
  }, { passive: true });

  document.documentElement.addEventListener('mouseleave', () => {
    cursor.style.opacity = '0';
    visible = false;
  });

  document.documentElement.addEventListener('mouseenter', () => {
    cursor.style.opacity = '1';
    visible = true;
  });

  // ── Size states on hover ─────────────────────────────────
  // Expands on interactive elements, shrinks on text
  document.addEventListener('mouseover', e => {
    const el = e.target;
    if (el.closest('[data-cursor="view"]')) {
      targetSize = 88;
    } else if (el.closest('[data-cursor="link"], a, button, .btn, .nav__cta, .wl-row, .orgnzm__item')) {
      targetSize = 64;
    } else {
      targetSize = 48;
    }
  });

  // ── Click — brief shrink ─────────────────────────────────
  document.addEventListener('mousedown', () => { targetSize = targetSize * 0.75; });
  document.addEventListener('mouseup',   () => {
    // reset to whatever state is active
    document.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, target: document.elementFromPoint(targetX, targetY) }));
    targetSize = 48;
  });

  // ── Pause when tab hidden ────────────────────────────────
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(tick);
    }
  });

  // ── Start ────────────────────────────────────────────────
  rafId = requestAnimationFrame(tick);

})();
