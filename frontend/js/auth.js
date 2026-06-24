/* ══════════════════════════════════════════════════════
   InterviewAI — auth.js
   Login / Signup / Forgot-password
   Google OAuth: One Tap → renderButton popup fallback
   GitHub: real OAuth or demo fallback
══════════════════════════════════════════════════════ */

'use strict';

/* ── Config ──────────────────────────────────────── */
// IMPORTANT: Replace with your actual Google Client ID from Google Cloud Console
// Make sure http://localhost (and your deployed domain) are in Authorized JS origins
const GOOGLE_CLIENT_ID = '1012801978129-68homnfpa5smbq519hr74k374oh2okk7.apps.googleusercontent.com';
const GITHUB_CLIENT_ID = 'Ov23liiwJZY46AHaELJe'; // fixed capitalisation

/* ── Helpers ─────────────────────────────────────── */
const $ = id => document.getElementById(id);

function getRedirect() {
  return new URLSearchParams(window.location.search).get('redirect') || 'dashboard.html';
}

/* Toast */
let _toastTimer;
function toast(msg, type = 'success') {
  const el   = $('toast');
  const icon = $('toastIcon');
  const txt  = $('toastMsg');
  clearTimeout(_toastTimer);
  icon.textContent = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  txt.textContent  = msg;
  el.classList.add('show');
  _toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

/* Field errors */
function setErr(id, msg)    { const e = $(id); if (e) e.textContent = msg; }
function clearErr(id)       { const e = $(id); if (e) e.textContent = '';  }
function markInput(id, bad) { const el = $(id); if (el) el.classList.toggle('error-state', bad); }

/* Email validation */
const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

/* Button loading state */
function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (!btn) return;
  btn.disabled = loading;
  btn.querySelector('.btn-label').style.opacity  = loading ? 0 : 1;
  btn.querySelector('.btn-spinner').classList.toggle('hidden', !loading);
}

/* Redirect after login */
function redirectAfterLogin(ms = 900) {
  setTimeout(() => { window.location.href = getRedirect(); }, ms);
}

/* ── Session ──────────────────────────────────────── */
const SESSION_KEY = 'interviewai_user';

function saveSession(data) {
  const name     = data.name     || (data.email || '').split('@')[0];
  const username = data.username || name.replace(/\s+/g, '_').toLowerCase();
  const session  = {
    uid:      data.uid      || 'uid_' + Date.now(),
    name, username,
    email:    data.email    || '',
    photoURL: data.photoURL || '',
    provider: data.provider || 'email',
    joined:   new Date().toISOString(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem('interviewai_username', session.username);
  localStorage.setItem('interviewai_email',    session.email);
  localStorage.setItem('interviewai_photo',    session.photoURL);
}

function getSession() {
  try {
    const u = JSON.parse(localStorage.getItem(SESSION_KEY));
    return u?.uid ? u : null;
  } catch { return null; }
}

/* Already logged in → redirect */
if (getSession()) window.location.href = getRedirect();

/* ── View router ─────────────────────────────────── */
function showView(id) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.toggle('hidden', v.id !== id);
  });
}

/* Switch links */
document.querySelectorAll('.switch-link').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showView(a.dataset.to);
  });
});

/* Back buttons */
document.querySelectorAll('.back-btn').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.to));
});

/* Forgot password link */
const forgotBtn = $('forgotBtn');
if (forgotBtn) {
  forgotBtn.addEventListener('click', e => {
    e.preventDefault();
    const loginEmail = ($('loginEmail') || {}).value?.trim();
    if (loginEmail) {
      const fe = $('forgotEmail');
      if (fe) fe.value = loginEmail;
    }
    showView('viewForgot');
  });
}

/* ── Eye toggle ──────────────────────────────────── */
function initEye(inputId, btnId) {
  const btn = $(btnId);
  const inp = $(inputId);
  if (!btn || !inp) return;
  btn.addEventListener('click', () => {
    const show = inp.type === 'password';
    inp.type   = show ? 'text' : 'password';
    btn.style.color = show ? 'var(--accent)' : '';
  });
}
initEye('loginPassword', 'loginEye');
initEye('signupPassword', 'signupEye');

