/* ═══════════════════════════════════════════════════════════════
   INTERVIEWAI — auth.js  (v4 — ChatGPT-style + account picker)
   ----------------------------------------------------------------
   FEATURES:
   • "Log back in" panel: shows recently used accounts (like ChatGPT)
   • Google account picker: lists saved Google accounts (like Google OAuth)
   • Two-step email login: email → password
   • Full signup flow
   • Google / GitHub demo mode (no real OAuth needed)
   • All accounts stored in localStorage with recents tracking

   TO ENABLE REAL GOOGLE LOGIN:
   1. Go to https://console.cloud.google.com
   2. Create OAuth 2.0 Client ID (Web application)
   3. Add your domain to Authorised JS Origins
   4. Paste the Client ID below as GOOGLE_CLIENT_ID

   TO ENABLE REAL GITHUB LOGIN:
   1. GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
   2. Paste Client ID below as GITHUB_CLIENT_ID
   3. Set up a backend to exchange the code for a token
═══════════════════════════════════════════════════════════════ */

/* ── ⚙️  CONFIGURATION ─────────────────────────────────────── */
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const GITHUB_CLIENT_ID = '0v23liiwJZY46AHaELJe';
const USE_FIREBASE     = false;
const FIREBASE_CONFIG  = {
  apiKey: '', authDomain: '', projectId: '',
  storageBucket: '', messagingSenderId: '', appId: '',
};
/* ─────────────────────────────────────────────────────────── */

'use strict';

/* ══════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════ */
function $(id) { return document.getElementById(id); }

function getRedirect() {
  return new URLSearchParams(window.location.search).get('redirect') || 'dashboard.html';
}

/* ── Toast ── */
var _toastTimer;
function toast(msg, type) {
  var el   = $('authToast');
  var icon = $('authToastIcon');
  var text = $('authToastMsg');
  if (!el) { return; }
  clearTimeout(_toastTimer);
  icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  text.textContent = msg;
  el.classList.add('show');
  _toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3500);
}

