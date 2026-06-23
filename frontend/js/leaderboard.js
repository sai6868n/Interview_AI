'use strict';

/* ─────────────────────────────────────────────────
   DUMMY BASE DATA — intentionally mixed so real
   users can climb after a few good sessions.
   Distribution: ~8 strong, ~18 average, ~24 weak.
───────────────────────────────────────────────── */
const DUMMY_PLAYERS = [
  // Strong top 8
  { id:1,  name:'Arjun Sharma',    role:'Software Engineer',  confidence:91, stress:'Low',    result:'Selected',     sessions:18, delta:1  },
  { id:2,  name:'Priya Verma',     role:'Data Scientist',     confidence:88, stress:'Low',    result:'Selected',     sessions:22, delta:-1 },
  { id:3,  name:'Rohan Mehta',     role:'ML Engineer',        confidence:84, stress:'Medium', result:'Selected',     sessions:15, delta:2  },
  { id:4,  name:'Ananya Singh',    role:'Backend Developer',  confidence:81, stress:'Low',    result:'Selected',     sessions:11, delta:0  },
  { id:5,  name:'Vikram Patel',    role:'Full Stack Dev',     confidence:79, stress:'Medium', result:'Selected',     sessions:9,  delta:3  },
  { id:6,  name:'Neha Kumar',      role:'Data Analyst',       confidence:77, stress:'Low',    result:'Selected',     sessions:14, delta:-2 },
  { id:7,  name:'Aditya Joshi',    role:'Frontend Developer', confidence:75, stress:'Medium', result:'Selected',     sessions:7,  delta:1  },
  { id:8,  name:'Kavya Reddy',     role:'DevOps Engineer',    confidence:74, stress:'Low',    result:'Selected',     sessions:12, delta:0  },
  // Average middle 18
  { id:9,  name:'Sanjay Gupta',    role:'Software Engineer',  confidence:72, stress:'Medium', result:'Selected',     sessions:6,  delta:2  },
  { id:10, name:'Pooja Nair',      role:'Data Scientist',     confidence:70, stress:'High',   result:'Not Selected', sessions:8,  delta:-1 },
  { id:11, name:'Rahul Iyer',      role:'ML Engineer',        confidence:68, stress:'Medium', result:'Selected',     sessions:5,  delta:1  },
  { id:12, name:'Divya Pillai',    role:'Backend Developer',  confidence:67, stress:'Medium', result:'Not Selected', sessions:4,  delta:0  },
  { id:13, name:'Kiran Rao',       role:'Frontend Developer', confidence:65, stress:'High',   result:'Not Selected', sessions:7,  delta:-2 },
  { id:14, name:'Meera Krishnan',  role:'Data Analyst',       confidence:64, stress:'Medium', result:'Selected',     sessions:3,  delta:3  },
  { id:15, name:'Suresh Bhat',     role:'Full Stack Dev',     confidence:62, stress:'High',   result:'Not Selected', sessions:5,  delta:0  },
  { id:16, name:'Lakshmi Venkat',  role:'Software Engineer',  confidence:61, stress:'Medium', result:'Not Selected', sessions:6,  delta:-1 },
  { id:17, name:'Nikhil Das',      role:'DevOps Engineer',    confidence:60, stress:'High',   result:'Not Selected', sessions:4,  delta:1  },
  { id:18, name:'Reshma Shah',     role:'Data Scientist',     confidence:59, stress:'Medium', result:'Not Selected', sessions:3,  delta:0  },
  { id:19, name:'Pranav Shetty',   role:'ML Engineer',        confidence:58, stress:'High',   result:'Not Selected', sessions:5,  delta:-1 },
  { id:20, name:'Swati Kulkarni',  role:'Backend Developer',  confidence:57, stress:'Medium', result:'Not Selected', sessions:2,  delta:2  },
  { id:21, name:'Dev Choudhary',   role:'Frontend Developer', confidence:56, stress:'High',   result:'Not Selected', sessions:4,  delta:0  },
  { id:22, name:'Ritika Aggarwal', role:'Data Analyst',       confidence:55, stress:'Medium', result:'Not Selected', sessions:3,  delta:-2 },
  { id:23, name:'Harsh Malhotra',  role:'Software Engineer',  confidence:55, stress:'High',   result:'Not Selected', sessions:2,  delta:1  },
  { id:24, name:'Nisha Bansal',    role:'Full Stack Dev',     confidence:54, stress:'High',   result:'Not Selected', sessions:4,  delta:0  },
  { id:25, name:'Varun Saxena',    role:'ML Engineer',        confidence:54, stress:'Medium', result:'Not Selected', sessions:1,  delta:-1 },
  { id:26, name:'Isha Kapoor',     role:'DevOps Engineer',    confidence:53, stress:'High',   result:'Not Selected', sessions:3,  delta:0  },
  // Weak bottom 24 — easy to beat
  { id:27, name:'Mohammed Ansari', role:'Data Scientist',     confidence:52, stress:'High',   result:'Not Selected', sessions:2,  delta:1  },
  { id:28, name:'Fatima Khan',     role:'Software Engineer',  confidence:51, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:29, name:'Ali Hassan',      role:'Backend Developer',  confidence:50, stress:'High',   result:'Not Selected', sessions:2,  delta:-1 },
  { id:30, name:'Zara Sheikh',     role:'Frontend Developer', confidence:49, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:31, name:'James Smith',     role:'Data Analyst',       confidence:49, stress:'High',   result:'Not Selected', sessions:3,  delta:1  },
  { id:32, name:'Emma Johnson',    role:'ML Engineer',        confidence:48, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:33, name:'Liam Williams',   role:'Software Engineer',  confidence:47, stress:'High',   result:'Not Selected', sessions:2,  delta:-1 },
  { id:34, name:'Olivia Brown',    role:'Data Scientist',     confidence:47, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:35, name:'Noah Davis',      role:'Full Stack Dev',     confidence:46, stress:'High',   result:'Not Selected', sessions:2,  delta:1  },
  { id:36, name:'Ava Wilson',      role:'DevOps Engineer',    confidence:46, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:37, name:'Lucas Jones',     role:'Backend Developer',  confidence:45, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:38, name:'Mia Garcia',      role:'Frontend Developer', confidence:44, stress:'High',   result:'Not Selected', sessions:2,  delta:-1 },
  { id:39, name:'Ethan Martinez',  role:'Data Analyst',       confidence:44, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:40, name:'Sofia Hernandez', role:'ML Engineer',        confidence:43, stress:'High',   result:'Not Selected', sessions:1,  delta:1  },
  { id:41, name:'Mason Lopez',     role:'Software Engineer',  confidence:43, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:42, name:'Charlotte Lee',   role:'Data Scientist',     confidence:42, stress:'High',   result:'Not Selected', sessions:2,  delta:-1 },
  { id:43, name:'Logan Gonzalez',  role:'Full Stack Dev',     confidence:42, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:44, name:'Amelia Walker',   role:'DevOps Engineer',    confidence:41, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:45, name:'Ethan Hall',      role:'Backend Developer',  confidence:41, stress:'High',   result:'Not Selected', sessions:1,  delta:1  },
  { id:46, name:'Harper Allen',    role:'Frontend Developer', confidence:40, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:47, name:'Aiden Young',     role:'Data Analyst',       confidence:40, stress:'High',   result:'Not Selected', sessions:1,  delta:-1 },
  { id:48, name:'Evelyn King',     role:'ML Engineer',        confidence:39, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:49, name:'Jackson Scott',   role:'Software Engineer',  confidence:39, stress:'High',   result:'Not Selected', sessions:1,  delta:0  },
  { id:50, name:'Abigail Green',   role:'Data Scientist',     confidence:38, stress:'High',   result:'Not Selected', sessions:1,  delta:1  },
];

