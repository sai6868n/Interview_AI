(function () {
  'use strict';

  const state = {
    user: null,
    history: [],
    tasks: [],
    tasksDone: new Set(),
  };

  const ALL_TASKS = [
    { id:1, text:'Speak confidently for 2 minutes without filler words',         xp:'+20 XP', category:'Speech'    },
    { id:2, text:'Practice the STAR method for a behavioral question',            xp:'+25 XP', category:'Structure' },
    { id:3, text:'Record yourself answering "Tell me about yourself"',            xp:'+30 XP', category:'Recording' },
    { id:4, text:'Reduce filler words — aim for 0 in 60 seconds',                xp:'+15 XP', category:'Speech'    },
    { id:5, text:'Explain a technical concept to a non-technical person',         xp:'+20 XP', category:'Technical' },
    { id:6, text:'Practice maintaining eye contact for 1 full minute',            xp:'+15 XP', category:'Body Lang' },
    { id:7, text:'Write 3 strong STAR stories from past experience',              xp:'+35 XP', category:'Structure' },
    { id:8, text:'Do a mock interview with a peer',                               xp:'+40 XP', category:'Practice'  },
    { id:9, text:'Review your last interview transcript and note improvements',    xp:'+20 XP', category:'Review'   },
    { id:10,text:'Practice box breathing 4 rounds before your next session',      xp:'+10 XP', category:'Mindset'  },
  ];

  const ROLE_ICONS = {
    'Software Engineer':'💻','Data Scientist':'🔬','Frontend Developer':'🎨',
    'ML Engineer':'🤖','Data Analyst':'📊','Backend Developer':'⚙️',
  };

  document.addEventListener('DOMContentLoaded', () => {
    loadUser();
    loadHistory();
    loadTasks();
    renderAll();
    initSidebar();
    initScrollHighlight();
    console.log('[Dashboard] Initialized ✓');
  });

  function loadUser() {
    const stored = localStorage.getItem('interviewai_user') || sessionStorage.getItem('interviewai_user');
    state.user = stored ? JSON.parse(stored) : { name:'Guest User', email:'guest@interviewai.app', provider:'guest' };
  }

  function loadHistory() {
    const email = state.user?.email || 'guest';
    const stored = localStorage.getItem('interviewai_history_'+email);
    state.history = stored ? JSON.parse(stored) : [];
  }

  function loadTasks() {
    const today = new Date().toDateString();
    const savedDate  = localStorage.getItem('interviewai_task_date');
    const savedTasks = localStorage.getItem('interviewai_tasks');
    const savedDone  = localStorage.getItem('interviewai_tasks_done');

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

  function renderUserInfo() {
    const u = state.user;
    const avatarText = u.name ? u.name.slice(0,2).toUpperCase() : 'GU';
    setText('welcomeName', u.name?.split(' ')[0] || 'there');
    setText('userName', u.name || 'Guest');
    setText('userEmail', u.email || 'guest session');
    setText('profileName', u.name || 'Guest');
    setText('profileEmailDisplay', u.email || '—');
    setText('avatarSm', avatarText);
    setText('profileAvatar', avatarText);

    // Apply avatar gradient if stored
    try {
      const grad = JSON.parse(localStorage.getItem('interviewai_user') || '{}')?.avatarGradient;
      if (grad) {
        ['profileAvatar','avatarSm'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.background = grad;
        });
      }
    } catch(e) {}
  }

  function renderStats() {
    const total    = state.history.length;
    const selected = state.history.filter(h => (h.result||h.interview_result||'').toLowerCase().includes('selected') && !(h.result||h.interview_result||'').toLowerCase().includes('not')).length;
    const confVals = state.history.map(h => h.confidence || h.confidence_score || 0);
    const avgConf  = total ? Math.round(confVals.reduce((s,v)=>s+v,0)/total) : 0;
    const rate     = total ? Math.round((selected/total)*100) : 0;

    // Compute streak
    const email = state.user?.email||'guest';
    const sorted = [...state.history].filter(h=>h.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
    let streak=0,prev=new Date();prev.setHours(0,0,0,0);
    for(const h of sorted){const d=new Date(h.date);d.setHours(0,0,0,0);if((prev-d)/86400000<=1){streak++;prev=d;}else break;}
    localStorage.setItem('interviewai_streak_'+email, streak);

    animateCount('statInterviews', total);
    animateCount('statConfidence', avgConf, '%');
    animateCount('statRate', rate, '%');
    animateCount('statStreak', streak);

    setText('pStatInterviews', total);
    setText('pStatConf', avgConf+'%');
    setText('pStatRate', rate+'%');

    const streakPct = Math.min((streak/30)*100,100);
    const streakFill = document.getElementById('streakFill');
    if (streakFill) setTimeout(()=>{streakFill.style.width=streakPct+'%';},300);
    setText('streakCount', streak+'d');

    // Update welcome sub dynamically
    const pendingTasks = state.tasks.length - state.tasksDone.size;
    const recsCount = 3; // approximate
    setText('welcomeSub', total
      ? `You have ${pendingTasks} pending task${pendingTasks!==1?'s':''} and ${total} interview${total!==1?'s':''} completed.`
      : `Welcome! Start your first interview to see your analytics here.`);
  }

  function renderBarChart() {
    const container = document.getElementById('barChart');
    if (!container) return;

    // Use real history for chart (last 7 sessions)
    const recent = state.history.slice(0, 7).reverse();

    if (!recent.length) {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:rgba(255,255,255,0.3);font-size:13px;width:100%">Complete interviews to see your chart</div>`;
      return;
    }

    const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const maxH = 112;
    container.innerHTML = recent.map((h, i) => {
      const conf   = Math.max(h.confidence || h.confidence_score || 0, 0);
      const stress = h.stress === 'High' ? 80 : h.stress === 'Medium' ? 50 : 20;
      const d = h.date ? new Date(h.date) : new Date();
      return `
        <div class="bar-group" style="animation-delay:${i*0.06}s">
          <div class="bar-col bar-conf"   data-h="${(conf/100)*maxH}"   style="height:4px" title="Confidence: ${Math.round(conf)}%"></div>
          <div class="bar-col bar-stress" data-h="${(stress/100)*maxH}" style="height:4px" title="Stress: ${h.stress||'—'}"></div>
          <span class="bar-label">${DAYS[d.getDay()]}</span>
        </div>`;
    }).join('');

    setTimeout(() => {
      container.querySelectorAll('.bar-col').forEach(bar => {
        bar.style.transition = 'height 0.8s cubic-bezier(0.34,1.4,0.64,1)';
        bar.style.height = bar.dataset.h+'px';
      });
    }, 150);
  }

  function renderRadials() {
    const container = document.getElementById('radialGrid');
    if (!container) return;

    const h = state.history;
    const avg = field => h.length ? h.reduce((s,x)=>s+(parseFloat(x[field])||0),0)/h.length : 0;

    const SKILLS = h.length ? [
      { label:'Confidence', pct:Math.min(100,Math.round(avg('confidence_score')||avg('confidence'))),  color:'#00f5ff' },
      { label:'Technical',  pct:Math.min(100,Math.round((avg('Technical_Correctness')||avg('techScore'))*10)),      color:'#7c3aed' },
      { label:'Speech',     pct:Math.min(100,Math.round((avg('Communication_Score')||avg('commScore'))*10)),         color:'#10b981' },
      { label:'Grammar',    pct:Math.min(100,Math.round((avg('Grammar_Score')||avg('grammarScore'))*10)),            color:'#f59e0b' },
      { label:'Eye Contact',pct:Math.min(100,Math.round((avg('Eye_Contact_Score')||avg('eyeContact'))*10)),          color:'#f43f5e' },
      { label:'Sentiment',  pct:Math.min(100,Math.round(Math.max(0,(avg('Sentiment_Score')||avg('sentiment'))+1)*50)),color:'#3b82f6' },
    ] : [
      {label:'Confidence',pct:0,color:'#00f5ff'},{label:'Technical',pct:0,color:'#7c3aed'},
      {label:'Speech',pct:0,color:'#10b981'},{label:'Grammar',pct:0,color:'#f59e0b'},
      {label:'Eye Contact',pct:0,color:'#f43f5e'},{label:'Sentiment',pct:0,color:'#3b82f6'},
    ];

    const r=28, circumference=2*Math.PI*r;

    container.innerHTML = SKILLS.map(s => {
      const offset = circumference - (s.pct/100)*circumference;
      const id = 'rg_'+s.label.replace(/\s/g,'');
      return `
        <div class="radial-item">
          <svg class="radial-svg" viewBox="0 0 72 72">
            <circle class="radial-track" cx="36" cy="36" r="${r}"/>
            <circle class="radial-fill" cx="36" cy="36" r="${r}" stroke="${s.color}"
              stroke-dasharray="${circumference}" stroke-dashoffset="${circumference}" id="${id}"/>
            <text class="radial-pct" x="36" y="36" style="font-size:13px;font-weight:800;fill:white;font-family:'Syne',sans-serif">${s.pct}%</text>
          </svg>
          <div class="radial-label">${s.label}</div>
        </div>`;
    }).join('');

    setTimeout(() => {
      SKILLS.forEach(s => {
        const el = document.getElementById('rg_'+s.label.replace(/\s/g,''));
        if (el) el.style.strokeDashoffset = circumference-(s.pct/100)*circumference;
      });
    }, 250);
  }

  function renderHistory() {
    const container = document.getElementById('historyList');
    if (!container) return;

    const items = state.history.slice(0, 4);
    if (!items.length) {
      container.innerHTML = `<div style="padding:24px;text-align:center;color:rgba(255,255,255,0.3);font-size:13px">No interviews yet — start your first analysis!</div>`;
      return;
    }

    container.innerHTML = items.map(h => {
      const icon = ROLE_ICONS[h.role] || '💼';
      const conf = h.confidence || h.confidence_score || 0;
      const result = h.result || h.interview_result || 'Not Selected';
      const isSelected = result.toLowerCase().includes('selected') && !result.toLowerCase().includes('not');
      const confColor = conf>=80?'#10b981':conf>=60?'#f59e0b':'#f43f5e';
      const diff = h.difficulty || h.diff || '—';
      const stress = h.stress || h.stress_level || '—';
      return `
        <div class="history-item">
          <div class="history-icon" style="background:${isSelected?'rgba(16,185,129,0.1)':'rgba(244,63,94,0.1)'}">${icon}</div>
          <div class="history-info">
            <div class="history-title">${h.role || 'Interview'}</div>
            <div class="history-meta">
              <span>📅 ${formatDate(h.date)}</span>
              <span>⚡ ${diff}</span>
              <span style="color:${confColor};font-weight:600">💡 ${Math.round(conf)}%</span>
              <span>🧠 ${stress}</span>
            </div>
          </div>
          <span class="history-result ${isSelected?'result-selected':'result-not'}">
            ${isSelected?'✓ Selected':'✕ Rejected'}
          </span>
        </div>`;
    }).join('');
  }

  function renderLeaderboard() {
    const container = document.getElementById('lbMini');
    if (!container) return;

    const currentEmail = state.user?.email;
    const allEntries = [];

    for (let i=0; i<localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key||!key.startsWith('interviewai_history_')) continue;
      const email = key.replace('interviewai_history_','');
      if (email==='guest') continue;
      try {
        const history = JSON.parse(localStorage.getItem(key)||'[]');
        if (!history.length) continue;
        const avgConf = Math.round(history.reduce((s,h)=>s+(h.confidence||h.confidence_score||0),0)/history.length);
        const regData = JSON.parse(localStorage.getItem('interviewai_registered_'+email)||'{}');
        const userObj = JSON.parse(localStorage.getItem('interviewai_user')||'{}');
        const name = regData.name || (userObj.email===email?userObj.name:null) || email.split('@')[0];
        allEntries.push({name, email, conf:avgConf});
      } catch(e) {}
    }

    allEntries.sort((a,b) => b.conf-a.conf);

    if (!allEntries.length) {
      container.innerHTML = `<div style="padding:20px;color:var(--text2);font-size:13px;text-align:center">Complete an interview to appear here! 🏆</div>`;
      return;
    }

    const rankClasses = ['rank-1','rank-2','rank-3','rank-n','rank-n'];
    const rankLabels  = ['1st','2nd','3rd','4th','5th'];

    container.innerHTML = allEntries.slice(0,5).map((u,i) => {
      const isMe = u.email === currentEmail;
      const avatarText = u.name.slice(0,2).toUpperCase();
      const avatarBg = isMe?'linear-gradient(135deg,#00f5ff,#7c3aed)':'linear-gradient(135deg,rgba(0,245,255,0.2),rgba(124,58,237,0.2))';
      return `
        <div class="lb-mini-row ${isMe?'me':''}">
          <div class="lb-rank-badge ${rankClasses[i]||'rank-n'}">${rankLabels[i]||'#'+(i+1)}</div>
          <div class="lb-mini-avatar" style="background:${avatarBg}">${avatarText}</div>
          <span class="lb-mini-name">${isMe?u.name+' (You)':u.name}</span>
          <span class="lb-mini-conf">${u.conf}%</span>
        </div>`;
    }).join('');
  }

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
      badge.style.display = remaining>0?'':'none';
    }

    container.innerHTML = state.tasks.map(t => {
      const done = state.tasksDone.has(t.id);
      return `
        <div class="task-item ${done?'done':''}" data-id="${t.id}">
          <div class="task-check">${done?'✓':''}</div>
          <div class="task-info">
            <div class="task-text">${t.text}</div>
            <div class="task-xp">${done?'✓ Earned ':'' }${t.xp}</div>
          </div>
          <span class="task-category">${t.category}</span>
        </div>`;
    }).join('');

    container.querySelectorAll('.task-item').forEach(item => {
      item.addEventListener('click', () => toggleTask(parseInt(item.dataset.id)));
    });

    document.getElementById('refreshTasks')?.addEventListener('click', () => {
      state.tasksDone.clear();
      const shuffled = [...ALL_TASKS].sort(()=>Math.random()-0.5);
      state.tasks = shuffled.slice(0,5);
      localStorage.setItem('interviewai_tasks', JSON.stringify(state.tasks));
      saveTasks();
      renderTasks();
      showToast('Daily tasks refreshed! 🔄','info');
    });
  }

  function toggleTask(id) {
    if (state.tasksDone.has(id)) state.tasksDone.delete(id);
    else { state.tasksDone.add(id); showToast('Task completed! 🎉 XP earned.','success'); }
    saveTasks();
    renderTasks();
  }

  /* ─── RECOMMENDATIONS — generated from real history ─────── */
  function renderRecommendations() {
    const container = document.getElementById('recsList');
    if (!container) return;

    const h = state.history;
    const recs = [];

    if (!h.length) {
      container.innerHTML = `<div style="padding:16px;color:rgba(255,255,255,0.35);font-size:13px;text-align:center">Complete an interview to get personalized recommendations.</div>`;
      return;
    }

    const avg = field => h.reduce((s,x)=>s+(parseFloat(x[field])||0),0)/h.length;
    const avgConf   = avg('confidence_score');
    const avgFiller = avg('Filler_Words');
    const avgEye    = avg('Eye_Contact_Score');
    const avgTech   = avg('Technical_Correctness');
    const avgComm   = avg('Communication_Score');
    const stressHigh = h.filter(x=>(x.stress_level||x.stress||'').toLowerCase()==='high').length;

    if (avgFiller>3)  recs.push({icon:'🗣️',title:'Reduce Filler Words',   desc:`Avg ${avgFiller.toFixed(1)} fillers per session. Practice the pause-breathe-respond technique.`,priority:'high',bg:'rgba(244,63,94,0.1)',color:'#f43f5e'});
    if (avgConf<70)   recs.push({icon:'💡',title:'Build Confidence',        desc:`Confidence at ${avgConf.toFixed(1)}%. Pre-load 5–7 STAR stories and practice power posing.`,priority:avgConf<50?'high':'med',bg:'rgba(245,158,11,0.1)',color:'#f59e0b'});
    if (stressHigh>=2)recs.push({icon:'🧠',title:'Manage Stress',           desc:`High stress in ${stressHigh} sessions. Try physiological sighs and box breathing before recording.`,priority:'high',bg:'rgba(244,63,94,0.1)',color:'#f43f5e'});
    if (avgTech<7)    recs.push({icon:'⚙️',title:'Deepen Technical Skills', desc:`Technical score ${avgTech.toFixed(1)}/10. Solve 1 LeetCode problem daily and narrate your approach.`,priority:'high',bg:'rgba(124,58,237,0.1)',color:'#7c3aed'});
    if (avgEye<7)     recs.push({icon:'👁️',title:'Improve Eye Contact',     desc:`Eye contact ${avgEye.toFixed(1)}/10. Place a dot sticker near your camera for focus.`,priority:'low',bg:'rgba(16,185,129,0.1)',color:'#10b981'});
    if (avgComm<7)    recs.push({icon:'💬',title:'Structure Your Answers',   desc:`Communication ${avgComm.toFixed(1)}/10. Use the STAR method — Situation, Task, Action, Result.`,priority:'med',bg:'rgba(59,130,246,0.1)',color:'#3b82f6'});

    if (!recs.length) {
      recs.push({icon:'🌟',title:'Keep It Up!',desc:'Your metrics look solid. Keep practicing consistently to maintain your edge.',priority:'low',bg:'rgba(16,185,129,0.1)',color:'#10b981'});
    }

    container.innerHTML = recs.slice(0,4).map(r => `
      <div class="rec-item">
        <div class="rec-icon" style="background:${r.bg};color:${r.color}">${r.icon}</div>
        <div class="rec-info">
          <div class="rec-title">${r.title}</div>
          <div class="rec-desc">${r.desc}</div>
        </div>
        <span class="rec-priority priority-${r.priority}">${r.priority==='high'?'HIGH':r.priority==='med'?'MED':'LOW'}</span>
      </div>`).join('');
  }

  function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;

    const h = state.history;
    const earned = [];

    if (h.length >= 1) earned.push({icon:'🎯',label:'First Interview',color:'rgba(0,245,255,0.15)',text:'#00f5ff'});

    // Streak
    const sorted=[...h].filter(x=>x.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
    let streak=0,prev=new Date();prev.setHours(0,0,0,0);
    for(const x of sorted){const d=new Date(x.date);d.setHours(0,0,0,0);if((prev-d)/86400000<=1){streak++;prev=d;}else break;}
    if(streak>=7) earned.push({icon:'🔥',label:'7-Day Streak',color:'rgba(245,158,11,0.15)',text:'#f59e0b'});
    if(streak>=3) earned.push({icon:'📅',label:'3-Day Streak',color:'rgba(236,72,153,0.15)',text:'#ec4899'});

    const avgConf=h.length?h.reduce((s,x)=>s+(x.confidence_score||x.confidence||0),0)/h.length:0;
    if(avgConf>=80) earned.push({icon:'💡',label:'Confident',color:'rgba(251,191,36,0.15)',text:'#fbbf24'});

    const hasSelected=h.some(x=>(x.interview_result||x.result||'').toLowerCase().includes('selected')&&!(x.interview_result||x.result||'').toLowerCase().includes('not'));
    if(hasSelected) earned.push({icon:'🏆',label:'Selected!',color:'rgba(16,185,129,0.15)',text:'#10b981'});
    if(h.length>=5) earned.push({icon:'🔥',label:'On Fire (5)',color:'rgba(249,115,22,0.15)',text:'#f97316'});
    if(h.length>=10)earned.push({icon:'⚡',label:'Veteran (10)',color:'rgba(124,58,237,0.15)',text:'#7c3aed'});

    if (!earned.length) {
      container.innerHTML = `<div style="font-size:11px;color:rgba(255,255,255,0.3)">Complete interviews to unlock achievements!</div>`;
      return;
    }

    container.innerHTML = earned.slice(0,6).map(a => `
      <div class="badge-chip" style="background:${a.color};border-color:${a.text}33;color:${a.text}">
        <span>${a.icon}</span><span>${a.label}</span>
      </div>`).join('');
  }

  function initSidebar() {
    const mobileBtn  = document.getElementById('mobileMenuBtn');
    const sidebar    = document.getElementById('sidebar');
    const overlay    = document.getElementById('sidebarOverlay');
    const logoutLink = document.getElementById('logoutLink');

    const openSidebar  = () => { sidebar?.classList.add('mobile-open'); overlay?.classList.add('open'); document.body.style.overflow='hidden'; };
    const closeSidebar = () => { sidebar?.classList.remove('mobile-open'); overlay?.classList.remove('open'); document.body.style.overflow=''; };

    mobileBtn?.addEventListener('click', () => sidebar?.classList.contains('mobile-open') ? closeSidebar() : openSidebar());
    overlay?.addEventListener('click', closeSidebar);

    logoutLink?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('interviewai_user');
      sessionStorage.removeItem('interviewai_user');
      showToast('Logged out successfully.','info');
      setTimeout(() => { window.location.href='index.html'; }, 700);
    });
  }

  function initScrollHighlight() {
    if (window.location.hash === '#tasks') {
      setTimeout(() => { document.getElementById('tasks')?.scrollIntoView({behavior:'smooth',block:'start'}); }, 400);
    }
  }

  function setText(id, value) { const el=document.getElementById(id);if(el)el.textContent=value; }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  }

  function animateCount(id, target, suffix='') {
    const el=document.getElementById(id);if(!el)return;
    let current=0;const steps=40,inc=target/steps;
    const timer=setInterval(()=>{current+=inc;if(current>=target){current=target;clearInterval(timer);}el.textContent=Math.round(current)+suffix;},28);
  }

  let toastTimer;
  function showToast(msg, type='success') {
    const el=document.getElementById('toastDb');if(!el)return;
    const icons={success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
    el.innerHTML=`<span>${icons[type]||'✅'}</span><span>${msg}</span>`;
    el.className='toast-db show';
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>{el.className='toast-db';},3200);
  }

  window.dashboardShowToast = showToast;
})();