function showError(elId, msg) {
  var node = $(elId);
  if (node) { node.textContent = msg; }
}
function clearError(elId) {
  var node = $(elId);
  if (node) { node.textContent = ''; }
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoading(btn, loading, originalText) {
  if (!btn) { return; }
  btn.disabled = loading;
  var span = btn.querySelector('.btn-auth-text');
  if (!span) { return; }
  if (loading) {
    btn.classList.add('loading');
    span.textContent = 'Please wait…';
  } else {
    btn.classList.remove('loading');
    span.textContent = originalText;
  }
}

function redirectAfterLogin(delay) {
  setTimeout(function () { window.location.href = getRedirect(); }, delay || 900);
}

/* ── Initials avatar ── */
function getInitials(name) {
  if (!name) { return '?'; }
  var parts = name.trim().split(/\s+/);
  if (parts.length >= 2) { return (parts[0][0] + parts[1][0]).toUpperCase(); }
  return name.slice(0, 2).toUpperCase();
}

/* ── Random avatar gradient ── */
var _gradients = [
  'linear-gradient(135deg,#7c3aed,#00f5ff)',
  'linear-gradient(135deg,#f43f5e,#7c3aed)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#f43f5e)',
  'linear-gradient(135deg,#06b6d4,#8b5cf6)',
];
function avatarGradient(seed) {
  var idx = seed ? seed.charCodeAt(0) % _gradients.length : 0;
  return _gradients[idx];
}

/* ══════════════════════════════════════════════════════
   SESSION & RECENTS MANAGEMENT
══════════════════════════════════════════════════════ */
var RECENTS_KEY = 'interviewai_recents';  /* array of session objects, most recent first */
var SESSION_KEY = 'interviewai_user';

function saveSession(data) {
  var name     = data.name     || (data.email || '').split('@')[0];
  var username = data.username || name.replace(/\s+/g, '_').toLowerCase();
  var session  = {
    uid:      data.uid      || ('uid_' + Date.now()),
    name:     name,
    username: username,
    email:    data.email    || '',
    photoURL: data.photoURL || '',
    provider: data.provider || 'email',
    joined:   new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('interviewai_uid',      session.uid);
  localStorage.setItem('interviewai_username', session.username);
  localStorage.setItem('interviewai_email',    session.email);
  localStorage.setItem('interviewai_photo',    session.photoURL);

  /* Add/update in recents list */
  addToRecents(session);
}

function addToRecents(session) {
  var recents = getRecents();
  /* Remove existing entry with same email */
  recents = recents.filter(function (r) { return r.email !== session.email; });
  recents.unshift(session);          /* put at front */
  if (recents.length > 6) { recents = recents.slice(0, 6); } /* max 6 */
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

function getRecents() {
  try {
    return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]');
  } catch (e) { return []; }
}

function removeFromRecents(email) {
  var recents = getRecents().filter(function (r) { return r.email !== email; });
  localStorage.setItem(RECENTS_KEY, JSON.stringify(recents));
}

function getSession() {
  try {
    var u = JSON.parse(localStorage.getItem(SESSION_KEY));
    return (u && u.uid) ? u : null;
  } catch (e) { return null; }
}

/* ── Check already logged in ── */
(function checkSession() {
  if (getSession()) {
    window.location.href = getRedirect();
  }
}());

/* ══════════════════════════════════════════════════════
   PANEL ROUTER
══════════════════════════════════════════════════════ */
var _emailForPasswordStep = '';

function showPanel(id) {
  ['panelRecent', 'panelMain', 'panelPassword', 'panelGooglePicker'].forEach(function (p) {
    var el = $(p);
    if (el) { el.classList.toggle('hidden', p !== id); }
  });
}

/* ══════════════════════════════════════════════════════
   RECENT ACCOUNTS PANEL
══════════════════════════════════════════════════════ */
function buildRecentPanel() {
  var recents = getRecents();
  if (recents.length === 0) {
    /* No recents → go straight to main panel */
    showPanel('panelMain');
    return;
  }
  showPanel('panelRecent');
  renderRecentList(recents);
}

function renderRecentList(recents) {
  var list = $('recentAccountsList');
  if (!list) { return; }
  list.innerHTML = '';
  recents.forEach(function (account) {
    var item = document.createElement('button');
    item.className = 'account-item';
    item.innerHTML = buildAvatarHTML(account) +
      '<div class="account-info">' +
        '<div class="account-name">' + escHtml(account.name) + '</div>' +
        '<div class="account-email">' + escHtml(account.email) + '</div>' +
      '</div>' +
      '<button class="account-remove" data-email="' + escHtml(account.email) + '" title="Remove">' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button>';

    /* Click on account → log back in */
    item.addEventListener('click', function (e) {
      /* Ignore if the remove button was clicked */
      if (e.target.closest('.account-remove')) { return; }
      loginWithRecentAccount(account);
    });

    /* Remove button */
    item.querySelector('.account-remove').addEventListener('click', function (e) {
      e.stopPropagation();
      removeFromRecents(account.email);
      var recentsNow = getRecents();
      if (recentsNow.length === 0) {
        showPanel('panelMain');
      } else {
        renderRecentList(recentsNow);
      }
    });

    list.appendChild(item);
  });
}

function loginWithRecentAccount(account) {
  /* For Google/GitHub providers, re-authenticate via their flow */
  if (account.provider === 'google') {
    triggerGoogleSignIn();
    return;
  }
  if (account.provider === 'github') {
    triggerGitHubSignIn();
    return;
  }
  /* For email providers, go to password panel with their email pre-filled */
  _emailForPasswordStep = account.email;
  var lbl = $('passwordEmailLabel');
  if (lbl) { lbl.textContent = 'Signing in as ' + account.email; }
  clearError('loginError');
  var inp = $('loginPassword');
  if (inp) { inp.value = ''; inp.focus(); }
  showPanel('panelPassword');
}

/* ── "Log in to another account" ── */
var loginAnotherBtn = $('loginAnotherBtn');
if (loginAnotherBtn) {
  loginAnotherBtn.addEventListener('click', function () {
    showPanel('panelMain');
    switchSubTab('login');
  });
}

var createFromRecentBtn = $('createFromRecentBtn');
if (createFromRecentBtn) {
  createFromRecentBtn.addEventListener('click', function () {
    showPanel('panelMain');
    switchSubTab('signup');
  });
}

/* ══════════════════════════════════════════════════════
   TABS (login / signup inside panelMain)
══════════════════════════════════════════════════════ */
function switchSubTab(mode) {
  var isLogin = (mode === 'login');
  var tabLogin  = $('tabLogin');
  var tabSignup = $('tabSignup');
  var slider    = $('tabSlider');
  if (tabLogin)  { tabLogin.classList.toggle('active', isLogin); }
  if (tabSignup) { tabSignup.classList.toggle('active', !isLogin); }
  if (slider)    { slider.style.transform = isLogin ? 'translateX(0)' : 'translateX(100%)'; }
  var subLogin  = $('subLogin');
  var subSignup = $('subSignup');
  if (subLogin)  { subLogin.classList.toggle('hidden', !isLogin); }
  if (subSignup) { subSignup.classList.toggle('hidden', isLogin); }
}

(function initTabs() {
  var tabLogin  = $('tabLogin');
  var tabSignup = $('tabSignup');
  if (tabLogin)  { tabLogin.addEventListener('click',  function () { switchSubTab('login');  }); }
  if (tabSignup) { tabSignup.addEventListener('click', function () { switchSubTab('signup'); }); }

  document.querySelectorAll('.switch-link').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      switchSubTab(link.dataset.switch);
    });
  });
  /* Default to login tab */
  switchSubTab('login');
}());

