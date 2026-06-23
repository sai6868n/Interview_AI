'use strict';

/* ─── Auth Helpers ─────────────────────────────────────────── */
function getUser() {
  try {
    const raw = localStorage.getItem('interviewai_user');
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u || !u.name || u.name === 'Guest User' || !u.email) return null;
    return u;
  } catch { return null; }
}
function isLoggedIn() { return getUser() !== null; }

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ─── Navbar Auth State ─────────────────────────────────────── */
function renderNavAuthState() {
  const user     = getUser();
  const navRight = document.querySelector('.nav-right');
  if (!navRight) return;

  if (user) {
    navRight.innerHTML = `
      <div class="nav-user-chip">
        <div class="nav-user-avatar">${initials(user.name)}</div>
        <span class="nav-user-name">${user.name.split(' ')[0]}</span>
      </div>
      <a href="dashboard.html" class="btn-nav-dashboard">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
        </svg>
        Dashboard
      </a>
      <button class="nav-menu-btn" id="navMenuBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>`;
  } else {
    navRight.innerHTML = `
      <a href="auth.html?mode=signup" class="btn-nav-signup">Login / Sign Up</a>
      <button class="nav-menu-btn" id="navMenuBtn" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>`;
  }

  // Wire hamburger after injecting
  document.getElementById('navMenuBtn')?.addEventListener('click', toggleDrawer);
}

/* ─── Mobile Drawer — smooth animated ─────────────────────── */
let drawerOpen = false;

function toggleDrawer() {
  drawerOpen ? closeDrawer() : openDrawer();
}

function openDrawer() {
  const drawer = document.getElementById('navDrawer');
  const btn    = document.getElementById('navMenuBtn');
  if (!drawer) return;
  drawerOpen = true;
  drawer.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Animate hamburger → X
  if (btn) {
    const spans = btn.querySelectorAll('span');
    if (spans[0]) { spans[0].style.transform = 'translateY(7px) rotate(45deg)'; }
    if (spans[1]) { spans[1].style.opacity = '0'; spans[1].style.transform = 'scaleX(0)'; }
    if (spans[2]) { spans[2].style.transform = 'translateY(-7px) rotate(-45deg)'; }
  }
}

function closeDrawer() {
  const drawer = document.getElementById('navDrawer');
  const btn    = document.getElementById('navMenuBtn');
  if (!drawer) return;
  drawerOpen = false;
  drawer.classList.remove('open');
  document.body.style.overflow = '';

  // Animate X → hamburger
  if (btn) {
    const spans = btn.querySelectorAll('span');
    if (spans[0]) { spans[0].style.transform = ''; }
    if (spans[1]) { spans[1].style.opacity = ''; spans[1].style.transform = ''; }
    if (spans[2]) { spans[2].style.transform = ''; }
  }
}

