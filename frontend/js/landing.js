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

function logoutUser() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('interviewai_')) keysToRemove.push(k);
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  try { sessionStorage.clear(); } catch {}
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

/* ─── Navbar Auth State ─────────────────────────────────────
   Renders a styled chip + gradient Dashboard button when logged in
─────────────────────────────────────────────────────────────*/
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
    document.getElementById('navMenuBtn')?.addEventListener('click', toggleDrawer);
  } else {
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
    return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+0.3, vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, alpha: Math.random()*0.5+0.1 };
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
  window.addEventListener('scroll', () => { nav.classList.toggle('scrolled', window.scrollY > 40); }, {passive:true});
}

function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const dots   = document.querySelectorAll('.cdot');
  if (!track) return;
  const SLIDE_W = 300 + 20;
  const TOTAL_REAL = 8;
  let current = 0, autoTimer;

  function goTo(idx) {
    current = ((idx % TOTAL_REAL) + TOTAL_REAL) % TOTAL_REAL;
    track.style.transform = `translateX(-${current * SLIDE_W}px)`;
    dots.forEach((d,i) => d.classList.toggle('active', i === current));
  }
  function next() { goTo(current+1); }
  autoTimer = setInterval(next, 3200);
  dots.forEach((d,i) => { d.addEventListener('click', () => { clearInterval(autoTimer); goTo(i); autoTimer = setInterval(next,3200); }); });
  track.addEventListener('mouseenter', () => clearInterval(autoTimer));
  track.addEventListener('mouseleave', () => { autoTimer = setInterval(next, 3200); });
}

/* ─── Leaderboard Preview — REAL USERS ONLY ─────────────────
   Only shows real registered users from localStorage.
   Shows a "be the first" message if no one has done an interview yet.
─────────────────────────────────────────────────────────────*/
function renderLeaderboardPreview() {
  const body = document.getElementById('lbTableBody');
  if (!body) return;

  // Scan ALL per-user history keys
  const entries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('interviewai_history_')) continue;
    const email = key.replace('interviewai_history_', '');
    if (email === 'guest') continue;
    try {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      if (!history.length) continue;

      const avgConf = Math.round(history.reduce((s,h) => s + (h.confidence || h.confidence_score || 0), 0) / history.length);
      const lastResult = history[0]?.result || history[0]?.interview_result || 'Not Selected';
      const regData = JSON.parse(localStorage.getItem('interviewai_registered_' + email) || '{}');
      const storedUser = JSON.parse(localStorage.getItem('interviewai_user') || '{}');
      const name = regData.name || (storedUser.email === email ? storedUser.name : null) || email.split('@')[0];

      // Compute streak
      const sorted = [...history].filter(h => h.date).sort((a,b) => new Date(b.date) - new Date(a.date));
      let streak = 0, prev = new Date(); prev.setHours(0,0,0,0);
      for (const h of sorted) {
        const d = new Date(h.date); d.setHours(0,0,0,0);
        if ((prev - d) / 86400000 <= 1) { streak++; prev = d; } else break;
      }

      entries.push({ name, confidence: avgConf, result: lastResult, streak });
    } catch(e) {}
  }

  entries.sort((a,b) => b.confidence - a.confidence);
  const top5 = entries.slice(0, 5);

  if (!top5.length) {
    body.innerHTML = `
      <div class="lb-row" style="justify-content:center;padding:28px;color:rgba(255,255,255,0.4);font-size:13px;text-align:center">
        🏆 No interviews yet — be the first on the leaderboard!
      </div>`;
    return;
  }

  const rankEmojis = ['🥇','🥈','🥉'];
  body.innerHTML = top5.map((e,i) => {
    const isSelected = (e.result||'').toLowerCase().includes('selected') && !(e.result||'').toLowerCase().includes('not');
    return `
      <div class="lb-row">
        <span class="lb-rank">${rankEmojis[i] || '#'+(i+1)}</span>
        <span class="lb-name">${e.name || 'Anonymous'}</span>
        <span class="lb-conf" style="color:var(--cyan)">${Math.round(e.confidence||0)}%</span>
        <span class="lb-result" style="color:${isSelected?'var(--green)':'var(--pink)'}">
          ${isSelected ? '✓ Selected' : '✗ Not Selected'}
        </span>
        <span class="lb-streak" style="color:var(--yellow)">🔥 ${e.streak||0}d</span>
      </div>`;
  }).join('');
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); closeDrawer(); target.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
  document.querySelectorAll('.drawer-link').forEach(l => l.addEventListener('click', closeDrawer));
}

function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visible'); obs.unobserve(en.target); } });
  }, {threshold:0.15});
  document.querySelectorAll('.hiw-step,.pricing-card,.feature-slide,.lb-table-wrap').forEach(el => {
    el.classList.add('scroll-hidden'); obs.observe(el);
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
  initScrollAnimations();

  console.log('[InterviewAI Landing] Auth:', isLoggedIn() ? 'logged in' : 'logged out');
});