/* ── Password strength ───────────────────────────── */
const strengthInput = $('signupPassword');
if (strengthInput) {
  strengthInput.addEventListener('input', () => {
    const pw   = strengthInput.value;
    const fill = $('strengthFill');
    if (!fill) return;
    let score = 0;
    if (pw.length >= 8)                        score++;
    if (pw.length >= 12)                       score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw))                      score++;
    if (/[^A-Za-z0-9]/.test(pw))              score++;
    score = Math.min(4, score);
    const pct   = ['0%', '25%', '50%', '75%', '100%'][score];
    const color = ['', '#f87171', '#fb923c', '#38bdf8', '#34d399'][score];
    fill.style.width = pct;
    fill.style.backgroundColor = color;
  });
}

/* ══════════════════════════════════════════════════
   LOGIN FORM
══════════════════════════════════════════════════ */
const loginForm = $('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErr('loginEmailErr');
    clearErr('loginPasswordErr');

    const email    = ($('loginEmail')    || {}).value?.trim() || '';
    const password = ($('loginPassword') || {}).value         || '';
    let valid = true;

    if (!email)                  { setErr('loginEmailErr', 'Email is required.');       markInput('loginEmail', true);    valid = false; }
    else if (!validEmail(email)) { setErr('loginEmailErr', 'Enter a valid email.');     markInput('loginEmail', true);    valid = false; }
    else                         { markInput('loginEmail', false); }

    if (!password)               { setErr('loginPasswordErr', 'Password is required.'); markInput('loginPassword', true); valid = false; }
    else if (password.length < 6){ setErr('loginPasswordErr', 'Password is too short.'); markInput('loginPassword', true); valid = false; }
    else                         { markInput('loginPassword', false); }

    if (!valid) return;

    setLoading('loginSubmitBtn', true);
    setTimeout(() => {
      const registered = safeJSON('interviewai_registered_' + email);
      if (registered) {
        if (registered.password !== password) {
          setErr('loginPasswordErr', 'Incorrect password. Please try again.');
          markInput('loginPassword', true);
          setLoading('loginSubmitBtn', false);
          return;
        }
        saveSession(registered);
        toast('Welcome back, ' + registered.name + '!');
        redirectAfterLogin();
      } else {
        const name = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const data = { uid: 'email_' + Date.now(), name, username: email.split('@')[0], email, password, photoURL: '', provider: 'email' };
        localStorage.setItem('interviewai_registered_' + email, JSON.stringify(data));
        saveSession(data);
        toast('Signed in as ' + name);
        redirectAfterLogin();
      }
      setLoading('loginSubmitBtn', false);
    }, 700);
  });
}

/* ══════════════════════════════════════════════════
   SIGNUP FORM
══════════════════════════════════════════════════ */
const signupForm = $('signupForm');
if (signupForm) {
  signupForm.addEventListener('submit', e => {
    e.preventDefault();
    ['signupNameErr','signupEmailErr','signupPasswordErr','signupConfirmErr','signupTermsErr'].forEach(clearErr);

    const name     = ($('signupName')     || {}).value?.trim() || '';
    const email    = ($('signupEmail')    || {}).value?.trim() || '';
    const password = ($('signupPassword') || {}).value         || '';
    const confirm  = ($('signupConfirm')  || {}).value         || '';
    const agreed   = ($('agreeTerms')     || {}).checked;
    let valid = true;

    if (!name)                   { setErr('signupNameErr', 'Full name is required.');                  markInput('signupName', true);     valid = false; }
    else                         { markInput('signupName', false); }

    if (!email)                  { setErr('signupEmailErr', 'Email is required.');                     markInput('signupEmail', true);    valid = false; }
    else if (!validEmail(email)) { setErr('signupEmailErr', 'Enter a valid email address.');           markInput('signupEmail', true);    valid = false; }
    else if (localStorage.getItem('interviewai_registered_' + email)) {
                                   setErr('signupEmailErr', 'Email already registered. Sign in instead.'); markInput('signupEmail', true); valid = false; }
    else                         { markInput('signupEmail', false); }

    if (!password)               { setErr('signupPasswordErr', 'Password is required.');              markInput('signupPassword', true); valid = false; }
    else if (password.length < 8){ setErr('signupPasswordErr', 'Must be at least 8 characters.');    markInput('signupPassword', true); valid = false; }
    else                         { markInput('signupPassword', false); }

    if (!confirm)                { setErr('signupConfirmErr', 'Please confirm your password.');       markInput('signupConfirm', true);  valid = false; }
    else if (confirm !== password){ setErr('signupConfirmErr', 'Passwords do not match.');            markInput('signupConfirm', true);  valid = false; }
    else                         { markInput('signupConfirm', false); }

    if (!agreed) { setErr('signupTermsErr', 'Please accept the Terms of Service to continue.'); valid = false; }

    if (!valid) return;

    setLoading('signupSubmitBtn', true);
    setTimeout(() => {
      const data = {
        uid:      'email_' + Date.now(),
        name,
        username: name.replace(/\s+/g, '_').toLowerCase(),
        email, password,
        photoURL: '',
        provider: 'email',
      };
      localStorage.setItem('interviewai_registered_' + email, JSON.stringify(data));
      saveSession(data);
      toast('Welcome to InterviewAI, ' + name + '! 🎉');
      redirectAfterLogin(1000);
      setLoading('signupSubmitBtn', false);
    }, 800);
  });
}

