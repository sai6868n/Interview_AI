/* ═══════════════════════════════════════════════════════════════
   leaderboard.js — InterviewAI Leaderboard Module
   Features:
     • Mock data generation (50 seeded players)
     • Top-3 animated podium
     • Full paginated, searchable, sortable, filterable table
     • Period tabs (weekly / monthly / all-time)
     • "My Rank" card with progress bar
     • Score distribution bar chart
     • Real user injection from localStorage
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */
const ROLES = [
  'Software Engineer', 'Data Scientist', 'ML Engineer',
  'Data Analyst', 'Frontend Developer', 'Backend Developer',
  'DevOps Engineer', 'Product Manager', 'Full Stack Dev', 'AI Researcher',
];

const FIRST_NAMES = [
  'Arjun','Priya','Rohan','Ananya','Vikram','Neha','Rahul','Sneha',
  'Amit','Divya','Kiran','Meera','Sanjay','Pooja','Raj','Deepa',
  'Aditya','Kavya','Suresh','Lakshmi','Nikhil','Reshma','Pranav',
  'Swati','Dev','Ritika','Harsh','Nisha','Varun','Isha',
  'Mohammed','Fatima','Ali','Zara','Hassan','Layla',
  'James','Emma','Liam','Olivia','Noah','Ava','Lucas','Mia',
  'Ethan','Sofia','Mason','Charlotte','Logan','Amelia',
];

const LAST_NAMES = [
  'Sharma','Patel','Verma','Singh','Kumar','Gupta','Joshi','Mehta',
  'Khan','Ali','Ahmed','Hassan','Malik','Shah','Ansari',
  'Smith','Johnson','Williams','Brown','Jones','Davis','Wilson',
  'Chen','Wang','Li','Zhang','Liu','Park','Kim','Lee',
];

const STRESS_LEVELS = ['Low', 'Medium', 'High'];
const RESULTS       = ['Selected', 'Not Selected'];

/* ─────────────────────────────────────────────────
   SEEDED RANDOM (reproducible data)
───────────────────────────────────────────────── */
function seededRand(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────────
   GENERATE MOCK PLAYERS
───────────────────────────────────────────────── */
function generatePlayers(seed = 42, count = 50) {
  const rand = seededRand(seed);
  const players = [];

  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES, rand);
    const lastName  = pick(LAST_NAMES, rand);
    const name      = `${firstName} ${lastName}`;
    const role      = pick(ROLES, rand);
    const conf      = Math.round(40 + rand() * 58);   // 40–98
    const stress    = pick(STRESS_LEVELS, rand);
    const result    = rand() > 0.38 ? 'Selected' : 'Not Selected';
    const sessions  = Math.floor(1 + rand() * 24);
    const delta     = Math.floor((rand() - 0.5) * 5); // rank change –3..+3

    players.push({ id: i + 1, name, role, confidence: conf, stress, result, sessions, delta });
  }

  return players;
}

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
const State = {
  period:      'weekly',
  allPlayers:  [],          // sorted master list
  filtered:    [],          // after search/filter
  page:        1,
  perPage:     10,
  sortKey:     'confidence',
  filterResult:'all',
  searchQuery: '',
  currentUser: null,
};

/* ─────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────── */
function $ (id) { return document.getElementById(id); }
function setText(id, v) { const el = $(id); if (el) el.textContent = v; }

function loadUser() {
  try { return JSON.parse(localStorage.getItem('interviewai_user') || 'null'); }
  catch { return null; }
}

function getHistory() {
  try { return JSON.parse(localStorage.getItem('interviewai_history') || '[]'); }
  catch { return []; }
}

function showToast(msg) {
  const t = $('toastLb');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3000);
}

function stressClass(s) {
  return { Low: 'stress-low', Medium: 'stress-medium', High: 'stress-high' }[s] || 'stress-low';
}

function rankNumClass(rank) {
  if (rank === 1) return 'rank-gold';
  if (rank === 2) return 'rank-silver';
  if (rank === 3) return 'rank-bronze';
  return 'rank-other';
}

function rankChangeHTML(delta) {
  if (delta > 0) return `<span class="rank-change rank-up">▲${delta}</span>`;
  if (delta < 0) return `<span class="rank-change rank-down">▼${Math.abs(delta)}</span>`;
  return `<span class="rank-change rank-same">—</span>`;
}