/* ══════════════════════════════════════════════════════
   CLOSE & KEYBOARD
══════════════════════════════════════════════════════ */
var closeBtn = $('modalCloseBtn');
if (closeBtn) {
  closeBtn.addEventListener('click', function () {
    window.location.href = 'landing.html';
  });
}
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { window.location.href = 'landing.html'; }
});

/* ══════════════════════════════════════════════════════
   PASSWORD EYE TOGGLES
══════════════════════════════════════════════════════ */
(function initEyeToggles() {
  function toggle(inputId, btnId) {
    var btn = $(btnId);
    var inp = $(inputId);
    if (!btn || !inp) { return; }
    btn.addEventListener('click', function () {
      var show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.style.color = show ? 'var(--cyan)' : '';
    });
  }
  toggle('loginPassword',  'loginEyeToggle');
  toggle('signupPassword', 'signupEyeToggle');
}());

/* ══════════════════════════════════════════════════════
   PASSWORD STRENGTH METER
══════════════════════════════════════════════════════ */
(function initStrength() {
  var input = $('signupPassword');
  if (!input) { return; }
  function calcStrength(pw) {
    var score = 0;
    if (pw.length >= 8)                              { score++; }
    if (pw.length >= 12)                             { score++; }
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw))       { score++; }
    if (/[0-9]/.test(pw))                            { score++; }
    if (/[^A-Za-z0-9]/.test(pw))                    { score++; }
    return Math.min(4, score);
  }
  var labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  var colors = ['', 'var(--pink)', 'var(--yellow)', '#3b82f6', 'var(--green)'];
  input.addEventListener('input', function () {
    var s = calcStrength(input.value);
    for (var i = 1; i <= 4; i++) {
      var bar = $('sb' + i);
      if (!bar) { continue; }
      bar.className = 'strength-bar' + (i <= s ? ' active-' + s : '');
    }
    var lbl = $('strengthLabel');
    if (lbl) {
      lbl.textContent = input.value ? labels[s] : 'Enter a password';
      lbl.style.color = input.value ? colors[s] : '';
    }
  });
}());

/* ══════════════════════════════════════════════════════
   PARTICLE CANVAS
══════════════════════════════════════════════════════ */
(function initParticles() {
  var canvas = $('authCanvas');
  if (!canvas) { return; }
  var ctx = canvas.getContext('2d');
  var W, H, particles = [];
  var COLORS = ['#00f5ff', '#7c3aed', '#f43f5e', '#10b981'];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  function makeParticle() {
    return { x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.2+0.3,
             vx: (Math.random()-0.5)*0.22, vy: (Math.random()-0.5)*0.22,
             alpha: Math.random()*0.35+0.08, color: COLORS[Math.floor(Math.random()*COLORS.length)] };
  }
  function resetParticle(p) { var np=makeParticle(); Object.assign(p,np); }
  function init() { resize(); particles=[]; for(var i=0;i<90;i++){particles.push(makeParticle());} }
  function animate() {
    ctx.clearRect(0,0,W,H);
    particles.forEach(function(p){
      p.x+=p.vx; p.y+=p.vy;
      if(p.x<0||p.x>W||p.y<0||p.y>H){resetParticle(p);}
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle=p.color; ctx.globalAlpha=p.alpha; ctx.fill();
    });
    ctx.globalAlpha=1; requestAnimationFrame(animate);
  }
  init(); animate(); window.addEventListener('resize', resize);
}());