/* ══════════════════════════════════════════════════
   FORGOT PASSWORD FORM
══════════════════════════════════════════════════ */
const forgotForm = $('forgotForm');
if (forgotForm) {
  forgotForm.addEventListener('submit', e => {
    e.preventDefault();
    clearErr('forgotEmailErr');
    const email = ($('forgotEmail') || {}).value?.trim() || '';
    if (!email)             { setErr('forgotEmailErr', 'Email is required.'); markInput('forgotEmail', true); return; }
    if (!validEmail(email)) { setErr('forgotEmailErr', 'Enter a valid email address.'); markInput('forgotEmail', true); return; }
    markInput('forgotEmail', false);
    setLoading('forgotSubmitBtn', true);
    setTimeout(() => {
      toast('Reset link sent to ' + email + ' (demo mode)', 'info');
      setLoading('forgotSubmitBtn', false);
      showView('viewLogin');
    }, 800);
  });
}

/* ══════════════════════════════════════════════════
   GOOGLE SIGN-IN
   Strategy:
   1. Load GSI library
   2. Try One Tap prompt (works on https / registered domains)
   3. If One Tap is blocked/skipped → inject a real Google Sign-In
      button into an overlay (this ALWAYS shows account picker,
      including on localhost, as long as the Client ID is valid
      and the origin is registered in Google Cloud Console)
══════════════════════════════════════════════════ */
let _gsiLoaded = false;
let _gsiLoadCallbacks = [];

function loadGSI(cb) {
  if (_gsiLoaded && window.google?.accounts) { cb(); return; }
  _gsiLoadCallbacks.push(cb);
  if (_gsiLoadCallbacks.length > 1) return; // already loading
  const s = document.createElement('script');
  s.src   = 'https://accounts.google.com/gsi/client';
  s.async = true;
  s.defer = true;
  s.onload = () => {
    _gsiLoaded = true;
    _gsiLoadCallbacks.forEach(fn => fn());
    _gsiLoadCallbacks = [];
  };
  s.onerror = () => {
    toast('Could not load Google Sign-In. Check your connection.', 'error');
    _gsiLoadCallbacks = [];
  };
  document.head.appendChild(s);
}

function handleGoogleCredential(response) {
  try {
    const parts   = response.credential.split('.');
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    saveSession({
      uid:      payload.sub,
      name:     payload.name     || payload.email.split('@')[0],
      email:    payload.email    || '',
      photoURL: payload.picture  || '',
      provider: 'google',
    });
    toast('Signed in as ' + (payload.name || payload.email));
    redirectAfterLogin();
  } catch (err) {
    console.error('[Auth] Google token decode failed', err);
    toast('Google sign-in failed. Try again.', 'error');
  }
}

/* 
 * Shows a proper Google Sign-In button in an overlay.
 * This DOES display the account picker with your signed-in Gmail accounts
 * as long as:
 *   - Your GOOGLE_CLIENT_ID is correct
 *   - The page's origin (e.g. http://localhost:3000) is listed under
 *     "Authorized JavaScript origins" in Google Cloud Console → APIs → Credentials
 */