/* ─────────────────────────────────────────────────
   INJECT REAL USER into players
───────────────────────────────────────────────── */
function injectRealUser(players) {
  const user    = loadUser();
  const history = getHistory();
  if (!user) return players;

  const name  = user.name  || 'You';
  const role  = user.role  || 'Software Engineer';
  const total = history.length;

  const conf = total
    ? Math.round(history.reduce((s, h) => s + (h.confidence || 70), 0) / total)
    : 72;

  const lastResult = history.length
    ? (history[history.length - 1].result || 'Selected')
    : 'Selected';

  const stressRaw = total
    ? history.reduce((s, h) => s + (h.stress === 'Low' ? 1 : h.stress === 'High' ? 3 : 2), 0) / total
    : 1.5;
  const stress = stressRaw < 1.8 ? 'Low' : stressRaw > 2.3 ? 'High' : 'Medium';

  // Remove any existing "me" entry
  const cleaned = players.filter(p => !p.isMe);

  // Replace a random player's slot
  const insertAt = Math.floor(Math.random() * Math.min(20, cleaned.length));
  const mePlayer = {
    id: 999,
    name,
    role,
    confidence: conf,
    stress,
    result: lastResult,
    sessions: total,
    delta: 0,
    isMe: true,
  };

  cleaned.splice(insertAt, 0, mePlayer);
  return cleaned;
}

/* ─────────────────────────────────────────────────
   BUILD PLAYERS FOR PERIOD
   (slight variation per period for realism)
───────────────────────────────────────────────── */
function buildPlayers(period) {
  const seeds = { weekly: 42, monthly: 137, alltime: 91 };
  let players = generatePlayers(seeds[period], 50);

  // inject real user
  players = injectRealUser(players);

  // sort by confidence desc
  players.sort((a, b) => b.confidence - a.confidence);

  // assign display rank
  players.forEach((p, i) => { p.rank = i + 1; });

  return players;
}

/* ─────────────────────────────────────────────────
   SIDEBAR / NAV
───────────────────────────────────────────────── */
function initSidebar() {
  const sidebar  = $('sidebar');
  const overlay  = $('sidebarOverlay');
  const menuBtn  = $('mobileMenuBtn');

  if (!sidebar) return;

  const open  = () => { sidebar.classList.add('mobile-open'); overlay.classList.add('open'); };
  const close = () => { sidebar.classList.remove('mobile-open'); overlay.classList.remove('open'); };

  menuBtn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);

  $('logoutLink')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('interviewai_user');
    window.location.href = 'landing.html';
  });
}

/* ─────────────────────────────────────────────────
   RENDER USER INFO (sidebar)
───────────────────────────────────────────────── */
function renderUserInfo() {
  const user  = loadUser();
  const name  = user?.name  || 'Guest User';
  const email = user?.email || 'guest@interviewai.com';
  const inits = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  setText('sidebarUserName', name);
  setText('sidebarUserEmail', email);
  const av = $('avatarSm');
  if (av) av.textContent = inits;

  State.currentUser = user;
}

/* ─────────────────────────────────────────────────
   STATS STRIP
───────────────────────────────────────────────── */
function renderStats(players) {
  const total   = players.length;
  const avgConf = total
    ? Math.round(players.reduce((s, p) => s + p.confidence, 0) / total)
    : 0;
  const topConf = players[0]?.confidence || 0;
  const weekSes = players.reduce((s, p) => s + Math.min(p.sessions, 7), 0);

  setText('statCompetitors', total);
  setText('statAvgConf',     avgConf + '%');
  setText('statWeekly',      weekSes);
  setText('statTopScore',    topConf + '%');
}