/* ══════════════════════════════════════════════════════
   HTML ESCAPE
══════════════════════════════════════════════════════ */
function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ══════════════════════════════════════════════════════
   AVATAR HTML BUILDER
══════════════════════════════════════════════════════ */
function buildAvatarHTML(account) {
  if (account.photoURL) {
    return '<div class="account-avatar"><img src="' + escHtml(account.photoURL) + '" onerror="this.parentNode.innerHTML=\'' + escHtml(getInitials(account.name)) + '\';this.parentNode.style.background=\'' + avatarGradient(account.email) + '\'" /></div>';
  }
  return '<div class="account-avatar" style="background:' + avatarGradient(account.email) + '">' + escHtml(getInitials(account.name)) + '</div>';
}

/* ══════════════════════════════════════════════════════
   GOOGLE SIGN-IN
══════════════════════════════════════════════════════ */
function isGoogleConfigured() {
  return GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
}

function loadGSI(callback) {
  if (window.google && window.google.accounts) { callback(); return; }
  var script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true; script.defer = true;
  script.onload = callback;
  script.onerror = function () { toast('Could not load Google Sign-In library.', 'error'); };
  document.head.appendChild(script);
}

function handleGoogleResponse(response) {
  try {
    var parts   = response.credential.split('.');
    var payload = JSON.parse(atob(parts[1].replace(/-/g,'+').replace(/_/g,'/')));
    saveSession({
      uid:      payload.sub,
      name:     payload.name     || payload.email.split('@')[0],
      username: (payload.name || payload.email.split('@')[0]).replace(/\s+/g,'_').toLowerCase(),
      email:    payload.email    || '',
      photoURL: payload.picture  || '',
      provider: 'google',
    });
    toast('Signed in as ' + (payload.name || payload.email) + ' ✓', 'success');
    redirectAfterLogin(900);
  } catch (e) {
    console.error('[Auth] Failed to decode Google token', e);
    toast('Google sign-in failed. Please try again.', 'error');
  }
}

function triggerGoogleSignIn() {
  if (!isGoogleConfigured()) {
    showGooglePickerOrDemo();
    return;
  }
  loadGSI(function () {
    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.prompt(function (notification) {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          showGSIButtonOverlay();
        }
      });
    } catch (err) {
      console.error('[Auth] GSI error', err);
      toast('Google sign-in error: ' + err.message, 'error');
    }
  });
}

/* ── Show the in-app Google account picker (ALWAYS shown, like real Google OAuth) ── */
function showGooglePickerOrDemo() {
  buildGooglePickerPanel();
  showPanel('panelGooglePicker');
}

function buildGooglePickerPanel() {
  var list = $('googleAccountList');
  if (!list) { return; }
  list.innerHTML = '';

  /* All saved Google accounts */
  var googleAccounts = getRecents().filter(function (r) { return r.provider === 'google'; });

  if (googleAccounts.length === 0) {
    /* Show a subtle empty-state hint */
    list.innerHTML = '<div style="padding:14px 16px;font-size:13px;color:var(--text-3);text-align:center">No saved accounts yet.<br>Use <b style="color:var(--text-2)">Use another account</b> below to add one.</div>';
  } else {
    googleAccounts.forEach(function (account) {
      var item = document.createElement('button');
      item.className = 'account-item';
      item.innerHTML = buildAvatarHTML(account) +
        '<div class="account-info">' +
          '<div class="account-name">' + escHtml(account.name) + '</div>' +
          '<div class="account-email">' + escHtml(account.email) + '</div>' +
        '</div>' +
        '<button class="account-remove" title="Remove account">' +
          '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>';

      item.addEventListener('click', function (e) {
        if (e.target.closest('.account-remove')) { return; }
        saveSession(account);
        toast('Signed in as ' + account.name + ' ✓', 'success');
        redirectAfterLogin(900);
      });

      item.querySelector('.account-remove').addEventListener('click', function (e) {
        e.stopPropagation();
        removeFromRecents(account.email);
        buildGooglePickerPanel(); /* re-render */
      });

      list.appendChild(item);
    });
  }

  /* "Use another account" always visible — opens the add-account demo modal */
  var useAnotherBtn = $('useAnotherGoogleBtn');
  if (useAnotherBtn) {
    useAnotherBtn.onclick = function () { showGoogleDemoModal(); };
  }

  /* Back button inside picker — go back to main panel */
  var pickerPanel = $('panelGooglePicker');
  if (pickerPanel && !pickerPanel.querySelector('.picker-back-btn')) {
    var backBtn = document.createElement('button');
    backBtn.className = 'back-btn picker-back-btn';
    backBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>';
    backBtn.style.marginBottom = '16px';
    backBtn.addEventListener('click', function () {
      showPanel('panelMain');
      switchSubTab('login');
    });
    pickerPanel.insertBefore(backBtn, pickerPanel.firstChild);
  }
}