/* ─────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────── */
const State = {
  period:      'weekly',
  allPlayers:  [],
  filtered:    [],
  page:        1,
  perPage:     10,
  sortKey:     'confidence',
  filterResult:'all',
  searchQuery: '',
  currentUser: null,
};

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
  const t = $('toastLb'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 3000);
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

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─────────────────────────────────────────────────
   INJECT REAL USERS — merges localStorage users
   with dummy data so real users appear in ranking
───────────────────────────────────────────────── */
function buildPlayers(period) {
  // Period variation: slightly shuffle confidence ±3 for realism
  const offsets = { weekly: 0, monthly: 2, alltime: -1 };
  const offset = offsets[period] || 0;

  let players = DUMMY_PLAYERS.map((p, i) => ({
    ...p,
    confidence: Math.max(35, Math.min(98, p.confidence + offset + (i % 3 === 0 ? 1 : 0))),
  }));

  // Inject all real localStorage users
  const realEntries = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith('interviewai_history_')) continue;
    const email = key.replace('interviewai_history_', '');
    if (email === 'guest') continue;
    try {
      const history = JSON.parse(localStorage.getItem(key) || '[]');
      if (!history.length) continue;
      const conf = Math.round(history.reduce((s, h) => s + (h.confidence || h.confidence_score || 0), 0) / history.length);
      const regData = JSON.parse(localStorage.getItem('interviewai_registered_' + email) || '{}');
      const storedUser = JSON.parse(localStorage.getItem('interviewai_user') || '{}');
      const name = regData.name || (storedUser.email === email ? storedUser.name : null) || email.split('@')[0];
      const lastResult = history[0]?.result || history[0]?.interview_result || 'Not Selected';
      const lastStress = history[0]?.stress || history[0]?.stress_level || 'Medium';
      const currentUser = loadUser();
      realEntries.push({
        id: 900 + realEntries.length,
        name, role: regData.role || 'Software Engineer',
        confidence: conf, stress: lastStress,
        result: lastResult, sessions: history.length,
        delta: 0, isMe: currentUser?.email === email,
      });
    } catch(e) {}
  }

  // Merge: remove dummy slots that real users would displace
  players = [...realEntries, ...players];

  // Sort by confidence descending, assign rank
  players.sort((a, b) => b.confidence - a.confidence);
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

  const open  = () => {
    sidebar.classList.add('mobile-open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  menuBtn?.addEventListener('click', () =>
    sidebar.classList.contains('mobile-open') ? close() : open()
  );
  overlay?.addEventListener('click', close);

  $('logoutLink')?.addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('interviewai_user');
    window.location.href = 'index.html';
  });

  // Close on Escape
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
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
  const av = $('avatarSm'); if (av) av.textContent = inits;
  State.currentUser = user;
}

