/* ============================================================
   INTERVIEW AI — profile.js
   Complete production-ready JS for profile page
   ============================================================ */

'use strict';

/* ═══════════════════════════════════════════════════════════
   STATE
═══════════════════════════════════════════════════════════ */
const State = {
  user:     null,
  history:  [],
  editing:  false,
  pwOpen:   false,
};

/* ═══════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════ */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#00f5ff,#7c3aed)',
  'linear-gradient(135deg,#f43f5e,#7c3aed)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f59e0b,#f43f5e)',
  'linear-gradient(135deg,#3b82f6,#7c3aed)',
  'linear-gradient(135deg,#00f5ff,#10b981)',
  'linear-gradient(135deg,#fbbf24,#f97316)',
  'linear-gradient(135deg,#a855f7,#ec4899)',
  'linear-gradient(135deg,#06b6d4,#6366f1)',
  'linear-gradient(135deg,#84cc16,#06b6d4)',
];

const ACHIEVEMENTS = [
  {
    id: 'first_interview',
    icon: '🎤',
    name: 'First Take',
    desc: 'Complete your first interview',
    check: (h) => h.length >= 1,
    accent: '#00f5ff',
  },
  {
    id: 'high_confidence',
    icon: '💡',
    name: 'Confident',
    desc: 'Score 80%+ confidence',
    check: (h) => h.some(s => (s.confidence_score || 0) >= 80),
    accent: '#fbbf24',
  },
  {
    id: 'selected',
    icon: '🏆',
    name: 'Selected!',
    desc: 'Get "Selected" result',
    check: (h) => h.some(s => (s.interview_result || '').toLowerCase().includes('selected') && !s.interview_result.toLowerCase().includes('not')),
    accent: '#10b981',
  },
  {
    id: 'five_sessions',
    icon: '🔥',
    name: 'On Fire',
    desc: 'Complete 5 interviews',
    check: (h) => h.length >= 5,
    accent: '#f97316',
  },
  {
    id: 'ten_sessions',
    icon: '⚡',
    name: 'Veteran',
    desc: 'Complete 10 interviews',
    check: (h) => h.length >= 10,
    accent: '#7c3aed',
  },
  {
    id: 'low_stress',
    icon: '🧘',
    name: 'Zen Mode',
    desc: 'Get Low stress 3 times',
    check: (h) => h.filter(s => (s.stress_level || '').toLowerCase() === 'low').length >= 3,
    accent: '#06b6d4',
  },
  {
    id: 'perfect_technical',
    icon: '⚙️',
    name: 'Engineer',
    desc: 'Score 10/10 technical',
    check: (h) => h.some(s => (s.Technical_Correctness || 0) >= 10),
    accent: '#3b82f6',
  },
  {
    id: 'streak_3',
    icon: '📅',
    name: '3-Day Streak',
    desc: '3 days in a row',
    check: (h, streak) => streak >= 3,
    accent: '#ec4899',
  },
  {
    id: 'consistent',
    icon: '🌟',
    name: 'Consistent',
    desc: 'Avg confidence > 70%',
    check: (h) => {
      if (h.length < 3) return false;
      const avg = h.reduce((s, x) => s + (x.confidence_score || 0), 0) / h.length;
      return avg >= 70;
    },
    accent: '#a855f7',
  },
];