/* GSI button overlay (real GSI) */
function showGSIButtonOverlay() {
  var overlay = document.createElement('div');
  overlay.id = 'gsiOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px)';
  var box = document.createElement('div');
  box.style.cssText = 'background:#0d1220;border:1px solid rgba(255,255,255,0.12);border-radius:16px;padding:28px 32px;text-align:center;width:320px';
  box.innerHTML = '<div style="font-family:Syne,sans-serif;font-size:17px;font-weight:700;margin-bottom:8px;color:#f0f4ff">Choose a Google Account</div><div id="gsiButtonMount"></div><button id="gsiCloseBtn" style="margin-top:16px;width:100%;padding:10px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#8892a4;font-size:13px;cursor:pointer">Cancel</button>';
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  window.google.accounts.id.renderButton(document.getElementById('gsiButtonMount'), { theme:'filled_black', size:'large', width:256 });
  document.getElementById('gsiCloseBtn').addEventListener('click', function () { document.body.removeChild(overlay); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) { document.body.removeChild(overlay); } });
}

/* Demo modal when Client ID is not set and no saved Google accounts */
function showGoogleDemoModal() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px)';
  overlay.innerHTML =
    '<div style="background:#161616;border:1px solid rgba(0,245,255,0.2);border-radius:18px;padding:32px;width:340px;font-family:DM Sans,sans-serif">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">' +
        '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>' +
        '<span style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:#f0f4ff">Google Sign-In Demo</span>' +
      '</div>' +
      '<p style="font-size:12px;color:#f59e0b;margin:12px 0;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:8px 12px">⚠ GOOGLE_CLIENT_ID not set. Enter your name and email to simulate Google login.</p>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:#8892a4;display:block;margin-bottom:5px">Your Name</label><input id="demoGoogleName" type="text" placeholder="Arjun Kumar" style="width:100%;padding:10px 14px;border-radius:8px;background:#111827;border:1px solid rgba(255,255,255,0.12);color:#f0f4ff;font-size:14px;font-family:DM Sans,sans-serif;outline:none;box-sizing:border-box"/></div>' +
      '<div style="margin-bottom:20px"><label style="font-size:12px;font-weight:600;color:#8892a4;display:block;margin-bottom:5px">Email Address</label><input id="demoGoogleEmail" type="email" placeholder="you@gmail.com" style="width:100%;padding:10px 14px;border-radius:8px;background:#111827;border:1px solid rgba(255,255,255,0.12);color:#f0f4ff;font-size:14px;font-family:DM Sans,sans-serif;outline:none;box-sizing:border-box"/></div>' +
      '<button id="demoGoogleSubmit" style="width:100%;padding:12px;border-radius:10px;background:linear-gradient(135deg,#00f5ff,#7c3aed);border:none;color:#000;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:10px">Continue →</button>' +
      '<button id="demoGoogleCancel" style="width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#8892a4;font-size:13px;cursor:pointer">Cancel</button>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('demoGoogleSubmit').addEventListener('click', function () {
    var name  = document.getElementById('demoGoogleName').value.trim();
    var email = document.getElementById('demoGoogleEmail').value.trim();
    if (!name || !email) {
      document.getElementById('demoGoogleName').style.borderColor  = !name  ? '#f43f5e' : '';
      document.getElementById('demoGoogleEmail').style.borderColor = !email ? '#f43f5e' : '';
      return;
    }
    var accountData = {
      uid:      'google_demo_' + Date.now(),
      name:     name,
      username: name.replace(/\s+/g,'_').toLowerCase(),
      email:    email,
      photoURL: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=4285F4&color=fff&size=128',
      provider: 'google',
    };
    /* Save to recents so it appears in the picker */
    addToRecents(accountData);
    document.body.removeChild(overlay);
    /* Re-render picker with new account, then auto sign in */
    buildGooglePickerPanel();
    showPanel('panelGooglePicker');
    toast('Account added — signing you in…', 'success');
    setTimeout(function () {
      saveSession(accountData);
      redirectAfterLogin(600);
    }, 1200);
  });

  document.getElementById('demoGoogleCancel').addEventListener('click', function () { document.body.removeChild(overlay); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) { document.body.removeChild(overlay); } });
  setTimeout(function () { var n = document.getElementById('demoGoogleName'); if (n) { n.focus(); } }, 100);
}