/* ─────────────────────────────────────────────────
   PODIUM (TOP 3)
───────────────────────────────────────────────── */
function renderPodium(players) {
  const grid = $('podiumGrid');
  if (!grid) return;

  const top3 = players.slice(0, 3);
  // display order: 2nd, 1st, 3rd for visual "podium" effect
  const display = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumClass = ['podium-2', 'podium-1', 'podium-3'];
  const crowns      = ['🥈', '🥇', '🥉'];
  const badgeClass  = ['rank-badge-2', 'rank-badge-1', 'rank-badge-3'];

  grid.innerHTML = display.map((player, i) => {
    const isCenter  = i === 1; // rank 1 is center
    const meTag     = player.isMe ? '<span class="podium-me-badge">YOU</span>' : '';
    const resultCls = player.result === 'Selected' ? 'chip-selected' : 'chip-not';
    const resultIcon= player.result === 'Selected' ? '✓' : '✗';

    return `
      <div class="${podiumClass[i]} podium-card" style="animation-delay:${0.1 + i * 0.1}s">
        ${meTag}
        <div class="podium-card-bg">
          <div class="podium-bg-glow"></div>
        </div>
        <span class="podium-crown">${crowns[i]}</span>
        <div class="podium-avatar" style="width:${isCenter ? 72 : 60}px;height:${isCenter ? 72 : 60}px;font-size:${isCenter ? 24 : 20}px">
          ${initials(player.name)}
          <div class="podium-rank-badge ${badgeClass[i]}">${player.rank}</div>
        </div>
        <div class="podium-name" style="font-size:${isCenter ? 16 : 14}px">${player.name}</div>
        <div class="podium-role">${player.role}</div>
        <div class="podium-score-row">
          <div class="podium-score-chip">
            <span class="chip-label">Conf</span>
            <span class="chip-val conf-val">${player.confidence}%</span>
          </div>
          <div class="podium-score-chip">
            <span class="chip-label">Stress</span>
            <span class="chip-val" style="color:var(--text2)">${player.stress}</span>
          </div>
        </div>
        <span class="podium-result-chip ${resultCls}">${resultIcon} ${player.result}</span>
      </div>
    `;
  }).join('');
}

/* ─────────────────────────────────────────────────
   FILTER + SORT helpers
───────────────────────────────────────────────── */
function applyFiltersAndSort() {
  let list = [...State.allPlayers];

  // search
  if (State.searchQuery) {
    const q = State.searchQuery.toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  }

  // result filter
  if (State.filterResult === 'selected') {
    list = list.filter(p => p.result === 'Selected');
  } else if (State.filterResult === 'not') {
    list = list.filter(p => p.result === 'Not Selected');
  }

  // sort
  const sorts = {
    confidence: (a, b) => b.confidence - a.confidence,
    stress:     (a, b) => {
      const w = { Low: 1, Medium: 2, High: 3 };
      return w[a.stress] - w[b.stress];
    },
    interviews: (a, b) => b.sessions - a.sessions,
    name:       (a, b) => a.name.localeCompare(b.name),
  };

  list.sort(sorts[State.sortKey] || sorts.confidence);

  State.filtered = list;
  State.page     = 1;
}

/* ─────────────────────────────────────────────────
   RENDER TABLE ROWS
───────────────────────────────────────────────── */
function renderTable() {
  const body = $('lbTableBody');
  if (!body) return;

  const start = (State.page - 1) * State.perPage;
  const end   = start + State.perPage;
  const page  = State.filtered.slice(start, end);

  if (page.length === 0) {
    body.innerHTML = `
      <div class="lb-empty">
        <div class="lb-empty-icon">🔍</div>
        <h3>No results found</h3>
        <p>Try adjusting your search or filter.</p>
      </div>`;
    renderPagination();
    return;
  }

  body.innerHTML = page.map((player, idx) => {
    const globalRank = start + idx + 1;
    const rankCls    = rankNumClass(player.rank);
    const stressCls  = stressClass(player.stress);
    const resultCls  = player.result === 'Selected' ? 'chip-selected' : 'chip-not';
    const resultIcon = player.result === 'Selected' ? '✓' : '✗';
    const meCls      = player.isMe ? 'is-me' : '';

    return `
      <div class="lb-row ${meCls}" style="animation-delay:${idx * 0.03}s">
        <div class="rank-cell">
          <div class="rank-num ${rankCls}">${globalRank}</div>
          ${rankChangeHTML(player.delta)}
        </div>
        <div class="user-cell">
          <div class="row-avatar">${initials(player.name)}</div>
          <div>
            <div class="row-name">${player.name}</div>
            <div class="row-role">${player.role}</div>
          </div>
        </div>
        <div class="conf-cell">
          <div class="conf-val-row">
            <span class="conf-num">${player.confidence}%</span>
            <div class="conf-bar-track">
              <div class="conf-bar-fill" style="width:${player.confidence}%"></div>
            </div>
          </div>
        </div>
        <div>
          <span class="stress-chip ${stressCls}">${player.stress}</span>
        </div>
        <div>
          <span class="result-chip ${resultCls}">${resultIcon} ${player.result}</span>
        </div>
        <div class="interviews-val">${player.sessions}</div>
      </div>
    `;
  }).join('');

  renderPagination();
}

