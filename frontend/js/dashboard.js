/* ============================================================
   INTERVIEW AI — dashboard.js
   Complete production-ready JS for dashboard page
   ============================================================ */

(function () {
  'use strict';

  /* ════════════════════════════════════════════════════════
     STATE
  ════════════════════════════════════════════════════════ */
  const state = {
    user: null,
    history: [],
    tasks: [],
    tasksDone: new Set(),
  };

  /* ════════════════════════════════════════════════════════
     DATA — Mock / localStorage-backed
  ════════════════════════════════════════════════════════ */
  const MOCK_HISTORY = [
    { id: 1, role: 'Software Engineer',  date: '2025-06-04', conf: 87.2, stress: 'Low',    result: 'Selected',     diff: 'Hard',   transcript: 'I have strong experience with system design...' },
    { id: 2, role: 'Data Scientist',     date: '2025-06-02', conf: 74.5, stress: 'Medium', result: 'Not Selected', diff: 'Medium', transcript: 'My background in ML spans 3 years...' },
    { id: 3, role: 'Frontend Developer', date: '2025-05-30', conf: 91.0, stress: 'Low',    result: 'Selected',     diff: 'Easy',   transcript: 'React and TypeScript are my primary tools...' },
    { id: 4, role: 'ML Engineer',        date: '2025-05-28', conf: 68.3, stress: 'High',   result: 'Not Selected', diff: 'Hard',   transcript: 'I struggled to explain transformer architecture...' },
  ];

  const CHART_DATA = [
    { label: 'Mon', conf: 62, stress: 38 },
    { label: 'Tue', conf: 74, stress: 45 },
    { label: 'Wed', conf: 68, stress: 55 },
    { label: 'Thu', conf: 81, stress: 30 },
    { label: 'Fri', conf: 87, stress: 25 },
    { label: 'Sat', conf: 79, stress: 40 },
    { label: 'Sun', conf: 91, stress: 20 },
  ];

  const SKILLS = [
    { label: 'Confidence', pct: 87, color: '#00f5ff' },
    { label: 'Technical',  pct: 74, color: '#7c3aed' },
    { label: 'Speech',     pct: 82, color: '#10b981' },
    { label: 'Grammar',    pct: 90, color: '#f59e0b' },
    { label: 'Eye Contact',pct: 65, color: '#f43f5e' },
    { label: 'Sentiment',  pct: 78, color: '#3b82f6' },
  ];

  const LEADERBOARD = [
    { rank: 1, name: 'Arjun Sharma',  avatar: 'AS', conf: '96.2%', me: false },
    { rank: 2, name: 'Priya Patel',   avatar: 'PP', conf: '94.8%', me: false },
    { rank: 3, name: 'Rahul Menon',   avatar: 'RM', conf: '93.1%', me: false },
    { rank: 4, name: 'You',           avatar: null, conf: '87.2%', me: true  },
    { rank: 5, name: 'Dev Krishnan',  avatar: 'DK', conf: '85.5%', me: false },
  ];

  const ALL_TASKS = [
    { id: 1, text: 'Speak confidently for 2 minutes without filler words', xp: '+20 XP', category: 'Speech'    },
    { id: 2, text: 'Practice the STAR method for a behavioral question',   xp: '+25 XP', category: 'Structure' },
    { id: 3, text: 'Record yourself answering "Tell me about yourself"',   xp: '+30 XP', category: 'Recording' },
    { id: 4, text: 'Reduce filler words — aim for 0 in 60 seconds',       xp: '+15 XP', category: 'Speech'    },
    { id: 5, text: 'Explain a technical concept to a non-technical person',xp: '+20 XP', category: 'Technical' },
    { id: 6, text: 'Practice maintaining eye contact for 1 full minute',   xp: '+15 XP', category: 'Body Lang' },
    { id: 7, text: 'Write 3 strong STAR stories from past experience',     xp: '+35 XP', category: 'Structure' },
    { id: 8, text: 'Do a mock interview with a peer',                      xp: '+40 XP', category: 'Practice'  },
  ];

  const RECOMMENDATIONS = [
    { icon: '🗣️', title: 'Reduce Filler Words', desc: 'You used 4+ filler words per minute. Practice pausing silently instead of saying "um" or "uh".', priority: 'high', bg: 'rgba(244,63,94,0.1)', color: '#f43f5e' },
    { icon: '⚡', title: 'Increase Speaking Rate', desc: 'Your rate of 88 wpm is below average (120–150 wpm). Read aloud daily to build natural rhythm.', priority: 'med', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    { icon: '💻', title: 'Deepen Technical Knowledge', desc: 'Focus on system design fundamentals. Practice explaining distributed systems in 2 minutes.', priority: 'high', bg: 'rgba(124,58,237,0.1)', color: '#7c3aed' },
    { icon: '👁️', title: 'Improve Eye Contact', desc: 'Your eye contact score was 6/10. Practice with a camera to build confidence and connection.', priority: 'low', bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  ];

  const ACHIEVEMENTS = [
    { icon: '🎯', label: 'First Interview',  color: 'rgba(0,245,255,0.15)',  text: '#00f5ff' },
    { icon: '🔥', label: '7-Day Streak',     color: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
    { icon: '🏆', label: 'Top 10%',          color: 'rgba(124,58,237,0.15)', text: '#7c3aed' },
  ];

  const ROLE_ICONS = {
    'Software Engineer': '💻',
    'Data Scientist':    '🔬',
    'Frontend Developer':'🎨',
    'ML Engineer':       '🤖',
    'Data Analyst':      '📊',
    'Backend Developer': '⚙️',
  };

  /* ════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadHistory();
    loadTasks();
    renderAll();
    initSidebar();
    initScrollHighlight();
    console.log('[Dashboard] Initialized ✓');
  });

  /* ════════════════════════════════════════════════════════
     LOAD USER
  ════════════════════════════════════════════════════════ */
  function loadUser() {
    const stored = localStorage.getItem('interviewai_user') || sessionStorage.getItem('interviewai_user');
    state.user = stored ? JSON.parse(stored) : { name: 'Guest User', email: 'guest@interviewai.app', avatar: 'GU', provider: 'guest' };
  }

  /* ════════════════════════════════════════════════════════
     LOAD HISTORY FROM localStorage (or mock)
  ════════════════════════════════════════════════════════ */
  function loadHistory() {
    const stored = localStorage.getItem('interviewai_history');
    state.history = stored ? JSON.parse(stored) : MOCK_HISTORY;
  }

  /* ════════════════════════════════════════════════════════
     LOAD / SAVE TASKS
  ════════════════════════════════════════════════════════ */
  function loadTasks() {
    /* Pick 5 random tasks for today */
    const today = new Date().toDateString();
    const savedDate   = localStorage.getItem('interviewai_task_date');
    const savedTasks  = localStorage.getItem('interviewai_tasks');
    const savedDone   = localStorage.getItem('interviewai_tasks_done');

    if (savedDate === today && savedTasks) {
      state.tasks = JSON.parse(savedTasks);
    } else {
      const shuffled = [...ALL_TASKS].sort(() => Math.random() - 0.5);
      state.tasks = shuffled.slice(0, 5);
      localStorage.setItem('interviewai_task_date', today);
      localStorage.setItem('interviewai_tasks', JSON.stringify(state.tasks));
      localStorage.removeItem('interviewai_tasks_done');
    }

    if (savedDone && savedDate === today) {
      JSON.parse(savedDone).forEach(id => state.tasksDone.add(id));
    }
  }

  function saveTasks() {
    localStorage.setItem('interviewai_tasks_done', JSON.stringify([...state.tasksDone]));
  }

  /* ════════════════════════════════════════════════════════
     RENDER ALL
  ════════════════════════════════════════════════════════ */
  function renderAll() {
    renderUserInfo();
    renderStats();
    renderBarChart();
    renderRadials();
    renderHistory();
    renderLeaderboard();
    renderTasks();
    renderRecommendations();
    renderAchievements();
  }

  /* ════════════════════════════════════════════════════════
     USER INFO
  ════════════════════════════════════════════════════════ */
  function renderUserInfo() {
    const u = state.user;
    const avatarText = u.avatar || u.name.slice(0, 2).toUpperCase();

    setText('welcomeName', u.name.split(' ')[0]);
    setText('userName', u.name);
    setText('userEmail', u.email || 'Guest session');
    setText('profileName', u.name);
    setText('profileEmailDisplay', u.email || 'guest@interviewai.app');
    setText('avatarSm', avatarText);
    setText('profileAvatar', avatarText);
  }

  /* ════════════════════════════════════════════════════════
     STATS CARDS
  ════════════════════════════════════════════════════════ */
  function renderStats() {
    const total = state.history.length;
    const selected = state.history.filter(h => h.result === 'Selected').length;
    const avgConf = total
      ? Math.round(state.history.reduce((s, h) => s + h.conf, 0) / total)
      : 0;
    const rate = total ? Math.round((selected / total) * 100) : 0;

    const streak = parseInt(localStorage.getItem('interviewai_streak') || '7');

    animateCount('statInterviews', total);
    animateCount('statConfidence', avgConf, '%');
    animateCount('statRate', rate, '%');
    animateCount('statStreak', streak);

    /* Profile sidebar */
    setText('pStatInterviews', total);
    setText('pStatConf', avgConf + '%');
    setText('pStatRate', rate + '%');

    /* Streak bar */
    const streakPct = Math.min((streak / 30) * 100, 100);
    const streakFill = document.getElementById('streakFill');
    if (streakFill) setTimeout(() => { streakFill.style.width = streakPct + '%'; }, 300);
    setText('streakCount', streak + 'd');
  }

  /* ════════════════════════════════════════════════════════
     BAR CHART
  ════════════════════════════════════════════════════════ */
  function renderBarChart() {
    const container = document.getElementById('barChart');
    if (!container) return;

    const maxH = 112; // px
    container.innerHTML = CHART_DATA.map((d, i) => `
      <div class="bar-group" style="animation-delay:${i * 0.06}s">
        <div class="bar-col bar-conf"  data-h="${(d.conf  / 100) * maxH}" style="height:4px" title="Confidence: ${d.conf}%"></div>
        <div class="bar-col bar-stress" data-h="${(d.stress / 100) * maxH}" style="height:4px" title="Stress: ${d.stress}%"></div>
        <span class="bar-label">${d.label}</span>
      </div>
    `).join('');

    /* Animate bars after paint */
    setTimeout(() => {
      container.querySelectorAll('.bar-col').forEach(bar => {
        const h = bar.dataset.h;
        bar.style.transition = 'height 0.8s cubic-bezier(0.34,1.4,0.64,1)';
        bar.style.height = h + 'px';
      });
    }, 150);
  }

  /* ════════════════════════════════════════════════════════
     RADIAL SKILL BREAKDOWNS
  ════════════════════════════════════════════════════════ */
  function renderRadials() {
    const container = document.getElementById('radialGrid');
    if (!container) return;

    const r = 28;
    const circumference = 2 * Math.PI * r;

    container.innerHTML = SKILLS.map((s) => {
      const offset = circumference - (s.pct / 100) * circumference;
      const id = 'rg_' + s.label.replace(/\s/g, '');
      return `
        <div class="radial-item">
          <svg class="radial-svg" viewBox="0 0 72 72">
            <circle class="radial-track" cx="36" cy="36" r="${r}"/>
            <circle class="radial-fill" cx="36" cy="36" r="${r}"
              stroke="${s.color}"
              stroke-dasharray="${circumference}"
              stroke-dashoffset="${circumference}"
              id="${id}"
            />
            <text class="radial-pct" x="36" y="36" style="font-size:13px;font-weight:800;fill:white;font-family:'Syne',sans-serif">
              ${s.pct}%
            </text>
          </svg>
          <div class="radial-label">${s.label}</div>
        </div>
      `;
    }).join('');

    /* Animate offsets */
    setTimeout(() => {
      SKILLS.forEach(s => {
        const el = document.getElementById('rg_' + s.label.replace(/\s/g, ''));
        if (el) el.style.strokeDashoffset = (circumference - (s.pct / 100) * circumference);
      });
    }, 250);
  }

  /* ════════════════════════════════════════════════════════
     RECENT HISTORY
  ════════════════════════════════════════════════════════ */
  function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;

    const items = state.history.slice(0, 4);
    container.innerHTML = items.map((h) => {
      const icon = ROLE_ICONS[h.role] || '💼';
      const isSelected = h.result === 'Selected';
      const confColor = h.conf >= 80 ? '#10b981' : h.conf >= 60 ? '#f59e0b' : '#f43f5e';
      return `
        <div class="history-item">
          <div class="history-icon" style="background:${isSelected ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)'}">
            ${icon}
          </div>
          <div class="history-info">
            <div class="history-title">${h.role}</div>
            <div class="history-meta">
              <span>📅 ${formatDate(h.date)}</span>
              <span>⚡ ${h.diff}</span>
              <span style="color:${confColor};font-weight:600">💡 ${h.conf}%</span>
              <span>🧠 ${h.stress}</span>
            </div>
          </div>
          <span class="history-result ${isSelected ? 'result-selected' : 'result-not'}">
            ${isSelected ? '✓ Selected' : '✕ Rejected'}
          </span>
        </div>
      `;
    }).join('');
  }

  /* ════════════════════════════════════════════════════════
     MINI LEADERBOARD
  ════════════════════════════════════════════════════════ */
  function renderLeaderboard() {
    const container = document.getElementById('lbMini');
    if (!container) return;

    const rankClasses = ['rank-1', 'rank-2', 'rank-3', 'rank-n', 'rank-n'];
    const rankLabels  = ['1st', '2nd', '3rd', '4th', '5th'];

    container.innerHTML = LEADERBOARD.map((u, i) => {
      const avatarBg  = u.me ? 'linear-gradient(135deg,#00f5ff,#7c3aed)' : 'linear-gradient(135deg,rgba(0,245,255,0.2),rgba(124,58,237,0.2))';
      const avatarText = u.me
        ? (state.user?.avatar || state.user?.name?.slice(0,2)?.toUpperCase() || 'ME')
        : u.avatar;
      return `
        <div class="lb-mini-row ${u.me ? 'me' : ''}">
          <div class="lb-rank-badge ${rankClasses[i]}">${rankLabels[i]}</div>
          <div class="lb-mini-avatar" style="background:${avatarBg}">${avatarText}</div>
          <span class="lb-mini-name">${u.me ? (state.user?.name?.split(' ')[0] || 'You') : u.name}</span>
          <span class="lb-mini-conf">${u.conf}</span>
        </div>
      `;
    }).join('');
  }

  /* ════════════════════════════════════════════════════════
     DAILY TASKS
  ════════════════════════════════════════════════════════ */
  function renderTasks() {
    const container = document.getElementById('tasksList');
    const progress  = document.getElementById('taskProgress');
    const badge     = document.getElementById('taskBadge');
    if (!container) return;

    const doneCount = state.tasksDone.size;

    if (progress) progress.textContent = `${doneCount} / ${state.tasks.length} completed today`;
    if (badge) {
      const remaining = state.tasks.length - doneCount;
      badge.textContent = remaining;
      badge.style.display = remaining > 0 ? '' : 'none';
    }

    container.innerHTML = state.tasks.map(t => {
      const done = state.tasksDone.has(t.id);
      return `
        <div class="task-item ${done ? 'done' : ''}" data-id="${t.id}">
          <div class="task-check">${done ? '✓' : ''}</div>
          <div class="task-info">
            <div class="task-text">${t.text}</div>
            <div class="task-xp">${done ? '✓ Earned ' : ''}${t.xp}</div>
          </div>
          <span class="task-category">${t.category}</span>
        </div>
      `;
    }).join('');

    /* Add click listeners */
    container.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => toggleTask(parseInt(item.dataset.id)));
    });

    /* Refresh button */
    const refreshBtn = document.getElementById('refreshTasks');
    if (refreshBtn) {
      refreshBtn.onclick = () => {
        state.tasksDone.clear();
        const shuffled = [...ALL_TASKS].sort(() => Math.random() - 0.5);
        state.tasks = shuffled.slice(0, 5);
        localStorage.setItem('interviewai_tasks', JSON.stringify(state.tasks));
        saveTasks();
        renderTasks();
        showToast('Daily tasks refreshed! 🔄', 'info');
      };
    }
  }

  function toggleTask(id) {
    if (state.tasksDone.has(id)) {
      state.tasksDone.delete(id);
    } else {
      state.tasksDone.add(id);
      showToast('Task completed! 🎉 XP earned.', 'success');
    }
    saveTasks();
    renderTasks();
  }

  /* ════════════════════════════════════════════════════════
     RECOMMENDATIONS
  ════════════════════════════════════════════════════════ */
  function renderRecommendations() {
    const container = document.getElementById('recsList');
    if (!container) return;

    container.innerHTML = RECOMMENDATIONS.map(r => `
      <div class="rec-item">
        <div class="rec-icon" style="background:${r.bg};color:${r.color}">${r.icon}</div>
        <div class="rec-info">
          <div class="rec-title">${r.title}</div>
          <div class="rec-desc">${r.desc}</div>
        </div>
        <span class="rec-priority priority-${r.priority}">
          ${r.priority === 'high' ? 'HIGH' : r.priority === 'med' ? 'MED' : 'LOW'}
        </span>
      </div>
    `).join('');
  }

  /* ════════════════════════════════════════════════════════
     ACHIEVEMENTS
  ════════════════════════════════════════════════════════ */
  function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;

    container.innerHTML = ACHIEVEMENTS.map(a => `
      <div class="badge-chip" style="background:${a.color};border-color:${a.text}33;color:${a.text}">
        <span>${a.icon}</span>
        <span>${a.label}</span>
      </div>
    `).join('');
  }

  /* ════════════════════════════════════════════════════════
     SIDEBAR — Mobile toggle
  ════════════════════════════════════════════════════════ */
  function initSidebar() {
    const mobileBtn  = document.getElementById('mobileMenuBtn');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('sidebarOverlay');
    const logoutLink = document.getElementById('logoutLink');

    function openSidebar() {
      sidebar?.classList.add('mobile-open');
      overlay?.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeSidebar() {
      sidebar?.classList.remove('mobile-open');
      overlay?.classList.remove('open');
      document.body.style.overflow = '';
    }

    mobileBtn?.addEventListener('click', () => {
      sidebar?.classList.contains('mobile-open') ? closeSidebar() : openSidebar();
    });

    overlay?.addEventListener('click', closeSidebar);

    logoutLink?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('interviewai_user');
      sessionStorage.removeItem('interviewai_user');
      showToast('Logged out successfully.', 'info');
      setTimeout(() => { window.location.href = 'landing.html'; }, 700);
    });
  }

  /* ════════════════════════════════════════════════════════
     SCROLL HIGHLIGHT — active nav link
  ════════════════════════════════════════════════════════ */
  function initScrollHighlight() {
    if (window.location.hash === '#tasks') {
      setTimeout(() => {
        document.getElementById('tasks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }

  /* ════════════════════════════════════════════════════════
     UTILS
  ════════════════════════════════════════════════════════ */
  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function animateCount(id, target, suffix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const steps = 40;
    const inc = target / steps;
    const timer = setInterval(() => {
      current += inc;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = Math.round(current) + suffix;
    }, 28);
  }

  /* ════════════════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════════════════ */
  let toastTimer;
  function showToast(msg, type = 'success') {
    const el = document.getElementById('toastDb');
    if (!el) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    el.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
    el.className = 'toast-db show';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.className = 'toast-db'; }, 3200);
  }

  /* Expose globally */
  window.dashboardShowToast = showToast;

})();