/* Wire Google buttons */
['googleLoginBtn', 'googleSignupBtn'].forEach(function (id) {
  var btn = $(id);
  if (btn) { btn.addEventListener('click', triggerGoogleSignIn); }
});

/* ══════════════════════════════════════════════════════
   GITHUB SIGN-IN
══════════════════════════════════════════════════════ */
function isGitHubConfigured() {
  return GITHUB_CLIENT_ID && GITHUB_CLIENT_ID !== 'YOUR_GITHUB_CLIENT_ID';
}

function triggerGitHubSignIn() {
  if (!isGitHubConfigured()) {
    showGitHubDemoModal();
    return;
  }
  var state    = Math.random().toString(36).slice(2);
  var redirect = encodeURIComponent(window.location.origin + window.location.pathname + '?provider=github');
  sessionStorage.setItem('github_oauth_state', state);
  window.location.href = 'https://github.com/login/oauth/authorize?client_id=' + GITHUB_CLIENT_ID + '&redirect_uri=' + redirect + '&scope=user:email&state=' + state;
}

function showGitHubDemoModal() {
  var overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);backdrop-filter:blur(8px)';
  overlay.innerHTML =
    '<div style="background:#161616;border:1px solid rgba(255,255,255,0.12);border-radius:18px;padding:32px;width:340px;font-family:DM Sans,sans-serif">' +
      '<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">' +
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="#f0f4ff"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>' +
        '<span style="font-family:Syne,sans-serif;font-size:16px;font-weight:700;color:#f0f4ff">GitHub Sign-In Demo</span>' +
      '</div>' +
      '<p style="font-size:12px;color:#f59e0b;margin:12px 0;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;padding:8px 12px">⚠ GITHUB_CLIENT_ID not configured. Enter your GitHub username to simulate.</p>' +
      '<div style="margin-bottom:12px"><label style="font-size:12px;font-weight:600;color:#8892a4;display:block;margin-bottom:5px">GitHub Username</label><input id="demoGHUsername" type="text" placeholder="octocat" style="width:100%;padding:10px 14px;border-radius:8px;background:#111827;border:1px solid rgba(255,255,255,0.12);color:#f0f4ff;font-size:14px;font-family:DM Sans,sans-serif;outline:none;box-sizing:border-box"/></div>' +
      '<div style="margin-bottom:20px"><label style="font-size:12px;font-weight:600;color:#8892a4;display:block;margin-bottom:5px">Email Address</label><input id="demoGHEmail" type="email" placeholder="you@github.com" style="width:100%;padding:10px 14px;border-radius:8px;background:#111827;border:1px solid rgba(255,255,255,0.12);color:#f0f4ff;font-size:14px;font-family:DM Sans,sans-serif;outline:none;box-sizing:border-box"/></div>' +
      '<button id="demoGHSubmit" style="width:100%;padding:12px;border-radius:10px;background:#24292f;border:1px solid rgba(255,255,255,0.15);color:#f0f4ff;font-weight:700;font-size:14px;cursor:pointer;margin-bottom:10px">Continue with GitHub →</button>' +
      '<button id="demoGHCancel" style="width:100%;padding:10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:#8892a4;font-size:13px;cursor:pointer">Cancel</button>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('demoGHSubmit').addEventListener('click', function () {
    var username = document.getElementById('demoGHUsername').value.trim();
    var email    = document.getElementById('demoGHEmail').value.trim();
    if (!username || !email) {
      document.getElementById('demoGHUsername').style.borderColor = !username ? '#f43f5e' : '';
      document.getElementById('demoGHEmail').style.borderColor    = !email    ? '#f43f5e' : '';
      return;
    }
    saveSession({
      uid:      'github_demo_' + Date.now(),
      name:     username,
      username: username,
      email:    email,
      photoURL: 'https://github.com/' + username + '.png?size=128',
      provider: 'github',
    });
    document.body.removeChild(overlay);
    toast('Signed in as @' + username + ' (GitHub Demo) ✓', 'success');
    redirectAfterLogin(900);
  });

  document.getElementById('demoGHCancel').addEventListener('click', function () { document.body.removeChild(overlay); });
  overlay.addEventListener('click', function (e) { if (e.target === overlay) { document.body.removeChild(overlay); } });
  setTimeout(function () { var u = document.getElementById('demoGHUsername'); if (u) { u.focus(); } }, 100);
}