/* ─────────────────────────────────────────────────
   STATS STRIP
───────────────────────────────────────────────── */
function renderStats(players) {
  const total   = players.length;
  const avgConf = total ? Math.round(players.reduce((s, p) => s + p.confidence, 0) / total) : 0;
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
  const grid = $('podiumGrid'); if (!grid) return;
  const top3 = players.slice(0, 3);
  const display = [top3[1], top3[0], top3[2]].filter(Boolean);
  const podiumClass = ['podium-2', 'podium-1', 'podium-3'];
  const crowns      = ['🥈', '🥇', '🥉'];
  const badgeClass  = ['rank-badge-2', 'rank-badge-1', 'rank-badge-3'];

  grid.innerHTML = display.map((player, i) => {
    if (!player) return '';
    const isCenter  = i === 1;
    const meTag     = player.isMe ? '<span class="podium-me-badge">YOU</span>' : '';
    const resultCls = player.result === 'Selected' ? 'chip-selected' : 'chip-not';
    const resultIcon= player.result === 'Selected' ? '✓' : '✗';
    return `
      <div class="${podiumClass[i]} podium-card" style="animation-delay:${0.1 + i * 0.1}s">
        ${meTag}
        <div class="podium-card-bg"><div class="podium-bg-glow"></div></div>
        <span class="podium-crown">${crowns[i]}</span>
        <div class="podium-avatar" style="width:${isCenter?72:60}px;height:${isCenter?72:60}px;font-size:${isCenter?24:20}px">
          ${initials(player.name)}
          <div class="podium-rank-badge ${badgeClass[i]}">${player.rank}</div>
        </div>
        <div class="podium-name" style="font-size:${isCenter?16:14}px">${player.name}</div>
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
      </div>`;
  }).join('');
}