/* ─────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────── */
function renderPagination() {
  const total     = State.filtered.length;
  const totalPages= Math.ceil(total / State.perPage);
  const start     = total === 0 ? 0 : (State.page - 1) * State.perPage + 1;
  const end       = Math.min(State.page * State.perPage, total);

  setText('paginationInfo', `Showing ${start}–${end} of ${total}`);

  const btns = $('pageBtns');
  if (!btns) return;

  let html = `
    <button class="page-btn" id="prevPage" ${State.page <= 1 ? 'disabled' : ''}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    </button>`;

  const range = pageRange(State.page, totalPages);
  range.forEach(p => {
    if (p === '…') {
      html += `<span class="page-btn" style="cursor:default;opacity:0.4">…</span>`;
    } else {
      html += `<button class="page-btn ${p === State.page ? 'active' : ''}" data-page="${p}">${p}</button>`;
    }
  });

  html += `
    <button class="page-btn" id="nextPage" ${State.page >= totalPages ? 'disabled' : ''}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    </button>`;

  btns.innerHTML = html;

  btns.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      State.page = parseInt(btn.dataset.page, 10);
      renderTable();
    });
  });

  $('prevPage')?.addEventListener('click', () => {
    if (State.page > 1) { State.page--; renderTable(); }
  });

  $('nextPage')?.addEventListener('click', () => {
    if (State.page < totalPages) { State.page++; renderTable(); }
  });
}

function pageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '…', total];
  if (current >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total];
  return [1, '…', current-1, current, current+1, '…', total];
}

/* ─────────────────────────────────────────────────
   MY RANK CARD
───────────────────────────────────────────────── */
function renderMyRank(players) {
  const me = players.find(p => p.isMe);
  if (!me) {
    setText('myRankPos', '#—');
    return;
  }

  setText('myRankPos', `#${me.rank}`);
  setText('myConf',    me.confidence + '%');
  setText('myStress',  me.stress);
  setText('mySessions', me.sessions);
  setText('myResult',  me.result === 'Selected' ? '✓ Pass' : '✗ Fail');

  // progress to next rank
  if (me.rank > 1) {
    const above    = players[me.rank - 2]; // rank above
    const myConf   = me.confidence;
    const aboveConf= above?.confidence || myConf + 5;
    const gap      = aboveConf - myConf;
    const pct      = Math.max(0, Math.min(100, Math.round((1 - gap / 20) * 100)));

    setTimeout(() => {
      const fill = $('rankProgressFill');
      if (fill) fill.style.width = pct + '%';
    }, 400);

    setText('rankProgressPct',  pct + '%');
    setText('rankProgressHint', `${gap > 0 ? `+${gap.toFixed(1)}% confidence needed to reach #${me.rank - 1}` : 'You\'re at the top!'}`);
  } else {
    setText('rankProgressPct',  '100%');
    setText('rankProgressHint', '🏆 You\'re currently #1!');
    const fill = $('rankProgressFill');
    if (fill) setTimeout(() => { fill.style.width = '100%'; }, 400);
  }
}

/* ─────────────────────────────────────────────────
   SCORE DISTRIBUTION CHART
───────────────────────────────────────────────── */
function renderDistribution(players) {
  const distBars = $('distBars');
  if (!distBars) return;

  // Buckets: 40–49, 50–59, 60–69, 70–79, 80–89, 90–98
  const buckets = [
    { label: '40–49', min: 40, max: 49, count: 0 },
    { label: '50–59', min: 50, max: 59, count: 0 },
    { label: '60–69', min: 60, max: 69, count: 0 },
    { label: '70–79', min: 70, max: 79, count: 0 },
    { label: '80–89', min: 80, max: 89, count: 0 },
    { label: '90+',   min: 90, max: 100,count: 0 },
  ];

  players.forEach(p => {
    const b = buckets.find(bk => p.confidence >= bk.min && p.confidence <= bk.max);
    if (b) b.count++;
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const me       = players.find(p => p.isMe);
  const myBucket = me
    ? buckets.find(b => me.confidence >= b.min && me.confidence <= b.max)
    : null;

  const colors = [
    'linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.5))',
    'linear-gradient(180deg,#7c3aed,rgba(124,58,237,0.5))',
    'linear-gradient(180deg,#00f5ff,rgba(0,245,255,0.5))',
    'linear-gradient(180deg,#10b981,rgba(16,185,129,0.5))',
    'linear-gradient(180deg,#f59e0b,rgba(245,158,11,0.5))',
    'linear-gradient(180deg,#f43f5e,rgba(244,63,94,0.5))',
  ];

  distBars.innerHTML = buckets.map((b, i) => {
    const heightPct = Math.round((b.count / maxCount) * 100);
    const isMe      = b === myBucket;
    const bg        = isMe
      ? 'linear-gradient(180deg,#fbbf24,rgba(251,191,36,0.5))'
      : colors[i];

    return `
      <div class="dist-bar-group">
        <div class="dist-bar"
          data-count="${b.count} users"
          style="background:${bg}; height:0%; border:${isMe ? '1px solid rgba(251,191,36,0.4)' : 'none'}"
          data-h="${heightPct}">
        </div>
        <span class="dist-bar-label">${b.label}</span>
      </div>
    `;
  }).join('');

  // Animate heights
  requestAnimationFrame(() => {
    distBars.querySelectorAll('.dist-bar').forEach((bar, i) => {
      setTimeout(() => {
        bar.style.transition = 'height 0.8s cubic-bezier(0.34,1.4,0.64,1)';
        bar.style.height = bar.dataset.h + '%';
      }, i * 60);
    });
  });
}

/* ─────────────────────────────────────────────────
   PERIOD TABS
───────────────────────────────────────────────── */
function initPeriodTabs() {
  const tabs = document.querySelectorAll('.period-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      State.period = tab.dataset.period;
      loadAndRender();
      showToast(`📅 Switched to ${tab.textContent} rankings`);
    });
  });
}

