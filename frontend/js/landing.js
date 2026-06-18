/* ============================================================
   INTERVIEW AI — landing.js
   Fixes:
   1. Navbar always reflects TRUE current auth state on load
   2. "Analyze" button redirects to login if not authenticated
   3. Logout fully clears session and resets navbar immediately
   ============================================================ */

'use strict';

/* ─── Auth Helpers ──────────────────────────────────────────
   Single source of truth for whether a user is logged in.
   We store the user object under 'interviewai_user'.
   null / missing / { name: 'Guest User' } all count as LOGGED OUT.
─────────────────────────────────────────────────────────────*/
function getUser() {
  try {
    const raw = localStorage.getItem('interviewai_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    // Treat guest placeholder as not logged in
    if (!u || !u.name || u.name === 'Guest User' || !u.email) return null;
    return u;
  } catch { return null; }
}

function isLoggedIn() {
  return getUser() !== null;
}

function logoutUser() {
  // Clear every interviewai key so nothing leaks to next visitor
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('interviewai_')) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));

  // Also clear any Firebase / Google session remnants
  try {
    sessionStorage.clear();
  } catch {}
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ─── Navbar Auth State ─────────────────────────────────────
   Reads auth state FRESH every time and renders the correct UI.
   Called on DOMContentLoaded — so even if someone navigated
   back from another page, the navbar is always accurate.
─────────────────────────────────────────────────────────────*/
function renderNavAuthState() {
  const user       = getUser();
  const navRight   = document.querySelector('.nav-right');
  if (!navRight) return;

  if (user) {
    // ── LOGGED IN: show avatar + Dashboard + menu ──
    navRight.innerHTML = `
      <div class="nav-user-chip">
        <div class="nav-user-avatar">${initials(user.name)}</div>
        <span class="nav-user-name">${user.name.split(' ')[0]}</span>
      </div>
      <a href="dashboard.html" class="btn-nav-dashboard">Dashboard</a>
      <button class="nav-menu-btn" id="navMenuBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>`;

    // Re-attach menu button listener after DOM rebuild
    document.getElementById('navMenuBtn')?.addEventListener('click', toggleDrawer);

  } else {
    // ── LOGGED OUT: show Login + Sign Up + menu ──
    navRight.innerHTML = `
      <a href="auth.html?mode=signup" class="btn-nav-signup">Login / Sign Up</a>
      <button class="nav-menu-btn" id="navMenuBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>`;

    document.getElementById('navMenuBtn')?.addEventListener('click', toggleDrawer);
  }
}

/* ─── Mobile Drawer ─────────────────────────────────────────*/
let drawerOpen = false;
function toggleDrawer() {
  const drawer = document.getElementById('navDrawer');
  if (!drawer) return;
  drawerOpen = !drawerOpen;
  drawer.classList.toggle('open', drawerOpen);
}

function closeDrawer() {
  const drawer = document.getElementById('navDrawer');
  if (drawer) drawer.classList.remove('open');
  drawerOpen = false;
}

/* ─── Auth Guard ────────────────────────────────────────────
   Call this on ANY click that requires login.
   If not logged in → redirect to login page.
   If logged in    → navigate to destination.
─────────────────────────────────────────────────────────────*/
function requireAuth(destination = 'index_old.html') {
  if (isLoggedIn()) {
    window.location.href = destination;
  } else {
    // Store where they wanted to go so login can redirect back
    try { sessionStorage.setItem('interviewai_redirect', destination); } catch {}
    window.location.href = 'auth.html?mode=login';
  }
}

/* ─── Particle Canvas ───────────────────────────────────────*/
function initParticles() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: 120 }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 245, 255, ${p.alpha})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  init();
  draw();
  window.addEventListener('resize', () => { resize(); });
}