/* GitHub OAuth callback */
(function handleGitHubCallback() {
  var params   = new URLSearchParams(window.location.search);
  var provider = params.get('provider');
  var code     = params.get('code');
  var state    = params.get('state');
  if (provider !== 'github' || !code) { return; }
  var savedState = sessionStorage.getItem('github_oauth_state');
  if (state !== savedState) { toast('GitHub auth state mismatch.', 'error'); return; }
  toast('Completing GitHub sign-in…', 'info');
  fetch('http://127.0.0.1:8000/auth/github/callback?code=' + code)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.email) { throw new Error('No email returned'); }
      saveSession({ uid: 'github_'+data.id, name: data.name||data.login, username: data.login, email: data.email, photoURL: data.avatar_url||'', provider: 'github' });
      toast('Signed in with GitHub ✓', 'success');
      redirectAfterLogin(800);
    })
    .catch(function (err) { console.error('[Auth] GitHub callback error', err); toast('GitHub sign-in failed.', 'error'); });
}());

/* Wire GitHub buttons */
['githubLoginBtn', 'githubSignupBtn'].forEach(function (id) {
  var btn = $(id);
  if (btn) { btn.addEventListener('click', triggerGitHubSignIn); }
});

/* ══════════════════════════════════════════════════════
   EMAIL — STEP 1: email entry → go to password panel
══════════════════════════════════════════════════════ */
var loginForm = $('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError('loginEmailError');
    var email = ($('loginEmail') || {}).value || '';
    email = email.trim();
    if (!email) { showError('loginEmailError', 'Please enter your email address.'); return; }
    if (!validateEmail(email)) { showError('loginEmailError', 'Please enter a valid email address.'); return; }

    /* Check if account exists */
    var registered = null;
    try { registered = JSON.parse(localStorage.getItem('interviewai_registered_' + email)); } catch(ex) {}

    _emailForPasswordStep = email;
    var lbl = $('passwordEmailLabel');
    if (lbl) { lbl.textContent = 'Signing in as ' + email; }
    clearError('loginError');
    var inp = $('loginPassword');
    if (inp) { inp.value = ''; }
    showPanel('panelPassword');
    setTimeout(function () { if (inp) { inp.focus(); } }, 100);
  });
}

/* ── Back button (password panel) ── */
var backToEmailBtn = $('backToEmailBtn');
if (backToEmailBtn) {
  backToEmailBtn.addEventListener('click', function () {
    showPanel('panelMain');
    switchSubTab('login');
    var emailInp = $('loginEmail');
    if (emailInp) { emailInp.value = _emailForPasswordStep; emailInp.focus(); }
  });
}

/* ══════════════════════════════════════════════════════
   EMAIL — STEP 2: password entry
══════════════════════════════════════════════════════ */
var passwordForm = $('passwordForm');
if (passwordForm) {
  passwordForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError('loginError');
    var password = ($('loginPassword') || {}).value || '';
    var btn      = $('loginSubmit');
    var email    = _emailForPasswordStep;

    if (!password) { showError('loginError', 'Please enter your password.'); return; }
    if (password.length < 6) { showError('loginError', 'Password must be at least 6 characters.'); return; }

    setLoading(btn, true, 'Sign In');
    setTimeout(function () {
      var registered = null;
      try { registered = JSON.parse(localStorage.getItem('interviewai_registered_' + email)); } catch(ex) {}

      if (registered) {
        if (registered.password !== password) {
          showError('loginError', 'Incorrect password.');
          setLoading(btn, false, 'Sign In');
          return;
        }
        saveSession(registered);
        toast('Welcome back, ' + registered.name + '! ✓', 'success');
        redirectAfterLogin(900);
      } else {
        /* Auto-create account (guest convenience) */
        var name = email.split('@')[0].replace(/[._-]/g,' ').replace(/\b\w/g, function(c){return c.toUpperCase();});
        var data = { uid: 'email_'+Date.now(), name: name, username: email.split('@')[0], email: email, password: password, photoURL: '', provider: 'email' };
        localStorage.setItem('interviewai_registered_' + email, JSON.stringify(data));
        saveSession(data);
        toast('Account created & signed in as ' + name + ' ✓', 'success');
        redirectAfterLogin(900);
      }
      setLoading(btn, false, 'Sign In');
    }, 700);
  });
}

