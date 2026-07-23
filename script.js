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
