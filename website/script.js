/* ═══════════════════════════
   SCRIPT.JS — The 10x Brand
═══════════════════════════ */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     3D CANVAS PARTICLE SYSTEM — Interactive
     ─ Phases: Scatter → 10X letterform → 3D Orb → Explode
     ─ Mouse/touch repels nearby particles (radius 140px)
     ─ Depth-sorted per frame — closer particles paint on top
     ─ Glow halos + depth-based size & brightness
     ─ 14s cycle, loops infinitely
  ═══════════════════════════════════════════════════ */

  // ── Canvas setup ──────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'orbCanvas';
  Object.assign(canvas.style, {
    position: 'fixed', top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none', zIndex: '0',
  });
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Mouse / touch tracking ────────────────────────────
  const mouse = { x: -9999, y: -9999, active: false };
  const setMouse = (x, y) => { mouse.x = x; mouse.y = y; mouse.active = true; };
  window.addEventListener('mousemove',  e => setMouse(e.clientX, e.clientY));
  window.addEventListener('mouseleave', () => { mouse.active = false; });
  window.addEventListener('touchmove',  e => setMouse(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  window.addEventListener('touchend',   () => { mouse.active = false; });

  // ── Helpers ───────────────────────────────────────────
  const lerp   = (a, b, t) => a + (b - a) * t;
  const clamp  = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeIO = t => t < 0.5 ? 4*t*t*t : 1 - (-2*t+2)**3/2;
  const easeO  = t => 1 - (1-t)*(1-t)*(1-t);

  // ── 10X dot-matrix glyphs (5 cols × 7 rows) ──────────
  const GLYPHS = {
    '1': [[0,1,0,0,0],[1,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[1,1,1,0,0]],
    '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[1,0,0,0,1],[0,1,1,1,0]],
    'X': [[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[1,0,0,0,1]],
  };

  function buildLetterPoints(sc) {
    const pts = []; const gap = 6; let off = 0;
    ['1', '0', 'X'].forEach(ch => {
      GLYPHS[ch].forEach((row, r) => row.forEach((on, c) => {
        if (on) pts.push({ x: (off + c) * sc, y: r * sc });
      }));
      off += GLYPHS[ch][0].length + gap;
    });
    const W = (off - gap) * sc, H = 7 * sc;
    return pts.map(p => ({ x: p.x - W / 2, y: p.y - H / 2 }));
  }

  // ── Zigzag Level-Up Arrow (13 cols × 15 rows) ────────
  // Read bottom→top: base → zig-right → zag-left → zig-right → arrowhead ↑
  // Mirrors a rising market chart — signals upward momentum & levelling up.
  function buildArrowPoints(sc) {
    const GRID = [
      [0,0,0,0,0,0,1,0,0,0,0,0,0],  // row  0 — arrowhead tip
      [0,0,0,0,0,1,1,1,0,0,0,0,0],  // row  1
      [0,0,0,0,1,1,1,1,1,0,0,0,0],  // row  2
      [0,0,0,1,1,1,1,1,1,1,0,0,0],  // row  3 — arrowhead base
      [0,0,0,0,0,0,1,0,0,0,0,0,0],  // row  4 — shaft
      [0,0,0,0,0,0,1,0,0,0,0,0,0],  // row  5
      [0,0,0,0,0,0,1,1,1,1,1,1,0],  // row  6 — zig right
      [0,0,0,0,0,0,0,0,0,0,0,1,0],  // row  7
      [0,0,0,0,0,0,0,0,0,0,0,1,0],  // row  8
      [0,1,1,1,1,1,1,1,1,1,1,1,0],  // row  9 — zag left (long step)
      [0,1,0,0,0,0,0,0,0,0,0,0,0],  // row 10
      [0,1,0,0,0,0,0,0,0,0,0,0,0],  // row 11
      [0,1,1,1,1,1,1,1,0,0,0,0,0],  // row 12 — zig right (shorter)
      [0,0,0,0,0,0,0,1,0,0,0,0,0],  // row 13
      [0,0,0,0,0,0,0,1,0,0,0,0,0],  // row 14 — base
    ];
    const pts = [];
    const cols = GRID[0].length;
    const rows = GRID.length;
    GRID.forEach((row, r) => row.forEach((on, c) => {
      if (on) pts.push({ x: c * sc, y: r * sc });
    }));
    const W = (cols - 1) * sc;
    const H = (rows - 1) * sc;
    return pts.map(p => ({ x: p.x - W / 2, y: p.y - H / 2 }));
  }

  // ── Seeded PRNG (deterministic layout every reload) ───
  function mkRand(seed) {
    let s = seed;
    return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
  }
  const rand = mkRand(42);

  // ── Scene constants ───────────────────────────────────
  const isMobile = window.innerWidth < 768;
  const TOTAL    = isMobile ? 150 : 300;
  const SC       = 24;     // letter dot spacing (px)
  const AS       = 22;     // arrow dot spacing (px)
  const FOV      = 650;    // perspective focal length (for scatter depth cue)
  const REPEL_R  = 140;    // mouse repulsion radius (screen px)
  const REPEL_F  = 90;     // max repulsion push (screen px)
  const CYCLE    = 14;     // animation cycle (seconds)

  const letterPts = buildLetterPoints(SC);
  const arrowPts  = buildArrowPoints(AS);

  // ── Build particles ───────────────────────────────────
  const particles = Array.from({ length: TOTAL }, (_, i) => {
    const lp = letterPts[i % letterPts.length];
    const ap = arrowPts[i % arrowPts.length];
    return {
      sx:   (rand() - 0.5) * 1800,   // scattered start x
      sy:   (rand() - 0.5) * 1800,   // scattered start y
      sz:   (rand() - 0.5) * 700,    // scattered start z (depth cue)
      lx:   lp.x, ly: lp.y,          // 10X letter target
      ax:   ap.x, ay: ap.y,           // zigzag arrow target
      hue:  40 / TOTAL * (i + 1),    // color (red→orange→yellow)
      size: 1.8 + rand() * 2.4,      // dot base radius
    };
  });

  // ── Phase timeline (seconds within each 14s cycle) ────
  //  0.0 → 2.5  : fade in from scatter
  //  1.5 → 4.5  : fly to 10X positions
  //  4.5 → 6.5  : hold 10X — mouse interactive
  //  6.5 → 8.5  : morph into zigzag arrow ↑
  //  8.5 → 12.5 : arrow holds — mouse interactive
  // 12.5 → 14.0 : explode + fade out
  const PH = {
    fadeIn:    [0,    2.5],
    toLet:     [1.5,  4.5],
    holdLet:   [4.5,  6.5],
    toArrow:   [6.5,  8.5],
    holdArrow: [8.5,  12.5],
    explode:   [12.5, 14.0],
    fadeOut:   [12.5, 14.0],
  };

  function pFrac(t, ph) {
    const [s, e] = PH[ph];
    return clamp((t - s) / (e - s), 0, 1);
  }

  // ── Depth projection (scatter z-cue; flat for letter/arrow) ─────────
  function project(x, y, z) {
    const depth = z + FOV;
    if (depth <= 10) return null;
    const s = FOV / depth;
    return { sx: x * s, sy: y * s, s };
  }

  // ── Animation loop ────────────────────────────────────
  let startTime = null, paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) requestAnimationFrame(tick);  // resume — don't reset startTime
  });

  function tick(now) {
    if (paused) return;
    if (!startTime) startTime = now;
    // totalElapsed is never reset — animation plays once and freezes
    const totalElapsed = (now - startTime) / 1000;
    // Freeze at the start of holdArrow once arrow is fully formed (no looping)
    const elapsed = Math.min(totalElapsed, PH.holdArrow[0]);
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    // Phase fractions
    const fFadeIn    = easeIO(pFrac(elapsed, 'fadeIn'));
    const fToLet     = easeIO(pFrac(elapsed, 'toLet'));
    const fToArrow   = easeIO(pFrac(elapsed, 'toArrow'));
    const fHoldArrow = pFrac(elapsed, 'holdArrow');
    const fExplode   = easeO(pFrac(elapsed, 'explode'));
    const fFadeOut   = easeIO(pFrac(elapsed, 'fadeOut'));

    // Cursor repulsion glow
    if (mouse.active) {
      const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, REPEL_R * 0.85);
      g.addColorStop(0,   'rgba(184,255,60,0.10)');
      g.addColorStop(0.45,'rgba(184,255,60,0.04)');
      g.addColorStop(1,   'transparent');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // Draw particles
    for (const p of particles) {
      // Compute position per phase (all 2D — z only used during scatter)
      let px, py, pz;
      if (elapsed < PH.toLet[0]) {
        // Scatter
        px = p.sx;  py = p.sy;  pz = p.sz;
      } else if (elapsed < PH.toLet[1]) {
        // Fly to 10X
        px = lerp(p.sx, p.lx, fToLet);
        py = lerp(p.sy, p.ly, fToLet);
        pz = lerp(p.sz, 0,    fToLet);
      } else if (elapsed < PH.holdLet[1]) {
        // Hold 10X
        px = p.lx;  py = p.ly;  pz = 0;
      } else if (elapsed < PH.toArrow[1]) {
        // Morph to zigzag arrow
        px = lerp(p.lx, p.ax, fToArrow);
        py = lerp(p.ly, p.ay, fToArrow);
        pz = 0;
      } else if (elapsed < PH.holdArrow[1]) {
        // Hold arrow — subtle breathing drift keeps it alive
        const wave = now * 0.0008;
        px = p.ax + Math.sin(wave + p.hue * 0.5) * 2.5;
        py = p.ay + Math.cos(wave + p.hue * 0.4) * 2.0;
        pz = 0;
      } else {
        // Explode outward from arrow positions
        const ex = 1 + fExplode * 4.5;
        px = p.ax * ex;  py = p.ay * ex;  pz = 0;
      }

      // Project to screen space
      const proj = project(px, py, pz);
      if (!proj) continue;

      let sx = proj.sx + cx;
      let sy = proj.sy + cy;

      // Mouse / touch repulsion (cubic falloff for smooth edge)
      if (mouse.active) {
        const dx = sx - mouse.x, dy = sy - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_R * REPEL_R && d2 > 1) {
          const d     = Math.sqrt(d2);
          const t     = 1 - d / REPEL_R;
          const force = t * t * t * REPEL_F;   // cubic: gentle at edge, strong at center
          sx += (dx / d) * force;
          sy += (dy / d) * force;
        }
      }

      // Opacity
      let alpha = fFadeIn;
      if (fFadeOut > 0) alpha = lerp(fFadeIn, 0, fFadeOut);
      if (alpha < 0.01) continue;

      // Depth cues
      const ds   = clamp(proj.s, 0.3, 2.2);
      const dotR = p.size * ds * 1.35;
      const bright = 50 + ds * 18;
      const a    = alpha * (0.60 + ds * 0.40);

      // Glow halo (desktop only for performance)
      if (!isMobile && ds > 0.5 && a > 0.15) {
        const hr = dotR * 5;
        const g2 = ctx.createRadialGradient(sx, sy, dotR * 0.6, sx, sy, hr);
        g2.addColorStop(0, `hsla(${p.hue},100%,72%,${a * 0.20})`);
        g2.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(sx, sy, hr, 0, Math.PI * 2);
        ctx.fillStyle = g2;
        ctx.fill();
      }

      // Solid dot
      ctx.beginPath();
      ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${p.hue},100%,${bright}%,${a})`;
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);



  /* ─── NAVBAR ─── */
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateActiveLink();
  }, { passive: true });

  // Active link tracking
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  // Mobile toggle
  const navToggle = document.getElementById('navToggle');
  const navLinksEl = document.getElementById('navLinks');
  navToggle.addEventListener('click', () => {
    const isOpen = navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('open');
    // Lock body scroll while menu is open (prevents navbar drift on iOS)
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinksEl.classList.remove('open');
      navToggle.classList.remove('open');
      document.body.style.overflow = '';
    });
  });


  /* ─── SCROLL REVEAL ─── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger sibling cards
        const parent = entry.target.closest('.services-grid, .portfolio-grid, .about-pillars');
        if (parent) {
          const siblings = [...parent.querySelectorAll('.reveal')];
          const idx      = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = idx * 80 + 'ms';
        }
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

  // Observe all reveal elements EXCEPT those inside the hero
  // (hero content is revealed by the intro sequence timer instead)
  document.querySelectorAll('.reveal').forEach(el => {
    if (!el.closest('#home')) revealObserver.observe(el);
  });

  // ── HERO INTRO TRIGGER ──────────────────────────────
  // Fire after the arrow is fully formed and settled (~9s).
  // Adds .hero-loaded → CSS staggered content reveal + bg fade-in.
  const heroEl = document.getElementById('home');
  if (heroEl) {
    setTimeout(() => heroEl.classList.add('hero-loaded'), 9000);
  }


  /* ─── PORTFOLIO FAN-OUT (mobile tap) ─── */
  const spreads = document.querySelectorAll('.portfolio-spread');
  spreads.forEach(spread => {
    spread.addEventListener('click', (e) => {
      // Only trigger tap behavior on touch devices (narrow viewports)
      if (window.innerWidth > 768) return;
      e.stopPropagation();
      const wasOpen = spread.classList.contains('tapped');
      // Close all others first
      spreads.forEach(s => s.classList.remove('tapped'));
      // Toggle this one
      if (!wasOpen) spread.classList.add('tapped');
    });
  });
  // Close on tap outside
  document.addEventListener('click', () => {
    spreads.forEach(s => s.classList.remove('tapped'));
  });

  /* ─── TESTIMONIALS CAROUSEL ─── */
  const track  = document.getElementById('testimonialsTrack');
  const dots   = document.querySelectorAll('.dot');
  let   current = 0;
  let   isDragging = false, startX = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, dots.length - 1));
    const cardW = track.firstElementChild.offsetWidth + 24; // card + gap
    track.style.transform = `translateX(-${current * cardW}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => goTo(+dot.dataset.index));
  });

  // Auto-advance
  let autoTimer = setInterval(() => goTo((current + 1) % dots.length), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => {
    autoTimer = setInterval(() => goTo((current + 1) % dots.length), 5000);
  });

  // Touch/drag
  track.addEventListener('pointerdown', e => {
    isDragging = true; startX = e.clientX;
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener('pointermove', e => {
    if (!isDragging) return;
  });
  track.addEventListener('pointerup', e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = startX - e.clientX;
    if (Math.abs(diff) > 50) goTo(diff > 0 ? current + 1 : current - 1);
  });


  /* ─── FORM SUBMISSION — Opens Gmail compose with prefilled fields ─── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const btn  = form.querySelector('[type="submit"]');
      const orig = btn.textContent;

      const name  = form.name.value.trim();
      const email = form.email.value.trim();
      const brand = form.brand.value.trim();
      const goal  = form.goal.value.trim();

      // Build the Gmail compose URL
      const to      = 'hello@the10xbrand.com';
      const subject = encodeURIComponent(
        `10x Inquiry${brand ? ' — ' + brand : ''}`
      );
      const body    = encodeURIComponent(
        `Hi, my name is ${name || '(not provided)'}.\n` +
        (brand  ? `Brand / Company: ${brand}\n`          : '') +
        (email  ? `Reply-to: ${email}\n`                 : '') +
        `\n` +
        `Goal:\n${goal || '(no details provided)'}\n\n` +
        `---\nSent via The 10x Brand website`
      );

      const gmailURL = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

      // Visual feedback before opening Gmail
      btn.textContent      = 'Opening Gmail…';
      btn.disabled         = true;
      btn.style.opacity    = '0.7';

      setTimeout(() => {
        window.open(gmailURL, '_blank', 'noopener');
        btn.textContent      = '✓ Gmail Opened!';
        btn.style.background = '#B8FF3C';
        btn.style.color      = '#0A0A0A';
        btn.style.opacity    = '1';
        form.reset();

        setTimeout(() => {
          btn.textContent      = orig;
          btn.style.background = '';
          btn.style.color      = '';
          btn.disabled         = false;
        }, 3500);
      }, 400);
    });
  }


  /* ─── SMOOTH SCROLL for anchor links ─── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });


  /* ─── CTA BUTTON RIPPLE ─── */
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple  = document.createElement('span');
      const rect    = this.getBoundingClientRect();
      const size    = Math.max(rect.width, rect.height) * 2;

      ripple.style.cssText = `
        position:absolute;
        width:${size}px;height:${size}px;
        left:${e.clientX - rect.left - size/2}px;
        top:${e.clientY - rect.top - size/2}px;
        background:rgba(255,255,255,.15);
        border-radius:50%;
        transform:scale(0);
        animation:ripple .6s linear;
        pointer-events:none;
      `;
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // Ripple keyframe (injected once)
  const style  = document.createElement('style');
  style.textContent = `@keyframes ripple { to { transform: scale(1); opacity: 0; } }`;
  document.head.appendChild(style);

})();