function showGoogleButtonOverlay() {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed;inset:0;z-index:9999',
    'display:flex;align-items:center;justify-content:center',
    'background:rgba(0,0,0,.7);backdrop-filter:blur(8px)',
  ].join(';');

  const box = document.createElement('div');
  box.style.cssText = [
    'background:#111827;border:1px solid rgba(0,224,255,.2)',
    'border-radius:16px;padding:32px 28px;width:360px',
    'font-family:Inter,sans-serif;box-shadow:0 8px 48px rgba(0,0,0,.6),0 0 40px rgba(0,224,255,.06)',
    'display:flex;flex-direction:column;align-items:center;gap:20px',
  ].join(';');

  const title = document.createElement('div');
  title.style.cssText = 'font-size:16px;font-weight:700;color:#e8f4f8;letter-spacing:-.3px';
  title.textContent   = 'Choose a Google account';

  const btnWrap = document.createElement('div');
  btnWrap.id = 'gsi-btn-wrap';

  const cancel = document.createElement('button');
  cancel.style.cssText = [
    'width:100%;padding:10px;border-radius:9px',
    'background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1)',
    'color:#8bb5c5;font-size:13px;font-family:inherit;cursor:pointer',
  ].join(';');
  cancel.textContent = 'Cancel';

  box.appendChild(title);
  box.appendChild(btnWrap);
  box.appendChild(cancel);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  const close = () => document.body.contains(overlay) && document.body.removeChild(overlay);
  cancel.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });

  /* Render the real Google button — this triggers the account picker */
  window.google.accounts.id.renderButton(btnWrap, {
    theme:     'outline',
    size:      'large',
    width:     300,
    text:      'signin_with',
    logo_alignment: 'left',
  });

  /* Also try One Tap in case user hasn't dismissed it */
  window.google.accounts.id.prompt(notification => {
    /* If One Tap succeeds the credential callback fires — close the overlay */
    if (notification.getMomentType?.() === 'skipped') {
      /* One Tap skipped; the renderButton will handle it */
    }
  });
}

function triggerGoogle() {
  loadGSI(() => {
    try {
      window.google.accounts.id.initialize({
        client_id:            GOOGLE_CLIENT_ID,
        callback:             handleGoogleCredential,
        auto_select:          false,
        cancel_on_tap_outside: true,
        ux_mode:              'popup', // popup works on localhost
      });
      showGoogleButtonOverlay();
    } catch (err) {
      console.error('[Auth] GSI init error', err);
      showGoogleFallback();
    }
  });
}

/* Last-resort demo fallback (only if GSI script fails to load) */
function showGoogleFallback() {
  showDemoModal({
    title: 'Google Sign-In',
    accentColor: '#4285F4',
    fields: [
      { id: 'demoGName',  label: 'Full name',     placeholder: 'Alex Johnson',   type: 'text'  },
      { id: 'demoGEmail', label: 'Email address', placeholder: 'you@gmail.com',  type: 'email' },
    ],
    onSubmit(vals) {
      saveSession({
        uid:      'google_demo_' + Date.now(),
        name:     vals[0],
        email:    vals[1],
        photoURL: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(vals[0]) + '&background=4285F4&color=fff&size=128',
        provider: 'google',
      });
      toast('Signed in with Google as ' + vals[0]);
      redirectAfterLogin();
    },
  });
}

/* ══════════════════════════════════════════════════
   GITHUB SIGN-IN
══════════════════════════════════════════════════ */
function isGitHubConfigured() {
  return !!GITHUB_CLIENT_ID && GITHUB_CLIENT_ID !== 'YOUR_GITHUB_CLIENT_ID';
}

function triggerGitHub() {
  if (!isGitHubConfigured()) {
    showGitHubFallback();
    return;
  }
  const state    = Math.random().toString(36).slice(2);
  const redirect = encodeURIComponent(window.location.origin + window.location.pathname + '?provider=github');
  sessionStorage.setItem('github_oauth_state', state);
  window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirect}&scope=user:email&state=${state}`;
}

function showGitHubFallback() {
  showDemoModal({
    title: 'GitHub Sign-In',
    accentColor: '#6e5494',
    fields: [
      { id: 'demoGHUser',  label: 'GitHub username', placeholder: 'octocat',       type: 'text'  },
      { id: 'demoGHEmail', label: 'Email address',   placeholder: 'you@github.com', type: 'email' },
    ],
    onSubmit(vals) {
      saveSession({
        uid:      'github_demo_' + Date.now(),
        name:     vals[0],
        username: vals[0],
        email:    vals[1],
        photoURL: `https://github.com/${vals[0]}.png?size=128`,
        provider: 'github',
      });
      toast('Signed in with GitHub as @' + vals[0]);
      redirectAfterLogin();
    },
  });
}

