/* ============================================================
   INTERVIEW AI — history.js
   Complete interview history page logic
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY  = 'interviewai_user';
  const SESSION_KEY  = 'interviewai_session';
  const HISTORY_KEY  = 'interviewai_history';
  const ITEMS_PER_PAGE = 8;

  /* ── Mock data generator ───────────────────────────────── */
  const ROLES = ['Software Engineer', 'Data Scientist', 'ML Engineer', 'Frontend Developer', 'Backend Developer', 'Data Analyst'];
  const DIFFS = ['Easy', 'Medium', 'Hard'];
  const STRESS = ['Low', 'Medium', 'High'];
  const RESULTS = ['Selected', 'Not Selected'];

  const TRANSCRIPTS = [
    "I believe my strongest skill is problem-solving. In my previous role, I led a team to redesign our data pipeline, reducing processing time by 40%. I enjoy working with stakeholders to understand requirements and translating those into technical solutions.",
    "During my last project, I built a machine learning model to predict customer churn with 89% accuracy. I used scikit-learn and XGBoost for the modeling, and collaborated closely with the business team to ensure actionable insights.",
    "I approach technical challenges by first breaking them down into smaller problems. I then research solutions, prototype quickly, and iterate based on feedback. I'm particularly strong in Python, SQL, and React.",
    "My communication style is very collaborative. I prefer to keep stakeholders updated regularly and welcome feedback early in the process rather than at the end. I've managed cross-functional teams of up to 8 people.",
    "In terms of system design, I always start with the requirements and work backwards. I consider scalability, reliability, and maintainability from the beginning rather than treating them as afterthoughts."
  ];

  function generateMockHistory(n = 12) {
    const items = [];
    const now = Date.now();
    for (let i = 0; i < n; i++) {
      const date = new Date(now - i * 2.3 * 24 * 3600 * 1000);
      const conf = Math.round(45 + Math.random() * 50 + Math.min(i * 1.2, 20));
      const techScore = Math.floor(4 + Math.random() * 6);
      const commScore = Math.floor(4 + Math.random() * 6);
      items.push({
        id:         'h_' + (now - i * 10000),
        date:       date.toISOString(),
        role:       ROLES[Math.floor(Math.random() * ROLES.length)],
        difficulty: DIFFS[Math.floor(Math.random() * DIFFS.length)],
        confidence: Math.min(conf, 99),
        stress:     STRESS[Math.floor(Math.random() * STRESS.length)],
        result:     conf > 70 ? (Math.random() > 0.35 ? 'Selected' : 'Not Selected') : (Math.random() > 0.7 ? 'Selected' : 'Not Selected'),
        speakingRate:  Math.round(90 + Math.random() * 60),
        avgPitch:      Math.round(120 + Math.random() * 80),
        pauseDuration: +(Math.random() * 3 + 0.5).toFixed(1),
        fillerWords:   Math.floor(Math.random() * 8),
        responseLen:   Math.floor(120 + Math.random() * 200),
        sentiment:     +(Math.random() * 1.4 - 0.3).toFixed(2),
        techScore,
        commScore,
        grammarScore:  Math.floor(4 + Math.random() * 6),
        eyeContact:    Math.floor(4 + Math.random() * 6),
        transcript:    TRANSCRIPTS[Math.floor(Math.random() * TRANSCRIPTS.length)],
        improvement:   null
      });
    }
    return items;
  }

  /* ── State ─────────────────────────────────────────────── */
  const state = {
    allHistory:    [],
    filtered:      [],
    currentPage:   1,
    expandedId:    null,
    deleteTargetId: null,
    sortBy:        'date_desc',
    filterResult:  'all',
    filterStress:  'all',
    searchQuery:   ''
  };

  /* ── Init ───────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadHistory();
    bindSidebar();
    bindFilters();
    bindExport();
    bindDeleteModal();
    renderAll();
    console.log('[History] Initialized with', state.allHistory.length, 'records');
  });

  /* ── Load user ──────────────────────────────────────────── */
  function loadUser() {
    const user = getUser();
    if (!user) return;
    const avatarEl = document.getElementById('avatarSm');
    const nameEl   = document.getElementById('userName');
    const emailEl  = document.getElementById('userEmail');
    if (avatarEl) avatarEl.textContent = user.avatar || user.name?.slice(0, 2).toUpperCase() || '?';
    if (nameEl)   nameEl.textContent   = user.name  || 'User';
    if (emailEl)  emailEl.textContent  = user.email || 'Guest';

    document.getElementById('logoutLink')?.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(SESSION_KEY);
      window.location.href = 'index.html';
    });
  }

  function getUser() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) ||
             JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
    } catch { return null; }
  }

  /* ── Load history ───────────────────────────────────────── */
    function loadHistory() {
    try {
      const user = getUser();
      const email = user?.email || 'guest';
      const userKey = 'interviewai_history_' + email;
      const stored = JSON.parse(localStorage.getItem(userKey));
      state.allHistory = stored?.length ? stored : [];
    // Save back to shared key for other pages
      if (state.allHistory.length) {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(state.allHistory));
      }
    } catch {
      state.allHistory = [];
    }
  }

  /* ── Sidebar ────────────────────────────────────────────── */
  function bindSidebar() {
    const sidebar  = document.getElementById('sidebar');
    const overlay  = document.getElementById('sidebarOverlay');
    const menuBtn  = document.getElementById('mobileMenuBtn');

    function open()  { sidebar?.classList.add('mobile-open'); overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function close() { sidebar?.classList.remove('mobile-open'); overlay?.classList.remove('open'); document.body.style.overflow = ''; }

    menuBtn?.addEventListener('click', () => sidebar?.classList.contains('mobile-open') ? close() : open());
    overlay?.addEventListener('click', close);
  }

  /* ── Filters ────────────────────────────────────────────── */
  function bindFilters() {
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase().trim();
      state.currentPage = 1;
      applyFilters();
      renderRows();
      renderPagination();
    });

    document.getElementById('filterResult')?.addEventListener('change', (e) => {
      state.filterResult = e.target.value;
      state.currentPage  = 1;
      applyFilters(); renderRows(); renderPagination();
    });

    document.getElementById('filterStress')?.addEventListener('change', (e) => {
      state.filterStress = e.target.value;
      state.currentPage  = 1;
      applyFilters(); renderRows(); renderPagination();
    });

    document.getElementById('sortBy')?.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      state.currentPage = 1;
      applyFilters(); renderRows(); renderPagination();
    });

    /* Column sort headers */
    document.querySelectorAll('.th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const s = th.dataset.sort;
        if (s === 'confidence') {
          state.sortBy = state.sortBy === 'conf_desc' ? 'conf_asc' : 'conf_desc';
        } else if (s === 'role') {
          state.sortBy = 'role_asc';
        }
        document.getElementById('sortBy').value = state.sortBy;
        applyFilters(); renderRows(); renderPagination();
      });
    });
  }

  function applyFilters() {
    let list = [...state.allHistory];

    if (state.searchQuery) {
      list = list.filter(h =>
        h.role.toLowerCase().includes(state.searchQuery) ||
        h.result.toLowerCase().includes(state.searchQuery) ||
        h.transcript?.toLowerCase().includes(state.searchQuery)
      );
    }
    if (state.filterResult !== 'all') {
      const isSelected = state.filterResult === 'selected';
      list = list.filter(h => isSelected ? h.result === 'Selected' : h.result === 'Not Selected');
    }
    if (state.filterStress !== 'all') {
      list = list.filter(h => h.stress === state.filterStress);
    }

    /* Sort */
    list.sort((a, b) => {
      switch (state.sortBy) {
        case 'date_desc':  return new Date(b.date) - new Date(a.date);
        case 'date_asc':   return new Date(a.date) - new Date(b.date);
        case 'conf_desc':  return b.confidence - a.confidence;
        case 'conf_asc':   return a.confidence - b.confidence;
        case 'role_asc':   return a.role.localeCompare(b.role);
        default:           return new Date(b.date) - new Date(a.date);
      }
    });

    state.filtered = list;
  }

  /* ── Render All ─────────────────────────────────────────── */
  function renderAll() {
    applyFilters();
    renderSummaryStats();
    renderRows();
    renderPagination();
    renderProgressChart();
  }

  /* ── Summary Stats ──────────────────────────────────────── */
  function renderSummaryStats() {
    const all    = state.allHistory;
    const total  = all.length;
    const best   = total ? Math.max(...all.map(h => h.confidence)) : 0;
    const avg    = total ? Math.round(all.reduce((s, h) => s + h.confidence, 0) / total) : 0;
    const selected = all.filter(h => h.result === 'Selected').length;
    const rate   = total ? Math.round((selected / total) * 100) : 0;

    animateNum('statTotal',   total);
    setText('statBestConf', best   ? best + '%'  : '—');
    setText('statSelRate',  total ? rate + '%'   : '—');
    setText('statAvgConf',  total ? avg  + '%'   : '—');
  }

  /* ── History Rows ───────────────────────────────────────── */
  function renderRows() {
    const container = document.getElementById('historyRows');
    if (!container) return;

    const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const page  = state.filtered.slice(start, start + ITEMS_PER_PAGE);

    if (!page.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">No interviews found</div>
          <div class="empty-sub">Try adjusting your filters or start a new interview session.</div>
          <a href="../index.html" class="btn-start">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/></svg>
            Start Interview
          </a>
        </div>`;
      return;
    }

    container.innerHTML = page.map((item, i) => {
      const globalIdx = start + i + 1;
      const date = new Date(item.date);
      const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

      const stressClass = { Low: 'stress-low', Medium: 'stress-medium', High: 'stress-high' }[item.stress] || 'stress-medium';
      const resultClass = item.result === 'Selected' ? 'result-selected' : 'result-not';
      const diffClass   = { Easy: 'diff-easy', Medium: 'diff-medium', Hard: 'diff-hard' }[item.difficulty] || 'diff-medium';

      const confCircumf = 2 * Math.PI * 14;
      const confOffset  = confCircumf - (item.confidence / 100) * confCircumf;
      const confColor   = item.confidence >= 80 ? '#10b981' : item.confidence >= 60 ? '#f59e0b' : '#f43f5e';

      return `
        <div class="history-row" data-id="${item.id}" id="row_${item.id}">
          <div class="row-num">${globalIdx}</div>
          <div class="row-info">
            <div class="row-role">${item.role}</div>
            <div class="row-date">${dateStr} · ${timeStr}</div>
          </div>
          <div class="conf-cell">
            <svg class="conf-ring" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="3"/>
              <circle cx="16" cy="16" r="14" fill="none" stroke="${confColor}" stroke-width="3"
                stroke-dasharray="${confCircumf}" stroke-dashoffset="${confOffset}"
                stroke-linecap="round" transform="rotate(-90 16 16)"/>
            </svg>
            <span class="conf-ring-val" style="color:${confColor}">${item.confidence}%</span>
          </div>
          <div><span class="stress-badge ${stressClass}">${item.stress}</span></div>
          <div><span class="difficulty-cell ${diffClass}">${item.difficulty}</span></div>
          <div class="row-result"><span class="result-badge ${resultClass}">${item.result}</span></div>
          <div class="row-actions">
            <button class="icon-btn expand-btn" data-id="${item.id}" title="View Details" aria-label="Expand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button class="icon-btn danger delete-btn" data-id="${item.id}" title="Delete" aria-label="Delete">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            </button>
          </div>
        </div>
        <div class="row-detail" id="detail_${item.id}">
          ${renderDetailHTML(item)}
        </div>`;
    }).join('');

    /* Bind row interactions */
    container.querySelectorAll('.expand-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleExpand(btn.dataset.id);
      });
    });

    container.querySelectorAll('.history-row').forEach(row => {
      row.addEventListener('click', (e) => {
        if (!e.target.closest('.row-actions')) toggleExpand(row.dataset.id);
      });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openDeleteModal(btn.dataset.id);
      });
    });

    container.querySelectorAll('.view-plan-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        openImprovementPlan(btn.dataset.id);
      });
    });
  }

  function renderDetailHTML(item) {
    const sentimentText = item.sentiment > 0.3 ? 'Positive 😊' : item.sentiment > -0.1 ? 'Neutral 😐' : 'Negative 😔';
    return `
      <div class="detail-grid">
        <div class="detail-section">
          <div class="detail-section-title">🎤 Speech Metrics</div>
          <div class="detail-metric"><span class="dm-label">Speaking Rate</span><span class="dm-value">${item.speakingRate} wpm</span></div>
          <div class="detail-metric"><span class="dm-label">Avg Pitch</span><span class="dm-value">${item.avgPitch} Hz</span></div>
          <div class="detail-metric"><span class="dm-label">Pause Duration</span><span class="dm-value">${item.pauseDuration}s</span></div>
          <div class="detail-metric"><span class="dm-label">Filler Words</span><span class="dm-value">${item.fillerWords}</span></div>
          <div class="detail-metric"><span class="dm-label">Response Length</span><span class="dm-value">${item.responseLen} words</span></div>
          <div class="detail-metric"><span class="dm-label">Sentiment</span><span class="dm-value">${sentimentText}</span></div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">💻 Assessment Scores</div>
          <div class="detail-metric"><span class="dm-label">Technical</span><span class="dm-value" style="color:var(--cyan)">${item.techScore}/10</span></div>
          <div class="detail-metric"><span class="dm-label">Communication</span><span class="dm-value" style="color:var(--green)">${item.commScore}/10</span></div>
          <div class="detail-metric"><span class="dm-label">Grammar</span><span class="dm-value" style="color:var(--yellow)">${item.grammarScore}/10</span></div>
          <div class="detail-metric"><span class="dm-label">Eye Contact</span><span class="dm-value" style="color:var(--purple)">${item.eyeContact}/10</span></div>
          <div class="detail-metric"><span class="dm-label">Confidence</span><span class="dm-value">${item.confidence}%</span></div>
          <div class="detail-metric"><span class="dm-label">Stress Level</span><span class="dm-value">${item.stress}</span></div>
        </div>
        <div class="detail-section">
          <div class="detail-section-title">📋 Session Info</div>
          <div class="detail-metric"><span class="dm-label">Role</span><span class="dm-value">${item.role}</span></div>
          <div class="detail-metric"><span class="dm-label">Difficulty</span><span class="dm-value">${item.difficulty}</span></div>
          <div class="detail-metric"><span class="dm-label">Final Result</span><span class="dm-value" style="color:${item.result === 'Selected' ? 'var(--green)' : 'var(--pink)'}">${item.result}</span></div>
          <div class="detail-metric"><span class="dm-label">Date</span><span class="dm-value">${new Date(item.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</span></div>
        </div>
        <div class="transcript-box">
          <div class="transcript-title">📝 Interview Transcript</div>
          <p class="transcript-text">${item.transcript || 'No transcript available for this session.'}</p>
        </div>
      </div>
      <div class="detail-actions">
        <button class="btn-detail-action btn-detail-primary view-plan-btn" data-id="${item.id}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          View Improvement Plan
        </button>
        <a href="../index.html" class="btn-detail-action btn-detail-secondary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.84"/></svg>
          Retry Interview
        </a>
        <a href="recommendations.html" class="btn-detail-action btn-detail-secondary">
          💡 Recommendations
        </a>
      </div>`;
  }

  /* ── Toggle expand ──────────────────────────────────────── */
  function toggleExpand(id) {
    const detail = document.getElementById(`detail_${id}`);
    const row    = document.getElementById(`row_${id}`);
    if (!detail) return;

    const isOpen = detail.classList.contains('open');

    /* Close all */
    document.querySelectorAll('.row-detail.open').forEach(d => d.classList.remove('open'));
    document.querySelectorAll('.history-row.expanded').forEach(r => r.classList.remove('expanded'));

    if (!isOpen) {
      detail.classList.add('open');
      row?.classList.add('expanded');
      state.expandedId = id;
    } else {
      state.expandedId = null;
    }
  }

  /* ── Improvement Plan Modal ─────────────────────────────── */
  function openImprovementPlan(id) {
    const item = state.allHistory.find(h => h.id === id);
    if (!item) return;
    window.location.href = `recommendations.html?session=${id}`;
  }

  /* ── Delete Modal ───────────────────────────────────────── */
  function bindDeleteModal() {
    const overlay     = document.getElementById('deleteOverlay');
    const cancelBtn   = document.getElementById('deleteCancelBtn');
    const confirmBtn  = document.getElementById('deleteConfirmBtn');

    cancelBtn?.addEventListener('click',  () => { overlay?.classList.remove('open'); state.deleteTargetId = null; });
    overlay?.addEventListener('click', (e) => { if (e.target === overlay) { overlay.classList.remove('open'); state.deleteTargetId = null; } });

    confirmBtn?.addEventListener('click', () => {
      if (!state.deleteTargetId) return;
      state.allHistory = state.allHistory.filter(h => h.id !== state.deleteTargetId);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(state.allHistory));
      state.deleteTargetId = null;
      overlay?.classList.remove('open');
      state.currentPage = Math.min(state.currentPage, Math.ceil(state.filtered.length / ITEMS_PER_PAGE) || 1);
      renderAll();
      showToast('Interview session deleted.', 'info');
    });
  }

  function openDeleteModal(id) {
    state.deleteTargetId = id;
    document.getElementById('deleteOverlay')?.classList.add('open');
  }

  /* ── Pagination ─────────────────────────────────────────── */
  function renderPagination() {
    const total     = state.filtered.length;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const start     = (state.currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end       = Math.min(state.currentPage * ITEMS_PER_PAGE, total);

    setText('paginationInfo', total ? `Showing ${start}–${end} of ${total}` : 'No results');

    const btnsEl = document.getElementById('paginationBtns');
    if (!btnsEl) return;

    let html = `<button class="pg-btn" ${state.currentPage === 1 ? 'disabled' : ''} data-page="${state.currentPage - 1}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
    </button>`;

    for (let p = 1; p <= totalPages; p++) {
      if (totalPages <= 7 || p === 1 || p === totalPages || Math.abs(p - state.currentPage) <= 1) {
        html += `<button class="pg-btn ${p === state.currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      } else if (Math.abs(p - state.currentPage) === 2) {
        html += `<span class="pg-btn" style="pointer-events:none;opacity:0.4">…</span>`;
      }
    }

    html += `<button class="pg-btn" ${state.currentPage === totalPages || !totalPages ? 'disabled' : ''} data-page="${state.currentPage + 1}">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;

    btnsEl.innerHTML = html;
    btnsEl.querySelectorAll('.pg-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = parseInt(btn.dataset.page);
        if (p >= 1 && p <= totalPages) {
          state.currentPage = p;
          renderRows();
          renderPagination();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    });
  }

  /* ── Progress Chart (SVG line chart) ───────────────────── */
  function renderProgressChart() {
    const svg   = document.getElementById('progressSvg');
    const lblEl = document.getElementById('lcLabels');
    if (!svg) return;

    const sorted = [...state.allHistory].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-10);
    if (sorted.length < 2) return;

    const W = svg.parentElement?.clientWidth || 600;
    const H = 120;
    const PAD = { t: 10, r: 20, b: 10, l: 36 };
    const innerW = W - PAD.l - PAD.r;
    const innerH = H - PAD.t - PAD.b;

    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    const minC = Math.max(0,   Math.min(...sorted.map(h => h.confidence)) - 10);
    const maxC = Math.min(100, Math.max(...sorted.map(h => h.confidence)) + 10);

    const toX = (i) => PAD.l + (i / (sorted.length - 1)) * innerW;
    const toY = (v) => PAD.t + innerH - ((v - minC) / (maxC - minC)) * innerH;

    /* Grid lines */
    let svgHtml = '';
    for (let g = 0; g <= 4; g++) {
      const y = PAD.t + (g / 4) * innerH;
      const val = Math.round(maxC - (g / 4) * (maxC - minC));
      svgHtml += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>`;
      svgHtml += `<text x="${PAD.l - 6}" y="${y + 4}" fill="rgba(255,255,255,0.3)" font-size="9" text-anchor="end">${val}</text>`;
    }

    /* Area fill */
    let areaPath = `M ${toX(0)} ${H - PAD.b}`;
    sorted.forEach((_, i) => { areaPath += ` L ${toX(i)} ${toY(sorted[i].confidence)}`; });
    areaPath += ` L ${toX(sorted.length - 1)} ${H - PAD.b} Z`;
    svgHtml += `<defs>
      <linearGradient id="lcGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00f5ff" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="#00f5ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#lcGrad)"/>`;

    /* Line */
    let linePath = '';
    sorted.forEach((item, i) => {
      linePath += (i === 0 ? 'M' : 'L') + ` ${toX(i)} ${toY(item.confidence)} `;
    });
    svgHtml += `<path d="${linePath}" fill="none" stroke="url(#lcLine)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    svgHtml += `<defs><linearGradient id="lcLine" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#00f5ff"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>`;

    /* Dots */
    sorted.forEach((item, i) => {
      const x = toX(i), y = toY(item.confidence);
      const dotColor = item.result === 'Selected' ? '#10b981' : '#f43f5e';
      svgHtml += `<circle cx="${x}" cy="${y}" r="4" fill="${dotColor}" stroke="#080b14" stroke-width="2"/>`;
    });

    svg.innerHTML = svgHtml;

    /* X labels */
    if (lblEl) {
      lblEl.innerHTML = sorted.map(h => {
        const d = new Date(h.date);
        return `<span>${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>`;
      }).join('');
    }
  }

  /* ── Export CSV ─────────────────────────────────────────── */
  function bindExport() {
    document.getElementById('exportBtn')?.addEventListener('click', () => {
      const headers = ['Date', 'Role', 'Difficulty', 'Confidence', 'Stress', 'Result', 'Speaking Rate', 'Filler Words'];
      const rows = state.allHistory.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.role, h.difficulty, h.confidence + '%', h.stress, h.result,
        h.speakingRate + ' wpm', h.fillerWords
      ]);
      const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'interview_history.csv'; a.click();
      URL.revokeObjectURL(url);
      showToast('History exported as CSV!', 'success');
    });
  }

  /* ── Helpers ────────────────────────────────────────────── */
  function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }

  function animateNum(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, target);
      el.textContent = cur;
      if (cur >= target) clearInterval(t);
    }, 25);
  }

  let _toastTimer;
  function showToast(msg, type = 'success') {
    const el = document.getElementById('toastHist');
    if (!el) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    el.innerHTML = `<span>${icons[type]||'✅'}</span><span>${msg}</span>`;
    el.classList.add('show');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
  }

})();