/* ─────────────────────────────────────────────────
   FILTER + SORT
───────────────────────────────────────────────── */
function applyFiltersAndSort() {
  let list = [...State.allPlayers];

  if (State.searchQuery) {
    const q = State.searchQuery.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }

  if (State.filterResult === 'selected') list = list.filter(p => p.result === 'Selected');
  else if (State.filterResult === 'not')  list = list.filter(p => p.result === 'Not Selected');

  const sorts = {
    confidence: (a, b) => b.confidence - a.confidence,
    stress:     (a, b) => { const w = { Low:1, Medium:2, High:3 }; return w[a.stress]-w[b.stress]; },
    interviews: (a, b) => b.sessions - a.sessions,
    name:       (a, b) => a.name.localeCompare(b.name),
  };
  list.sort(sorts[State.sortKey] || sorts.confidence);

  State.filtered = list;
  State.page     = 1;
}

/* ─────────────────────────────────────────────────
   TABLE ROWS
───────────────────────────────────────────────── */
function renderTable() {
  const body = $('lbTableBody'); if (!body) return;

  const start = (State.page - 1) * State.perPage;
  const page  = State.filtered.slice(start, start + State.perPage);

  if (!page.length) {
    body.innerHTML = `<div class="lb-empty"><div class="lb-empty-icon">🔍</div><h3>No results</h3><p>Try adjusting your search or filter.</p></div>`;
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
      <div class="lb-row ${meCls}" style="animation-delay:${idx*0.03}s">
        <div class="rank-cell">
          <div class="rank-num ${rankCls}">${globalRank}</div>
          ${rankChangeHTML(player.delta)}
        </div>
        <div class="user-cell">
          <div class="row-avatar">${initials(player.name)}</div>
          <div>
            <div class="row-name">${player.name}${player.isMe?' <span style="font-size:10px;color:var(--cyan)">(You)</span>':''}</div>
            <div class="row-role">${player.role}</div>
          </div>
        </div>
        <div class="conf-cell">
          <div class="conf-val-row">
            <span class="conf-num">${player.confidence}%</span>
            <div class="conf-bar-track"><div class="conf-bar-fill" style="width:${player.confidence}%"></div></div>
          </div>
        </div>
        <div><span class="stress-chip ${stressCls}">${player.stress}</span></div>
        <div><span class="result-chip ${resultCls}">${resultIcon} ${player.result}</span></div>
        <div class="interviews-val">${player.sessions}</div>
      </div>`;
  }).join('');

  renderPagination();
}

/* ─────────────────────────────────────────────────
   PAGINATION
───────────────────────────────────────────────── */
function renderPagination() {
  const total      = State.filtered.length;
  const totalPages = Math.ceil(total / State.perPage);
  const start      = total === 0 ? 0 : (State.page - 1) * State.perPage + 1;
  const end        = Math.min(State.page * State.perPage, total);

  setText('paginationInfo', `Showing ${start}–${end} of ${total}`);

  const btns = $('pageBtns'); if (!btns) return;

  let html = `<button class="page-btn" id="prevPage" ${State.page<=1?'disabled':''}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
  </button>`;

  const range = pageRange(State.page, totalPages);
  range.forEach(p => {
    if (p === '…') html += `<span class="page-btn" style="cursor:default;opacity:.4">…</span>`;
    else html += `<button class="page-btn ${p===State.page?'active':''}" data-page="${p}">${p}</button>`;
  });

  html += `<button class="page-btn" id="nextPage" ${State.page>=totalPages?'disabled':''}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
  </button>`;

  btns.innerHTML = html;

  btns.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => { State.page = parseInt(btn.dataset.page, 10); renderTable(); });
  });
  $('prevPage')?.addEventListener('click', () => { if (State.page>1) { State.page--; renderTable(); } });
  $('nextPage')?.addEventListener('click', () => { if (State.page<totalPages) { State.page++; renderTable(); } });
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
  if (!me) { setText('myRankPos', '#—'); return; }

  setText('myRankPos',   `#${me.rank}`);
  setText('myConf',      me.confidence + '%');
  setText('myStress',    me.stress);
  setText('mySessions',  me.sessions);
  setText('myResult',    me.result === 'Selected' ? '✓ Pass' : '✗ Fail');

  if (me.rank > 1) {
    const above = players[me.rank - 2];
    const gap   = (above?.confidence || me.confidence + 5) - me.confidence;
    const pct   = Math.max(0, Math.min(100, Math.round((1 - gap / 20) * 100)));
    setTimeout(() => {
      const fill = $('rankProgressFill');
      if (fill) fill.style.width = pct + '%';
    }, 400);
    setText('rankProgressPct',  pct + '%');
    setText('rankProgressHint', gap > 0 ? `+${gap.toFixed(1)}% confidence needed to reach #${me.rank-1}` : 'You\'re at the top!');
  } else {
    setText('rankProgressPct', '100%');
    setText('rankProgressHint', '🏆 You\'re #1!');
    const fill = $('rankProgressFill');
    if (fill) setTimeout(() => { fill.style.width = '100%'; }, 400);
  }
}

/* ─────────────────────────────────────────────────
   SCORE DISTRIBUTION CHART
───────────────────────────────────────────────── */
function renderDistribution(players) {
  const distBars = $('distBars'); if (!distBars) return;

  const buckets = [
    { label:'35–44', min:35, max:44, count:0 },
    { label:'45–54', min:45, max:54, count:0 },
    { label:'55–64', min:55, max:64, count:0 },
    { label:'65–74', min:65, max:74, count:0 },
    { label:'75–84', min:75, max:84, count:0 },
    { label:'85+',   min:85, max:100,count:0 },
  ];

  players.forEach(p => {
    const b = buckets.find(bk => p.confidence >= bk.min && p.confidence <= bk.max);
    if (b) b.count++;
  });

  const maxCount = Math.max(...buckets.map(b => b.count), 1);
  const me       = players.find(p => p.isMe);
  const myBucket = me ? buckets.find(b => me.confidence >= b.min && me.confidence <= b.max) : null;

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
    const isMe  = b === myBucket;
    const bg    = isMe ? 'linear-gradient(180deg,#fbbf24,rgba(251,191,36,0.5))' : colors[i];
    return `
      <div class="dist-bar-group">
        <div class="dist-bar" data-count="${b.count} users"
          style="background:${bg};height:0%;${isMe?'border:1px solid rgba(251,191,36,0.4)':''}"
          data-h="${heightPct}"></div>
        <span class="dist-bar-label">${b.label}</span>
      </div>`;
  }).join('');

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

function initSearch() {
  const input = $('lbSearch'); if (!input) return;
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

function initSort() {
  const sel = $('sortSelect'); if (!sel) return;
  sel.addEventListener('change', () => { State.sortKey = sel.value; applyFiltersAndSort(); renderTable(); });
}

function initPerPage() {
  const sel = $('perPageSelect'); if (!sel) return;
  sel.addEventListener('change', () => { State.perPage = parseInt(sel.value, 10); State.page = 1; renderTable(); });
}

function initRefresh() {
  $('refreshBtn')?.addEventListener('click', () => { showToast('🔄 Rankings refreshed!'); loadAndRender(); });
}

function updateTaskBadge() {
  try {
    const tasks = JSON.parse(localStorage.getItem('interviewai_tasks') || '[]');
    const pending = tasks.filter(t => !t.done).length;
    const badge = $('taskBadge');
    if (badge) badge.textContent = pending || '';
  } catch { /* noop */ }
}

/* ─────────────────────────────────────────────────
   LOAD & RENDER
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