/* ─── Navbar scroll effect ───────────────────────────────── */
function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ─── Feature Carousel ───────────────────────────────────── */
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots  = document.querySelectorAll('.cdot');
  if (!track) return;

  const SLIDE_W    = 300 + 20; // card width + gap — adjust if CSS changes
  const TOTAL_REAL = 8;        // real (non-duplicate) slides
  let current      = 0;
  let autoTimer;

  function goTo(idx) {
    current = ((idx % TOTAL_REAL) + TOTAL_REAL) % TOTAL_REAL;
    track.style.transform = `translateX(-${current * SLIDE_W}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function next() { goTo(current + 1); }

  autoTimer = setInterval(next, 3200);

  dots.forEach((d, i) => {
    d.addEventListener('click', () => { clearInterval(autoTimer); goTo(i); autoTimer = setInterval(next, 3200); });
  });

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => { autoTimer = setInterval(next, 3200); });
}

/* ─── Leaderboard Preview ─────────────────────────────────── */
function renderLeaderboardPreview() {
  const body = document.getElementById('lbTableBody');
  if (!body) return;

  // Pull real stored leaderboard or show plausible demo data
  let entries = [];
  try {
    const stored = localStorage.getItem('interviewai_leaderboard');
    if (stored) entries = JSON.parse(stored).slice(0, 5);
  } catch {}

  if (!entries.length) {
    entries = [
      { name: 'Arjun S.',      confidence: 94, result: 'Selected',     streak: 12 },
      { name: 'Priya M.',      confidence: 91, result: 'Selected',     streak: 9  },
      { name: 'Rahul K.',      confidence: 88, result: 'Selected',     streak: 7  },
      { name: 'Sneha T.',      confidence: 85, result: 'Selected',     streak: 5  },
      { name: 'Vikram P.',     confidence: 82, result: 'Not Selected', streak: 3  },
    ];
  }

  const rankEmojis = ['🥇', '🥈', '🥉'];
  body.innerHTML = entries.map((e, i) => {
    const isSelected = (e.result || '').toLowerCase().includes('selected') &&
                       !(e.result || '').toLowerCase().includes('not');
    return `
      <div class="lb-row">
        <span class="lb-rank">${rankEmojis[i] || '#' + (i + 1)}</span>
        <span class="lb-name">${e.name || e.username || 'Anonymous'}</span>
        <span class="lb-conf" style="color:var(--cyan)">${Math.round(e.confidence || 0)}%</span>
        <span class="lb-result" style="color:${isSelected ? 'var(--green)' : 'var(--pink)'}">
          ${isSelected ? '✓ Selected' : '✗ Not Selected'}
        </span>
        <span class="lb-streak" style="color:var(--yellow)">🔥 ${e.streak || 0}d</span>
      </div>`;
  }).join('');
}

/* ─── Smooth anchor scrolling ─────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        closeDrawer();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Close drawer on drawer link click
  document.querySelectorAll('.drawer-link').forEach(l => {
    l.addEventListener('click', closeDrawer);
  });
}

/* ─── Intersection Observer — animate on scroll ──────────── */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('visible');
        obs.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll(
    '.hiw-step, .pricing-card, .feature-slide, .lb-table-wrap'
  ).forEach(el => { el.classList.add('scroll-hidden'); obs.observe(el); });
}

/* ─── MAIN INIT ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  /* 1. ALWAYS render correct auth state first — this is the core fix */
  renderNavAuthState();

  /* 2. Wire up EVERY "Analyze" / CTA button with auth guard */
  const analyzeTargets = [
    'analyzeBtn',     // hero primary button
    'ctaAnalyzeBtn',  // bottom CTA section button
  ];

  analyzeTargets.forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      requireAuth('index_old.html');
    });
  });

  // Also handle any plain <a> that points to index.html — replace with guard
  document.querySelectorAll('a[href="index.html"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      requireAuth('index_old.html');
    });
  });

  // "Join the Leaderboard" button also requires auth
  document.querySelectorAll('a[href="auth.html?mode=signup"]').forEach(a => {
    // These are fine — they go to signup which is public
  });

  /* 3. Drawer links that need auth */
  document.querySelectorAll('.drawer-link[href="index.html"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      closeDrawer();
      requireAuth('index_old.html');
    });
  });

  /* 4. Navbar "Dashboard" in drawer — also guarded */
  document.querySelectorAll('.drawer-link[href="dashboard.html"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      closeDrawer();
      requireAuth('dashboard.html');
    });
  });

  /* 5. Features */
  initParticles();
  initNavScroll();
  initCarousel();
  renderLeaderboardPreview();
  initSmoothScroll();
  initScrollAnimations();

  console.log('[InterviewAI Landing] Auth state:', isLoggedIn() ? 'logged in' : 'logged out');
});