/* ─── Auth Guard ─────────────────────────────────────────── */
function requireAuth(destination = 'index_old.html') {
  if (isLoggedIn()) {
    window.location.href = destination;
  } else {
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

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function makeParticle() {
    return {
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.5+0.3,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      alpha: Math.random()*0.5+0.1
    };
  }
  function init() { resize(); particles = Array.from({length:120}, makeParticle); }
  function draw() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0)p.x=W; if(p.x>W)p.x=0; if(p.y<0)p.y=H; if(p.y>H)p.y=0;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(0,245,255,${p.alpha})`; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  init(); draw();
  window.addEventListener('resize', resize);
}

function initNavScroll() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots   = document.querySelectorAll('.cdot');
  if (!track) return;
  const SLIDE_W   = 300 + 20;
  const TOTAL_REAL = 8;
  let current = 0, autoTimer;

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
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => { autoTimer = setInterval(next, 3200); });
}

/* ─── Leaderboard Preview — real users + dummy mix ──────────
   Shows real users from localStorage first, then fills
   remaining slots with dummy entries so board is never empty.
──────────────────────────────────────────────────────────── */
const LB_DUMMY = [
  { name:'Arjun Sharma',   conf:91, result:'Selected',     streak:7  },
  { name:'Priya Verma',    conf:88, result:'Selected',     streak:5  },
  { name:'Rohan Mehta',    conf:84, result:'Selected',     streak:3  },
  { name:'Ananya Singh',   conf:81, result:'Selected',     streak:4  },
  { name:'Vikram Patel',   conf:79, result:'Selected',     streak:2  },
];

function renderLeaderboardPreview() {
  const body = document.getElementById('lbTableBody');
  if (!body) return;

  // Collect real users
  const realEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('interviewai_history_')) continue;
    const email = key.replace('interviewai_history_', '');
    if (email === 'guest') continue;
    try {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      if (!history.length) continue;
      const avgConf    = Math.round(history.reduce((s,h) => s + (h.confidence || h.confidence_score || 0), 0) / history.length);
      const lastResult = history[0]?.result || history[0]?.interview_result || 'Not Selected';
      const regData    = JSON.parse(localStorage.getItem('interviewai_registered_' + email) || '{}');
      const storedUser = JSON.parse(localStorage.getItem('interviewai_user') || '{}');
      const name       = regData.name || (storedUser.email === email ? storedUser.name : null) || email.split('@')[0];

      const sorted = [...history].filter(h => h.date).sort((a,b) => new Date(b.date)-new Date(a.date));
      let streak = 0, prev = new Date(); prev.setHours(0,0,0,0);
      for (const h of sorted) {
        const d = new Date(h.date); d.setHours(0,0,0,0);
        if ((prev-d)/86400000 <= 1) { streak++; prev = d; } else break;
      }
      realEntries.push({ name, conf: avgConf, result: lastResult, streak, isReal: true });
    } catch(e) {}
  }

  // Merge: real users first, then dummy to fill up to 5 visible rows
  const allEntries = [...realEntries];
  for (const d of LB_DUMMY) {
    if (allEntries.length >= 5) break;
    // don't add dummy if real user with same name already exists
    if (!realEntries.find(r => r.name === d.name)) {
      allEntries.push({ name: d.name, conf: d.conf, result: d.result, streak: d.streak, isReal: false });
    }
  }

  allEntries.sort((a, b) => b.conf - a.conf);
  const top5 = allEntries.slice(0, 5);

  const rankEmojis = ['🥇','🥈','🥉'];
  body.innerHTML = top5.map((e, i) => {
    const isSelected = (e.result||'').toLowerCase().includes('selected') && !(e.result||'').toLowerCase().includes('not');
    return `
      <div class="lb-row">
        <span class="lb-rank">${rankEmojis[i] || '#'+(i+1)}</span>
        <span class="lb-name">${e.name || 'Anonymous'}</span>
        <span class="lb-conf" style="color:var(--cyan)">${Math.round(e.conf||0)}%</span>
        <span class="lb-result" style="color:${isSelected?'var(--green)':'var(--pink)'}">
          ${isSelected ? '✓ Selected' : '✗ Not Selected'}
        </span>
        <span class="lb-streak" style="color:var(--yellow)">🔥 ${e.streak||0}d</span>
      </div>`;
  }).join('');
}

/* ─── Smooth Scroll ─────────────────────────────────────── */
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
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));
}

/* ─── Close drawer on outside click / resize ──────────── */
function initDrawerBehavior() {
  // Close on outside click
  document.addEventListener('click', e => {
    if (!drawerOpen) return;
    const drawer = document.getElementById('navDrawer');
    const btn    = document.getElementById('navMenuBtn');
    if (drawer && !drawer.contains(e.target) && btn && !btn.contains(e.target)) {
      closeDrawer();
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900 && drawerOpen) closeDrawer();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && drawerOpen) closeDrawer();
  });
}

/* ─── Scroll Animations ─────────────────────────────────── */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.hiw-step, .pricing-card, .feature-slide, .lb-table-wrap').forEach(el => {
    el.classList.add('scroll-hidden');
    obs.observe(el);
  });
}

/* ─── MAIN INIT ─────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderNavAuthState();

  // Analyze / CTA buttons — auth guard
  ['analyzeBtn','ctaAnalyzeBtn'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => requireAuth('index_old.html'));
  });

  document.querySelectorAll('a[href="index.html"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); requireAuth('index_old.html'); });
  });

  document.querySelectorAll('.drawer-link[href="index.html"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); closeDrawer(); requireAuth('index_old.html'); });
  });

  document.querySelectorAll('.drawer-link[href="dashboard.html"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); closeDrawer(); requireAuth('dashboard.html'); });
  });

  initParticles();
  initNavScroll();
  initCarousel();
  renderLeaderboardPreview();
  initSmoothScroll();
  initDrawerBehavior();
  initScrollAnimations();

  console.log('[InterviewAI Landing] Auth:', isLoggedIn() ? 'logged in' : 'logged out');
});