/* ═══════════════════════════════════════════════════════════
   UTILS
═══════════════════════════════════════════════════════════ */
function safeGet(key, fallback = null) {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function initials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function animCounter(el, target, suffix = '', duration = 700) {
  if (!el) return;
  const from  = parseInt(el.textContent) || 0;
  const start = performance.now();
  const step = ts => {
    const p = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
    const cur = Math.round(from + (target - from) * eased);
    el.textContent = cur + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

let toastTimer;
function showToast(msg, type = 'info') {
  const t = document.getElementById('toastProfile');
  if (!t) return;
  const colors = { success: '#10b981', error: '#f43f5e', info: '#00f5ff', warn: '#fbbf24' };
  t.style.borderLeftColor = colors[type] || colors.info;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ═══════════════════════════════════════════════════════════
   LOAD & COMPUTE DATA
═══════════════════════════════════════════════════════════ */
function loadData() {
  State.user = safeGet('interviewai_user') || {
    name: 'Guest User',
    email: 'guest@interviewai.com',
    role: '',
    target: '',
    exp: '',
    bio: '',
    plan: 'Free',
    joined: new Date().toISOString(),
    avatarGradient: AVATAR_GRADIENTS[0],
    password: 'demo1234',
  };

  // Ensure password exists for demo
  if (!State.user.password) State.user.password = 'demo1234';

  State.history = safeGet('interviewai_history') || injectDemoHistory();
}

function injectDemoHistory() {
  // If no real history, build minimal demo data for display
  return [
    {
      confidence_score: 62, stress_level: 'Medium',
      interview_result: 'Not Selected', Technical_Correctness: 6,
      Communication_Score: 7, Grammar_Score: 6, Filler_Words: 5,
      date: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
    {
      confidence_score: 74, stress_level: 'Low',
      interview_result: 'Selected', Technical_Correctness: 8,
      Communication_Score: 8, Grammar_Score: 8, Filler_Words: 2,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      confidence_score: 81, stress_level: 'Low',
      interview_result: 'Selected', Technical_Correctness: 9,
      Communication_Score: 9, Grammar_Score: 8, Filler_Words: 1,
      date: new Date(Date.now() - 86400000).toISOString(),
    },
  ];
}

function computeStreak() {
  if (!State.history.length) return 0;
  const sorted = [...State.history]
    .filter(h => h.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  let streak = 0;
  let prev = new Date(); prev.setHours(0,0,0,0);

  for (const h of sorted) {
    const d = new Date(h.date); d.setHours(0,0,0,0);
    const diff = (prev - d) / 86400000;
    if (diff <= 1) { streak++; prev = d; }
    else break;
  }
  return streak;
}

function computeAvgConf() {
  if (!State.history.length) return 0;
  const total = State.history.reduce((s, h) => s + (h.confidence_score || 0), 0);
  return Math.round(total / State.history.length);
}

function countSelected() {
  return State.history.filter(h =>
    (h.interview_result || '').toLowerCase().includes('selected') &&
    !h.interview_result.toLowerCase().includes('not')
  ).length;
}

/* ═══════════════════════════════════════════════════════════
   RENDER FUNCTIONS
═══════════════════════════════════════════════════════════ */
function renderHero() {
  const u = State.user;

  // Avatar
  const avatarEls = [document.getElementById('profileAvatar'), document.getElementById('avatarSm')];
  avatarEls.forEach(el => { if (el) el.textContent = initials(u.name); });

  const mainAvatar = document.getElementById('profileAvatar');
  if (mainAvatar) mainAvatar.style.background = u.avatarGradient || AVATAR_GRADIENTS[0];

  const smAvatar = document.getElementById('avatarSm');
  if (smAvatar) smAvatar.style.background = u.avatarGradient || AVATAR_GRADIENTS[0];

  // Names & emails
  setEl('heroName', u.name || 'Guest User');
  setEl('heroEmail', u.email || '—');
  setEl('sidebarUserName', u.name || 'Guest');
  setEl('sidebarUserEmail', u.email || '—');

  // Badges
  const planBadge = document.getElementById('heroPlanBadge');
  if (planBadge) planBadge.textContent = (u.plan || 'Free') + ' Plan';

  const streak = computeStreak();
  const streakBadge = document.getElementById('heroStreakBadge');
  if (streakBadge) streakBadge.textContent = `🔥 ${streak} day streak`;
}

function renderInfoView() {
  const u = State.user;
  setEl('infoName',   u.name   || '—');
  setEl('infoEmail',  u.email  || '—');
  setEl('infoRole',   u.role   || '—');
  setEl('infoTarget', u.target || '—');
  setEl('infoExp',    u.exp    ? u.exp + ' years' : '—');
  setEl('infoBio',    u.bio    || '—');
}

function renderStats() {
  const streak  = computeStreak();
  const avgConf = computeAvgConf();
  const selected = countSelected();

  animCounter(document.getElementById('statInterviews'), State.history.length);
  animCounter(document.getElementById('statSelected'),   selected);
  animCounter(document.getElementById('statStreak'),     streak);

  const confEl = document.getElementById('statAvgConf');
  if (confEl) {
    const start = performance.now();
    const step = ts => {
      const p = Math.min((ts - start) / 700, 1);
      confEl.textContent = Math.round(avgConf * p) + '%';
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const joinedEl = document.getElementById('statJoined');
  if (joinedEl) joinedEl.textContent = formatDate(State.user.joined);
}

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;

  const streak = computeStreak();
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const earned = a.check(State.history, streak);
    return `
      <div class="achievement-item ${earned ? 'earned' : 'ach-locked'}"
           style="${earned ? `--accent-color:${a.accent}` : ''}">
        <div class="ach-icon">${earned ? a.icon : '🔒'}</div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
      </div>`;
  }).join('');
}

function renderPerformanceBars() {
  const container = document.getElementById('perfBars');
  if (!container) return;

  if (!State.history.length) {
    container.innerHTML = '<p style="color:var(--muted);font-size:12px">Complete interviews to see your performance snapshot.</p>';
    return;
  }

  const avg = field => {
    const vals = State.history.map(h => parseFloat(h[field] || 0));
    return vals.reduce((s, v) => s + v, 0) / vals.length;
  };

  const bars = [
    {
      label: 'Confidence',
      val: Math.round(avg('confidence_score')),
      max: 100,
      suffix: '%',
      color: 'linear-gradient(90deg,#00f5ff,#7c3aed)',
    },
    {
      label: 'Technical',
      val: Math.round(avg('Technical_Correctness') * 10),
      max: 100,
      suffix: '%',
      color: 'linear-gradient(90deg,#3b82f6,#7c3aed)',
    },
    {
      label: 'Communication',
      val: Math.round(avg('Communication_Score') * 10),
      max: 100,
      suffix: '%',
      color: 'linear-gradient(90deg,#10b981,#3b82f6)',
    },
    {
      label: 'Grammar',
      val: Math.round(avg('Grammar_Score') * 10),
      max: 100,
      suffix: '%',
      color: 'linear-gradient(90deg,#f59e0b,#f43f5e)',
    },
  ];

  container.innerHTML = bars.map(b => {
    const valColor = b.val >= 70 ? 'var(--green)' : b.val >= 40 ? 'var(--yellow)' : 'var(--pink)';
    return `
      <div class="perf-bar-item">
        <div class="perf-bar-row">
          <span class="perf-bar-label">${b.label}</span>
          <span class="perf-bar-val" style="color:${valColor}">${b.val}${b.suffix}</span>
        </div>
        <div class="perf-bar-track">
          <div class="perf-bar-fill"
               style="background:${b.color}"
               data-target="${(b.val / b.max) * 100}">
          </div>
        </div>
      </div>`;
  }).join('');

  // Animate bars
  requestAnimationFrame(() => {
    container.querySelectorAll('.perf-bar-fill').forEach(bar => {
      setTimeout(() => { bar.style.width = bar.dataset.target + '%'; }, 100);
    });
  });
}

function renderTaskBadge() {
  const tasks   = safeGet('interviewai_daily_tasks') || [];
  const pending = tasks.filter(t => !t.done).length;
  const badge   = document.getElementById('taskBadge');
  if (!badge) return;
  badge.textContent = pending > 0 ? pending : '';
  badge.style.display = pending > 0 ? 'inline-block' : 'none';
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ═══════════════════════════════════════════════════════════
   EDIT PROFILE
═══════════════════════════════════════════════════════════ */
function populateEditForm() {
  const u = State.user;
  setVal('editName',   u.name   || '');
  setVal('editEmail',  u.email  || '');
  setVal('editRole',   u.role   || '');
  setVal('editTarget', u.target || '');
  setVal('editExp',    u.exp    || '');
  setVal('editBio',    u.bio    || '');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val;
}

function openEditForm() {
  State.editing = true;
  populateEditForm();
  document.getElementById('viewMode').style.display = 'none';
  document.getElementById('editForm').style.display  = 'flex';
  document.getElementById('btnEditProfile').textContent = '✕ Cancel Edit';
}

function closeEditForm() {
  State.editing = false;
  document.getElementById('viewMode').style.display = 'block';
  document.getElementById('editForm').style.display  = 'none';
  document.getElementById('btnEditProfile').innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
    Edit Profile`;
}

function saveProfile() {
  const name   = document.getElementById('editName')?.value.trim();
  const email  = document.getElementById('editEmail')?.value.trim();
  const role   = document.getElementById('editRole')?.value.trim();
  const target = document.getElementById('editTarget')?.value.trim();
  const exp    = document.getElementById('editExp')?.value.trim();
  const bio    = document.getElementById('editBio')?.value.trim();

  if (!name) { showToast('Name cannot be empty.', 'error'); return; }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Enter a valid email address.', 'error'); return;
  }

  State.user = { ...State.user, name, email, role, target, exp, bio };
  safeSet('interviewai_user', State.user);

  renderHero();
  renderInfoView();
  closeEditForm();
  showToast('Profile updated successfully!', 'success');
}

/* ═══════════════════════════════════════════════════════════
   CHANGE PASSWORD
═══════════════════════════════════════════════════════════ */
function openPwForm() {
  State.pwOpen = true;
  document.getElementById('pwForm').style.display      = 'flex';
  document.getElementById('btnChangePw').style.display = 'none';
}

function closePwForm() {
  State.pwOpen = false;
  document.getElementById('pwForm').style.display      = 'none';
  document.getElementById('btnChangePw').style.display = 'block';
  clearPwFields();
  document.getElementById('pwStrengthWrap').style.display = 'none';
}

function clearPwFields() {
  ['pwCurrent','pwNew','pwConfirm'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function checkPwStrength(pw) {
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0–5
}

function savePassword() {
  const current  = document.getElementById('pwCurrent')?.value;
  const newPw    = document.getElementById('pwNew')?.value;
  const confirm  = document.getElementById('pwConfirm')?.value;

  if (!current) { showToast('Enter your current password.', 'error'); return; }
  if (current !== (State.user.password || 'demo1234')) {
    showToast('Current password is incorrect.', 'error'); return;
  }
  if (!newPw || newPw.length < 8) {
    showToast('New password must be at least 8 characters.', 'error'); return;
  }
  if (newPw !== confirm) {
    showToast('Passwords do not match.', 'error'); return;
  }

  State.user.password = newPw;
  safeSet('interviewai_user', State.user);
  closePwForm();
  showToast('Password updated successfully!', 'success');
}

/* ═══════════════════════════════════════════════════════════
   DELETE ACCOUNT MODAL
═══════════════════════════════════════════════════════════ */
function openDeleteModal() {
  document.getElementById('deleteModal').classList.add('active');
  document.getElementById('deleteConfirmPw').value = '';
  document.getElementById('deletePwError').style.display = 'none';
}

function closeDeleteModal() {
  document.getElementById('deleteModal').classList.remove('active');
}

function confirmDeleteAccount() {
  const pw = document.getElementById('deleteConfirmPw')?.value;
  const errEl = document.getElementById('deletePwError');

  if (!pw) {
    if (errEl) { errEl.textContent = 'Please enter your password.'; errEl.style.display = 'block'; }
    return;
  }

  if (pw !== (State.user.password || 'demo1234')) {
    if (errEl) { errEl.style.display = 'block'; }
    return;
  }

  // Delete all user data
  const KEYS_TO_DELETE = [
    'interviewai_user',
    'interviewai_history',
    'interviewai_daily_tasks',
    'interviewai_completed_plans',
    'interviewai_leaderboard',
    'interviewai_recommendations',
  ];
  KEYS_TO_DELETE.forEach(k => { try { localStorage.removeItem(k); } catch {} });

  showToast('Account deleted. Redirecting…', 'info');
  setTimeout(() => { window.location.href = 'landing.html'; }, 1400);
}

/* ═══════════════════════════════════════════════════════════
   AVATAR COLOUR PICKER
═══════════════════════════════════════════════════════════ */
function buildAvatarPicker() {
  const grid = document.getElementById('avatarColorGrid');
  if (!grid) return;

  AVATAR_GRADIENTS.forEach((grad, i) => {
    const sw = document.createElement('div');
    sw.className = 'avatar-color-swatch';
    sw.style.background = grad;
    if (grad === (State.user.avatarGradient || AVATAR_GRADIENTS[0])) sw.classList.add('selected');
    sw.addEventListener('click', () => {
      State.user.avatarGradient = grad;
      safeSet('interviewai_user', State.user);

      // Update avatars
      const main = document.getElementById('profileAvatar');
      const sm   = document.getElementById('avatarSm');
      if (main) main.style.background = grad;
      if (sm)   sm.style.background   = grad;

      // Update selected state
      grid.querySelectorAll('.avatar-color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      showToast('Avatar colour updated!', 'success');
    });
    grid.appendChild(sw);
  });
}

function positionPicker() {
  const btn    = document.getElementById('avatarEditBtn');
  const picker = document.getElementById('avatarPicker');
  if (!btn || !picker) return;
  const rect = btn.getBoundingClientRect();
  picker.style.top  = (rect.bottom + 8 + window.scrollY) + 'px';
  picker.style.left = (rect.left - 60 + window.scrollX) + 'px';
}

/* ═══════════════════════════════════════════════════════════
   PASSWORD VISIBILITY TOGGLES
═══════════════════════════════════════════════════════════ */
function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR MOBILE TOGGLE
═══════════════════════════════════════════════════════════ */
function initSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const menuBtn  = document.getElementById('mobileMenuBtn');
  const logout   = document.getElementById('logoutLink');

  const open  = () => { sidebar?.classList.add('mobile-open'); overlay?.classList.add('open'); };
  const close = () => { sidebar?.classList.remove('mobile-open'); overlay?.classList.remove('open'); };

  menuBtn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);

  logout?.addEventListener('click', e => {
    e.preventDefault();
    safeSet('interviewai_user', null);
    showToast('Logged out successfully', 'info');
    setTimeout(() => { window.location.href = 'landing.html'; }, 900);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });
}

/* ═══════════════════════════════════════════════════════════
   EVENT LISTENERS
═══════════════════════════════════════════════════════════ */
function initEventListeners() {
  // Edit Profile toggle
  document.getElementById('btnEditProfile')?.addEventListener('click', () => {
    State.editing ? closeEditForm() : openEditForm();
  });

  // Save profile
  document.getElementById('btnSaveProfile')?.addEventListener('click', saveProfile);

  // Cancel edit
  document.getElementById('btnCancelEdit')?.addEventListener('click', closeEditForm);

  // Change password button
  document.getElementById('btnChangePw')?.addEventListener('click', openPwForm);

  // Save password
  document.getElementById('btnSavePw')?.addEventListener('click', savePassword);

  // Cancel password
  document.getElementById('btnCancelPw')?.addEventListener('click', closePwForm);

  // Password strength meter
  document.getElementById('pwNew')?.addEventListener('input', function () {
    const wrap  = document.getElementById('pwStrengthWrap');
    const fill  = document.getElementById('pwStrengthFill');
    const label = document.getElementById('pwStrengthLabel');

    if (!this.value) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';

    const score = checkPwStrength(this.value);
    const levels = [
      { pct: 20,  color: '#f43f5e', text: 'Very Weak' },
      { pct: 40,  color: '#f97316', text: 'Weak' },
      { pct: 60,  color: '#fbbf24', text: 'Fair' },
      { pct: 80,  color: '#10b981', text: 'Strong' },
      { pct: 100, color: '#00f5ff', text: 'Very Strong' },
    ];
    const level = levels[Math.min(score - 1, 4)] || levels[0];
    fill.style.width      = level.pct + '%';
    fill.style.background = level.color;
    label.textContent     = level.text;
    label.style.color     = level.color;
  });

  // Delete account
  document.getElementById('btnDeleteAccount')?.addEventListener('click', openDeleteModal);
  document.getElementById('btnCancelDelete')?.addEventListener('click', closeDeleteModal);
  document.getElementById('btnConfirmDelete')?.addEventListener('click', confirmDeleteAccount);

  // Close modal on overlay click
  document.getElementById('deleteModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('deleteModal')) closeDeleteModal();
  });

  // Avatar picker
  const avatarEditBtn   = document.getElementById('avatarEditBtn');
  const avatarPicker    = document.getElementById('avatarPicker');
  const avatarPickerClose = document.getElementById('avatarPickerClose');

  avatarEditBtn?.addEventListener('click', () => {
    const isOpen = avatarPicker.classList.contains('open');
    if (isOpen) {
      avatarPicker.classList.remove('open');
    } else {
      positionPicker();
      avatarPicker.classList.add('open');
    }
  });

  avatarPickerClose?.addEventListener('click', () => {
    avatarPicker?.classList.remove('open');
  });

  // Close picker on outside click
  document.addEventListener('click', e => {
    if (avatarPicker?.classList.contains('open') &&
        !avatarPicker.contains(e.target) &&
        e.target !== avatarEditBtn) {
      avatarPicker.classList.remove('open');
    }
  });

  // Form Enter key support
  document.getElementById('editForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      saveProfile();
    }
  });

  document.getElementById('pwForm')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); savePassword(); }
  });

  document.getElementById('deleteConfirmPw')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') confirmDeleteAccount();
  });
}

/* ═══════════════════════════════════════════════════════════
   MAIN INIT
═══════════════════════════════════════════════════════════ */
function init() {
  loadData();

  renderHero();
  renderInfoView();
  renderStats();
  renderAchievements();
  renderPerformanceBars();
  renderTaskBadge();

  buildAvatarPicker();
  initPasswordToggles();
  initSidebar();
  initEventListeners();

  console.log('[InterviewAI] Profile page loaded ✓', {
    user:     State.user.name,
    sessions: State.history.length,
    streak:   computeStreak(),
  });
}

document.addEventListener('DOMContentLoaded', init);