/* ── Forgot Password ── */
var forgotBtn = $('forgotPasswordBtn');
if (forgotBtn) {
  forgotBtn.addEventListener('click', function (e) {
    e.preventDefault();
    var email = _emailForPasswordStep;
    if (!email) { showError('loginError', 'No email found. Go back and enter your email.'); return; }
    toast('Password reset instructions sent to ' + email + ' (demo mode)', 'info');
  });
}

/* ══════════════════════════════════════════════════════
   SIGNUP
══════════════════════════════════════════════════════ */
var signupForm = $('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError('signupError');

    var name     = (($('signupName')     || {}).value || '').trim();
    var username = (($('signupUsername') || {}).value || '').trim();
    var email    = (($('signupEmail')    || {}).value || '').trim();
    var password = (($('signupPassword') || {}).value || '');
    var confirm  = (($('signupConfirm')  || {}).value || '');
    var agreed   = ($('agreeTerms')      || {}).checked;
    var btn      = $('signupSubmit');

    if (!name || !username || !email || !password || !confirm) { showError('signupError', 'Please fill in all fields.'); return; }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) { showError('signupError', 'Username: 3–20 characters, letters/numbers/underscore only.'); return; }
    if (!validateEmail(email)) { showError('signupError', 'Please enter a valid email address.'); return; }
    if (password.length < 8) { showError('signupError', 'Password must be at least 8 characters.'); return; }
    if (password !== confirm) { showError('signupError', 'Passwords do not match.'); return; }
    if (!agreed) { showError('signupError', 'Please agree to the Terms of Service.'); return; }
    if (localStorage.getItem('interviewai_registered_' + email)) { showError('signupError', 'This email is already registered. Please log in instead.'); return; }

    setLoading(btn, true, 'Create Free Account');
    setTimeout(function () {
      var data = {
        uid:      'email_' + Date.now(),
        name:     name,
        username: username,
        email:    email,
        password: password,
        photoURL: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=0d1220&color=00f5ff&size=128',
        provider: 'email',
      };
      localStorage.setItem('interviewai_registered_' + email, JSON.stringify(data));
      saveSession(data);
      toast('Welcome to InterviewAI, ' + name + '! 🎉', 'success');
      redirectAfterLogin(1000);
      setLoading(btn, false, 'Create Free Account');
    }, 800);
  });
}

/* ══════════════════════════════════════════════════════
   FIREBASE (optional)
══════════════════════════════════════════════════════ */
if (USE_FIREBASE) {
  import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js').then(function (appModule) {
    import('https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js').then(function (authModule) {
      var fbApp  = appModule.initializeApp(FIREBASE_CONFIG);
      var fbAuth = authModule.getAuth(fbApp);
      authModule.onAuthStateChanged(fbAuth, function (user) {
        if (user) {
          saveSession({ uid: user.uid, name: user.displayName||user.email.split('@')[0], username: (user.displayName||user.email.split('@')[0]).replace(/\s+/g,'_').toLowerCase(), email: user.email, photoURL: user.photoURL||'', provider: user.providerData[0]?user.providerData[0].providerId:'email' });
          window.location.href = getRedirect();
        }
      });
    });
  }).catch(function (err) { console.warn('[Auth] Firebase load failed:', err.message); });
}

/* ══════════════════════════════════════════════════════
   INIT — decide which panel to show first
══════════════════════════════════════════════════════ */
buildRecentPanel();

console.log('[Auth] InterviewAI auth v4 loaded. Google:', isGoogleConfigured()?'REAL':'DEMO', '| GitHub:', isGitHubConfigured()?'REAL':'DEMO', '| Firebase:', USE_FIREBASE?'ON':'OFF');