/* GitHub OAuth callback */
(function handleGitHubCallback() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('provider') !== 'github' || !params.get('code')) return;
  const code  = params.get('code');
  const state = params.get('state');
  const saved = sessionStorage.getItem('github_oauth_state');
  if (state !== saved) { toast('GitHub auth state mismatch.', 'error'); return; }
  toast('Completing GitHub sign-in…', 'info');
  fetch('https://interviewai-production-8f80.up.railway.app/auth/github/callback?code=' + code)
    .then(r => r.json())
    .then(data => {
      if (!data.email) throw new Error('No email');
      saveSession({ uid: 'github_' + data.id, name: data.name || data.login, username: data.login, email: data.email, photoURL: data.avatar_url || '', provider: 'github' });
      toast('Signed in with GitHub');
      redirectAfterLogin(800);
    })
    .catch(err => { console.error('[Auth] GitHub callback error', err); toast('GitHub sign-in failed.', 'error'); });
}());

/* Wire social buttons */
['googleLoginBtn', 'googleSignupBtn'].forEach(id => {
  const btn = $(id);
  if (btn) btn.addEventListener('click', triggerGoogle);
});
['githubLoginBtn', 'githubSignupBtn'].forEach(id => {
  const btn = $(id);
  if (btn) btn.addEventListener('click', triggerGitHub);
});

/* ══════════════════════════════════════════════════
   GENERIC DEMO MODAL  (dark theme)
══════════════════════════════════════════════════ */
function showDemoModal({ title, accentColor, fields, onSubmit }) {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.7);backdrop-filter:blur(8px)';

  const fieldHTML = fields.map(f =>
    `<div style="margin-bottom:14px">
      <label style="font-size:12px;font-weight:500;color:#8bb5c5;display:block;margin-bottom:5px">${f.label}</label>
      <input id="${f.id}" type="${f.type}" placeholder="${f.placeholder}"
        style="width:100%;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#e8f4f8;font-size:14px;font-family:inherit;outline:none;box-sizing:border-box"/>
    </div>`
  ).join('');

  overlay.innerHTML = `
    <div style="background:#111827;border:1px solid rgba(0,224,255,.15);border-radius:16px;padding:32px;width:360px;font-family:Inter,sans-serif;box-shadow:0 8px 48px rgba(0,0,0,.6)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <div style="width:8px;height:8px;border-radius:50%;background:${accentColor || '#00e0ff'}"></div>
        <span style="font-size:16px;font-weight:700;color:#e8f4f8">${title}</span>
      </div>
      <p style="font-size:12.5px;color:#fb923c;background:rgba(251,146,60,.08);border:1px solid rgba(251,146,60,.2);border-radius:8px;padding:8px 12px;margin-bottom:16px">
        Demo mode — enter any details to continue
      </p>
      ${fieldHTML}
      <button id="demoSubmit" style="width:100%;padding:11px;border-radius:9px;background:linear-gradient(135deg,#00e0ff,#00b8d4);border:none;color:#0a0f1a;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;margin-bottom:8px">Continue →</button>
      <button id="demoCancel" style="width:100%;padding:10px;border-radius:9px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);color:#8bb5c5;font-size:13px;font-family:inherit;cursor:pointer">Cancel</button>
    </div>`;

  document.body.appendChild(overlay);

  overlay.querySelector('#demoSubmit').addEventListener('click', () => {
    const vals = fields.map(f => {
      const el = overlay.querySelector('#' + f.id);
      el.style.borderColor = '';
      return el?.value.trim() || '';
    });
    let ok = true;
    fields.forEach((f, i) => {
      if (!vals[i]) {
        overlay.querySelector('#' + f.id).style.borderColor = '#f87171';
        ok = false;
      }
    });
    if (!ok) return;
    document.body.removeChild(overlay);
    onSubmit(vals);
  });

  overlay.querySelector('#demoCancel').addEventListener('click', () => document.body.removeChild(overlay));
  overlay.addEventListener('click', e => { if (e.target === overlay) document.body.removeChild(overlay); });
  setTimeout(() => { const first = overlay.querySelector('input'); if (first) first.focus(); }, 80);
}

/* ── Utility ─────────────────────────────────────── */
function safeJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

/* ── Init ────────────────────────────────────────── */
showView('viewLogin');