/* ─────────────────────────────────────────────────
   FILTER PILLS
───────────────────────────────────────────────── */
function initFilters() {
  const pills = document.querySelectorAll('.filter-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      State.filterResult = pill.dataset.result;
      applyFiltersAndSort();
      renderTable();
    });
  });
}

/* ─────────────────────────────────────────────────
   SEARCH
───────────────────────────────────────────────── */
function initSearch() {
  const input = $('lbSearch');
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      State.searchQuery = input.value.trim();
      applyFiltersAndSort();
      renderTable();
    }, 200);
  });
}

/* ─────────────────────────────────────────────────
   SORT SELECT
───────────────────────────────────────────────── */
function initSort() {
  const sel = $('sortSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    State.sortKey = sel.value;
    applyFiltersAndSort();
    renderTable();
  });
}

/* ─────────────────────────────────────────────────
   PER PAGE
───────────────────────────────────────────────── */
function initPerPage() {
  const sel = $('perPageSelect');
  if (!sel) return;
  sel.addEventListener('change', () => {
    State.perPage = parseInt(sel.value, 10);
    State.page    = 1;
    renderTable();
  });
}

/* ─────────────────────────────────────────────────
   REFRESH BUTTON
───────────────────────────────────────────────── */
function initRefresh() {
  $('refreshBtn')?.addEventListener('click', () => {
    showToast('🔄 Rankings refreshed!');
    loadAndRender();
  });
}

/* ─────────────────────────────────────────────────
   TASK BADGE
───────────────────────────────────────────────── */
function updateTaskBadge() {
  try {
    const tasks = JSON.parse(localStorage.getItem('interviewai_tasks') || '[]');
    const pending = tasks.filter(t => !t.done).length;
    const badge = $('taskBadge');
    if (badge) badge.textContent = pending || '';
  } catch { /* noop */ }
}

/* ─────────────────────────────────────────────────
   LOAD & RENDER (full pipeline)
───────────────────────────────────────────────── */
function loadAndRender() {
  const players = buildPlayers(State.period);

  State.allPlayers = players;

  applyFiltersAndSort();

  renderStats(players);
  renderPodium(players);
  renderTable();
  renderMyRank(players);
  renderDistribution(players);
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
function init() {
  initSidebar();
  renderUserInfo();
  initPeriodTabs();
  initFilters();
  initSearch();
  initSort();
  initPerPage();
  initRefresh();
  updateTaskBadge();

  loadAndRender();
}

document.addEventListener('DOMContentLoaded', init);