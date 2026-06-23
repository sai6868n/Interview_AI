'use strict';

const State = { user: null, history: [], editing: false, pwOpen: false };

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
  { id:'first_interview', icon:'🎤', name:'First Take',   desc:'Complete your first interview',          check:(h)=>h.length>=1,              accent:'#00f5ff' },
  { id:'high_confidence', icon:'💡', name:'Confident',    desc:'Score 80%+ confidence',                  check:(h)=>h.some(s=>(s.confidence_score||0)>=80), accent:'#fbbf24' },
  { id:'selected',        icon:'🏆', name:'Selected!',    desc:'Get "Selected" result',                  check:(h)=>h.some(s=>(s.interview_result||'').toLowerCase().includes('selected')&&!(s.interview_result||'').toLowerCase().includes('not')), accent:'#10b981' },
  { id:'five_sessions',   icon:'🔥', name:'On Fire',      desc:'Complete 5 interviews',                  check:(h)=>h.length>=5,              accent:'#f97316' },
  { id:'ten_sessions',    icon:'⚡', name:'Veteran',      desc:'Complete 10 interviews',                 check:(h)=>h.length>=10,             accent:'#7c3aed' },
  { id:'low_stress',      icon:'🧘', name:'Zen Mode',     desc:'Get Low stress 3 times',                 check:(h)=>h.filter(s=>(s.stress_level||'').toLowerCase()==='low').length>=3, accent:'#06b6d4' },
  { id:'perfect_technical',icon:'⚙️',name:'Engineer',    desc:'Score 10/10 technical',                  check:(h)=>h.some(s=>(s.Technical_Correctness||0)>=10), accent:'#3b82f6' },
  { id:'streak_3',        icon:'📅', name:'3-Day Streak', desc:'3 days in a row',                       check:(h,streak)=>streak>=3,         accent:'#ec4899' },
  { id:'consistent',      icon:'🌟', name:'Consistent',   desc:'Avg confidence > 70%',                  check:(h)=>{if(h.length<3)return false;const avg=h.reduce((s,x)=>s+(x.confidence_score||0),0)/h.length;return avg>=70;}, accent:'#a855f7' },
];

function safeGet(key, fallback=null) { try{const v=localStorage.getItem(key);return v!==null?JSON.parse(v):fallback;}catch{return fallback;} }
function safeSet(key,val) { try{localStorage.setItem(key,JSON.stringify(val));}catch{} }
function initials(name) { if(!name)return'?';return name.trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase(); }
function formatDate(iso) { if(!iso)return'—';try{return new Date(iso).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});}catch{return'—';} }

let toastTimer;
function showToast(msg, type='info') {
  const t = document.getElementById('toastProfile');
  if (!t) return;
  const colors = {success:'#10b981',error:'#f43f5e',info:'#00f5ff',warn:'#fbbf24'};
  t.style.borderLeftColor = colors[type] || colors.info;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

function loadData() {
  State.user = safeGet('interviewai_user') || {
    name:'Guest User', email:'guest@interviewai.com', role:'', target:'', exp:'', bio:'',
    plan:'Free', joined:new Date().toISOString(), avatarGradient:AVATAR_GRADIENTS[0], password:'demo1234',
  };
  if (!State.user.password) State.user.password = 'demo1234';
  const email = State.user.email || 'guest';
  State.history = safeGet('interviewai_history_'+email) || safeGet('interviewai_history') || [];
}

function computeStreak() {
  if (!State.history.length) return 0;
  const sorted = [...State.history].filter(h=>h.date).sort((a,b)=>new Date(b.date)-new Date(a.date));
  let streak=0, prev=new Date(); prev.setHours(0,0,0,0);
  for (const h of sorted) {
    const d=new Date(h.date); d.setHours(0,0,0,0);
    if((prev-d)/86400000<=1){streak++;prev=d;}else break;
  }
  return streak;
}
function computeAvgConf() {
  if (!State.history.length) return 0;
  return Math.round(State.history.reduce((s,h)=>s+(h.confidence_score||0),0)/State.history.length);
}
function countSelected() {
  return State.history.filter(h=>(h.interview_result||'').toLowerCase().includes('selected')&&!(h.interview_result||'').toLowerCase().includes('not')).length;
}

/* ─── PERSONALIZED ANALYSIS FEEDBACK ─────────────────────────
   Generates specific, actionable feedback from the user's real
   interview data — eye contact, speech, filler words, etc.
─────────────────────────────────────────────────────────────*/
function generatePersonalizedFeedback() {
  const h = State.history;
  if (!h.length) return null;

  const avg = field => h.reduce((s,x) => s+(parseFloat(x[field])||0),0) / h.length;
  const avgConf   = avg('confidence_score');
  const avgEye    = avg('Eye_Contact_Score');
  const avgFiller = avg('Filler_Words');
  const avgRate   = avg('Speaking_Rate');
  const avgComm   = avg('Communication_Score');
  const avgTech   = avg('Technical_Correctness');
  const avgGram   = avg('Grammar_Score');
  const stressHigh = h.filter(x=>(x.stress_level||'').toLowerCase()==='high').length;

  const feedback = [];

  // Eye Contact
  if (avgEye > 0) {
    if (avgEye < 5) {
      feedback.push({ icon:'👁️', label:'Eye Contact', color:'#f43f5e', level:'Needs Work',
        msg:`Your average eye contact score is ${avgEye.toFixed(1)}/10. Try placing a small sticker near your camera lens and practice looking directly at it instead of the screen.` });
    } else if (avgEye < 7) {
      feedback.push({ icon:'👁️', label:'Eye Contact', color:'#f59e0b', level:'Improving',
        msg:`Eye contact at ${avgEye.toFixed(1)}/10 is decent but can be stronger. Practice the "triangle technique" — alternate between both eyes and forehead.` });
    } else {
      feedback.push({ icon:'👁️', label:'Eye Contact', color:'#10b981', level:'Strong',
        msg:`Great eye contact at ${avgEye.toFixed(1)}/10! You project confidence visually. Keep maintaining this.` });
    }
  }

  // Filler Words
  if (avgFiller > 0 || h.some(x=>x.Filler_Words != null)) {
    if (avgFiller > 5) {
      feedback.push({ icon:'🗣️', label:'Filler Words', color:'#f43f5e', level:'Needs Work',
        msg:`You average ${avgFiller.toFixed(1)} filler words per response. Record yourself and count "um", "uh", "like". Replace them with a deliberate 1-second pause.` });
    } else if (avgFiller > 2) {
      feedback.push({ icon:'🗣️', label:'Filler Words', color:'#f59e0b', level:'Moderate',
        msg:`About ${avgFiller.toFixed(1)} filler words per session. You're improving — try the "pause-breathe-respond" technique before answering each question.` });
    } else {
      feedback.push({ icon:'🗣️', label:'Filler Words', color:'#10b981', level:'Excellent',
        msg:`Only ${avgFiller.toFixed(1)} filler words on average — that's impressive! Your speech clarity is a strong asset.` });
    }
  }

  // Speaking Rate
  if (avgRate > 0) {
    if (avgRate > 160) {
      feedback.push({ icon:'⏱️', label:'Speaking Rate', color:'#f43f5e', level:'Too Fast',
        msg:`You speak at ${avgRate.toFixed(0)} wpm — above the ideal 120–150 wpm range. Slowing down projects calm and clarity. Practice with a metronome at 120 bpm.` });
    } else if (avgRate < 90) {
      feedback.push({ icon:'⏱️', label:'Speaking Rate', color:'#f59e0b', level:'Too Slow',
        msg:`At ${avgRate.toFixed(0)} wpm, your pace is slower than optimal. Read aloud from news articles daily to build a more natural, energetic rhythm.` });
    } else {
      feedback.push({ icon:'⏱️', label:'Speaking Rate', color:'#10b981', level:'Optimal',
        msg:`Your speaking rate of ${avgRate.toFixed(0)} wpm is in the ideal range. Interviewers can follow you comfortably.` });
    }
  }

  // Confidence
  if (avgConf > 0) {
    if (avgConf < 50) {
      feedback.push({ icon:'💡', label:'Confidence', color:'#f43f5e', level:'Low',
        msg:`Your average confidence score is ${avgConf.toFixed(1)}%. Focus on preparation — pre-load 5–7 STAR stories so answers flow without hesitation.` });
    } else if (avgConf < 70) {
      feedback.push({ icon:'💡', label:'Confidence', color:'#f59e0b', level:'Building',
        msg:`Confidence at ${avgConf.toFixed(1)}% is progressing. Try 2-minute power posing before sessions and box breathing (4-4-4-4) to reduce pre-interview anxiety.` });
    } else {
      feedback.push({ icon:'💡', label:'Confidence', color:'#10b981', level:'High',
        msg:`Excellent confidence score of ${avgConf.toFixed(1)}%! You demonstrate strong command in your sessions. Keep up the consistent practice.` });
    }
  }

  // Technical
  if (avgTech > 0) {
    if (avgTech < 6) {
      feedback.push({ icon:'⚙️', label:'Technical Accuracy', color:'#f43f5e', level:'Needs Work',
        msg:`Technical correctness averaging ${avgTech.toFixed(1)}/10. Solve one LeetCode problem daily and focus on narrating your thought process out loud.` });
    } else if (avgTech < 8) {
      feedback.push({ icon:'⚙️', label:'Technical Accuracy', color:'#f59e0b', level:'Moderate',
        msg:`Technical score of ${avgTech.toFixed(1)}/10 shows solid basics. Deepen your knowledge of data structures and system design fundamentals.` });
    } else {
      feedback.push({ icon:'⚙️', label:'Technical Accuracy', color:'#10b981', level:'Strong',
        msg:`Technical correctness at ${avgTech.toFixed(1)}/10 is impressive. You clearly have strong domain knowledge.` });
    }
  }

  // Stress
  if (stressHigh > 0) {
    feedback.push({ icon:'🧠', label:'Stress Management', color:stressHigh>=2?'#f43f5e':'#f59e0b', level:stressHigh>=2?'High Stress':'Moderate Stress',
      msg:`You showed high stress in ${stressHigh} session${stressHigh>1?'s':''}. Try the physiological sigh: double inhale through the nose, long exhale. It's the fastest known stress reducer.` });
  }

  // Communication
  if (avgComm > 0 && avgComm < 7) {
    feedback.push({ icon:'💬', label:'Communication', color:'#f59e0b', level:'Developing',
      msg:`Communication score of ${avgComm.toFixed(1)}/10. Structure answers using the STAR method (Situation, Task, Action, Result) to greatly improve clarity and impact.` });
  }

  return feedback;
}

/* ─── RENDER HERO ───────────────────────────────────────── */
function renderHero() {
  const u = State.user;
  const inits = initials(u.name);

  ['profileAvatar','avatarSm'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    // If user has an uploaded photo, show it
    if (u.avatarPhoto) {
      el.style.backgroundImage = `url(${u.avatarPhoto})`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = inits;
      el.style.background = u.avatarGradient || AVATAR_GRADIENTS[0];
    }
  });

  setEl('heroName', u.name||'Guest User');
  setEl('heroEmail', u.email||'—');
  setEl('sidebarUserName', u.name||'Guest');
  setEl('sidebarUserEmail', u.email||'—');

  const planBadge = document.getElementById('heroPlanBadge');
  if (planBadge) planBadge.textContent = (u.plan||'Free')+' Plan';

  const streak = computeStreak();
  const streakBadge = document.getElementById('heroStreakBadge');
  if (streakBadge) streakBadge.textContent = `🔥 ${streak} day streak`;
}

function renderInfoView() {
  const u = State.user;
  setEl('infoName',   u.name   ||'—');
  setEl('infoEmail',  u.email  ||'—');
  setEl('infoRole',   u.role   ||'—');
  setEl('infoTarget', u.target ||'—');
  setEl('infoExp',    u.exp    ? u.exp+' years' : '—');
  setEl('infoBio',    u.bio    ||'—');
}

function renderStats() {
  const streak   = computeStreak();
  const avgConf  = computeAvgConf();
  const selected = countSelected();

  animCounter(document.getElementById('statInterviews'), State.history.length);
  animCounter(document.getElementById('statSelected'),   selected);
  animCounter(document.getElementById('statStreak'),     streak);

  const confEl = document.getElementById('statAvgConf');
  if (confEl) {
    const start = performance.now();
    const step = ts => {
      const p = Math.min((ts-start)/700,1);
      confEl.textContent = Math.round(avgConf*p)+'%';
      if(p<1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const joinedEl = document.getElementById('statJoined');
  if (joinedEl) joinedEl.textContent = formatDate(State.user.joined);
}

function animCounter(el, target, duration=700) {
  if (!el) return;
  const from=parseInt(el.textContent)||0, start=performance.now();
  const step=ts=>{const p=Math.min((ts-start)/duration,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(from+(target-from)*e);if(p<1)requestAnimationFrame(step);};
  requestAnimationFrame(step);
}

function renderAchievements() {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;
  const streak = computeStreak();
  grid.innerHTML = ACHIEVEMENTS.map(a => {
    const earned = a.check(State.history, streak);
    return `<div class="achievement-item ${earned?'earned':'ach-locked'}" style="${earned?`--accent-color:${a.accent}`:''}">
      <div class="ach-icon">${earned?a.icon:'🔒'}</div>
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
  const avg = field => State.history.map(h=>parseFloat(h[field]||0)).reduce((s,v)=>s+v,0)/State.history.length;
  const bars = [
    {label:'Confidence',    val:Math.round(avg('confidence_score')),                max:100,suffix:'%',color:'linear-gradient(90deg,#00f5ff,#7c3aed)'},
    {label:'Technical',     val:Math.round(avg('Technical_Correctness')*10),        max:100,suffix:'%',color:'linear-gradient(90deg,#3b82f6,#7c3aed)'},
    {label:'Communication', val:Math.round(avg('Communication_Score')*10),          max:100,suffix:'%',color:'linear-gradient(90deg,#10b981,#3b82f6)'},
    {label:'Grammar',       val:Math.round(avg('Grammar_Score')*10),                max:100,suffix:'%',color:'linear-gradient(90deg,#f59e0b,#f43f5e)'},
    {label:'Eye Contact',   val:Math.round(avg('Eye_Contact_Score')*10),            max:100,suffix:'%',color:'linear-gradient(90deg,#10b981,#06b6d4)'},
  ];
  container.innerHTML = bars.map(b => {
    const valColor = b.val>=70?'var(--green)':b.val>=40?'var(--yellow)':'var(--pink)';
    return `<div class="perf-bar-item">
      <div class="perf-bar-row"><span class="perf-bar-label">${b.label}</span><span class="perf-bar-val" style="color:${valColor}">${b.val}${b.suffix}</span></div>
      <div class="perf-bar-track"><div class="perf-bar-fill" style="background:${b.color}" data-target="${(b.val/b.max)*100}"></div></div>
    </div>`;
  }).join('');
  requestAnimationFrame(() => {
    container.querySelectorAll('.perf-bar-fill').forEach(bar => { setTimeout(() => { bar.style.width = bar.dataset.target+'%'; }, 100); });
  });
}

/* ─── PERSONALIZED ANALYSIS SECTION ─────────────────────── */
function renderPersonalizedAnalysis() {
  // Insert analysis section after perfBars card if not already present
  const perfCard = document.querySelector('.performance-card');
  if (!perfCard) return;

  let analysisCard = document.getElementById('analysisCard');
  if (!analysisCard) {
    analysisCard = document.createElement('div');
    analysisCard.id = 'analysisCard';
    analysisCard.className = 'glass-card';
    analysisCard.style.cssText = 'overflow:hidden;';
    perfCard.parentNode.insertBefore(analysisCard, perfCard.nextSibling);
  }

  const feedback = generatePersonalizedFeedback();

  if (!feedback || !feedback.length) {
    analysisCard.innerHTML = `
      <div class="card-section-title" style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
        Personalized Analysis
      </div>
      <div style="padding:24px;text-align:center;color:rgba(255,255,255,0.4);font-size:13px">
        <div style="font-size:28px;margin-bottom:8px">📊</div>
        Complete your first interview to receive personalized feedback!
      </div>`;
    return;
  }

  analysisCard.innerHTML = `
    <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;font-family:'Syne',sans-serif;font-size:14px;font-weight:700">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Personalized Analysis
      <span style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.4);margin-left:4px">Based on ${State.history.length} session${State.history.length>1?'s':''}</span>
    </div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
      ${feedback.map(f => `
        <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-left:3px solid ${f.color}">
          <span style="font-size:18px;flex-shrink:0">${f.icon}</span>
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <span style="font-size:13px;font-weight:700;color:#fff">${f.label}</span>
              <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${f.color}22;color:${f.color};border:1px solid ${f.color}44">${f.level}</span>
            </div>
            <p style="font-size:12px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0">${f.msg}</p>
          </div>
        </div>
      `).join('')}
    </div>`;
}

function renderTaskBadge() {
  const tasks   = safeGet('interviewai_daily_tasks') || [];
  const pending = tasks.filter(t=>!t.done).length;
  const badge   = document.getElementById('taskBadge');
  if (!badge) return;
  badge.textContent = pending>0?pending:'';
  badge.style.display = pending>0?'inline-block':'none';
}

function setEl(id,text) { const el=document.getElementById(id);if(el)el.textContent=text; }
function setVal(id,val) { const el=document.getElementById(id);if(el)el.value=val; }

function populateEditForm() {
  const u = State.user;
  setVal('editName',   u.name||'');
  setVal('editEmail',  u.email||'');
  setVal('editRole',   u.role||'');
  setVal('editTarget', u.target||'');
  setVal('editExp',    u.exp||'');
  setVal('editBio',    u.bio||'');
}

/* ─── EDIT PROFILE — opens inline (scroll to section) ─────── */
function openEditForm() {
  State.editing = true;
  populateEditForm();
  const viewMode = document.getElementById('viewMode');
  const editForm = document.getElementById('editForm');
  if (viewMode) viewMode.style.display = 'none';
  if (editForm) {
    editForm.style.display = 'flex';
    editForm.style.flexDirection = 'column';
    // Scroll to the form
    setTimeout(() => { editForm.scrollIntoView({behavior:'smooth',block:'start'}); }, 100);
  }
  const btn = document.getElementById('btnEditProfile');
  if (btn) { btn.innerHTML = '✕ Cancel Edit'; btn.style.background='rgba(244,63,94,0.1)'; btn.style.borderColor='rgba(244,63,94,0.3)'; btn.style.color='var(--pink)'; }
}

function closeEditForm() {
  State.editing = false;
  const viewMode = document.getElementById('viewMode');
  const editForm = document.getElementById('editForm');
  if (viewMode) viewMode.style.display = 'block';
  if (editForm) editForm.style.display = 'none';
  const btn = document.getElementById('btnEditProfile');
  if (btn) {
    btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit Profile`;
    btn.style.background='';btn.style.borderColor='';btn.style.color='';
  }
}

function saveProfile() {
  const name   = document.getElementById('editName')?.value.trim();
  const email  = document.getElementById('editEmail')?.value.trim();
  const role   = document.getElementById('editRole')?.value.trim();
  const target = document.getElementById('editTarget')?.value.trim();
  const exp    = document.getElementById('editExp')?.value.trim();
  const bio    = document.getElementById('editBio')?.value.trim();

  if (!name) { showToast('Name cannot be empty.','error'); return; }
  if (!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('Enter a valid email address.','error'); return; }

  State.user = {...State.user, name, email, role, target, exp, bio};
  safeSet('interviewai_user', State.user);
  renderHero();
  renderInfoView();
  closeEditForm();
  showToast('Profile updated successfully!','success');
}

/* ─── IMAGE UPLOAD — works via FileReader base64 ─────────── */
function initImageUpload() {
  // Create hidden file input
  let fileInput = document.getElementById('avatarFileInput');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'avatarFileInput';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);
  }

  // Click avatar edit button → open file picker OR show picker
  const avatarEditBtn = document.getElementById('avatarEditBtn');
  const avatarPicker  = document.getElementById('avatarPicker');

  if (avatarEditBtn) {
    avatarEditBtn.addEventListener('click', () => {
      const isOpen = avatarPicker?.classList.contains('open');
      if (isOpen) { avatarPicker.classList.remove('open'); return; }
      positionPicker();
      avatarPicker?.classList.add('open');
    });
  }

  // File input change → read as base64, store, render
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Image too large — please use under 2MB','error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      State.user.avatarPhoto = e.target.result;
      safeSet('interviewai_user', State.user);
      renderHero();
      avatarPicker?.classList.remove('open');
      showToast('Profile photo updated!','success');
    };
    reader.readAsDataURL(file);
    fileInput.value = '';
  });

  // Close picker on outside click
  document.addEventListener('click', e => {
    if (avatarPicker?.classList.contains('open') && !avatarPicker.contains(e.target) && e.target !== avatarEditBtn) {
      avatarPicker.classList.remove('open');
    }
  });

  document.getElementById('avatarPickerClose')?.addEventListener('click', () => avatarPicker?.classList.remove('open'));
}

function positionPicker() {
  const btn = document.getElementById('avatarEditBtn');
  const picker = document.getElementById('avatarPicker');
  if (!btn||!picker) return;
  const rect = btn.getBoundingClientRect();
  picker.style.top  = (rect.bottom+8+window.scrollY)+'px';
  picker.style.left = (rect.left-60+window.scrollX)+'px';
}

/* ─── AVATAR COLOR PICKER — also adds "Upload Photo" option ─*/
function buildAvatarPicker() {
  const grid = document.getElementById('avatarColorGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // Upload photo button at top
  const uploadBtn = document.createElement('button');
  uploadBtn.style.cssText = 'grid-column:1/-1;padding:10px;border-radius:8px;background:rgba(0,245,255,0.08);border:1px solid rgba(0,245,255,0.2);color:#00f5ff;font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:8px;font-family:inherit;transition:all 0.2s';
  uploadBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Upload Photo`;
  uploadBtn.addEventListener('click', () => {
    document.getElementById('avatarFileInput')?.click();
  });
  uploadBtn.addEventListener('mouseover', () => { uploadBtn.style.background='rgba(0,245,255,0.15)'; });
  uploadBtn.addEventListener('mouseout', () => { uploadBtn.style.background='rgba(0,245,255,0.08)'; });

  // Remove photo button (only if photo set)
  if (State.user.avatarPhoto) {
    const removeBtn = document.createElement('button');
    removeBtn.style.cssText = 'grid-column:1/-1;padding:8px;border-radius:8px;background:rgba(244,63,94,0.08);border:1px solid rgba(244,63,94,0.2);color:#f43f5e;font-size:11px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:inherit';
    removeBtn.textContent = '✕ Remove Photo';
    removeBtn.addEventListener('click', () => {
      delete State.user.avatarPhoto;
      safeSet('interviewai_user', State.user);
      renderHero();
      buildAvatarPicker();
      showToast('Photo removed','info');
    });
    grid.appendChild(removeBtn);
  }

  grid.appendChild(uploadBtn);

  // Colour swatches
  const swatchLabel = document.createElement('div');
  swatchLabel.style.cssText = 'grid-column:1/-1;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px';
  swatchLabel.textContent = 'Or choose colour';
  grid.appendChild(swatchLabel);

  AVATAR_GRADIENTS.forEach(grad => {
    const sw = document.createElement('div');
    sw.className = 'avatar-color-swatch';
    sw.style.background = grad;
    if (grad === (State.user.avatarGradient||AVATAR_GRADIENTS[0])) sw.classList.add('selected');
    sw.addEventListener('click', () => {
      State.user.avatarGradient = grad;
      delete State.user.avatarPhoto; // clear photo when colour chosen
      safeSet('interviewai_user', State.user);
      renderHero();
      buildAvatarPicker();
      showToast('Avatar colour updated!','success');
    });
    grid.appendChild(sw);
  });
}

function openPwForm() {
  State.pwOpen = true;
  const form=document.getElementById('pwForm'),btn=document.getElementById('btnChangePw');
  if(form)form.style.display='flex';
  if(btn)btn.style.display='none';
}
function closePwForm() {
  State.pwOpen = false;
  const form=document.getElementById('pwForm'),btn=document.getElementById('btnChangePw');
  if(form)form.style.display='none';
  if(btn)btn.style.display='block';
  clearPwFields();
  const wrap=document.getElementById('pwStrengthWrap');if(wrap)wrap.style.display='none';
}
function clearPwFields() { ['pwCurrent','pwNew','pwConfirm'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';}); }

function checkPwStrength(pw) {
  let s=0;
  if(pw.length>=8)s++;if(pw.length>=12)s++;if(/[A-Z]/.test(pw))s++;if(/[0-9]/.test(pw))s++;if(/[^A-Za-z0-9]/.test(pw))s++;
  return s;
}

function savePassword() {
  const current=document.getElementById('pwCurrent')?.value;
  const newPw  =document.getElementById('pwNew')?.value;
  const confirm=document.getElementById('pwConfirm')?.value;
  if(!current){showToast('Enter your current password.','error');return;}
  if(current!==(State.user.password||'demo1234')){showToast('Current password is incorrect.','error');return;}
  if(!newPw||newPw.length<8){showToast('New password must be at least 8 characters.','error');return;}
  if(newPw!==confirm){showToast('Passwords do not match.','error');return;}
  State.user.password=newPw;
  safeSet('interviewai_user',State.user);
  closePwForm();
  showToast('Password updated successfully!','success');
}

function openDeleteModal() {
  document.getElementById('deleteModal')?.classList.add('active');
  const pw=document.getElementById('deleteConfirmPw');if(pw)pw.value='';
  const err=document.getElementById('deletePwError');if(err)err.style.display='none';
}
function closeDeleteModal() { document.getElementById('deleteModal')?.classList.remove('active'); }

function confirmDeleteAccount() {
  const pw=document.getElementById('deleteConfirmPw')?.value;
  const errEl=document.getElementById('deletePwError');
  if(!pw){if(errEl){errEl.textContent='Please enter your password.';errEl.style.display='block';}return;}
  if(pw!==(State.user.password||'demo1234')){if(errEl)errEl.style.display='block';return;}
  const email=State.user.email||'guest';
  ['interviewai_user','interviewai_history','interviewai_history_'+email,'interviewai_daily_tasks','interviewai_completed_plans','interviewai_leaderboard','interviewai_recommendations']
    .forEach(k=>{try{localStorage.removeItem(k);}catch{}});
  showToast('Account deleted. Redirecting…','info');
  setTimeout(()=>{window.location.href='index.html';},1400);
}

function initPasswordToggles() {
  document.querySelectorAll('.pw-toggle').forEach(btn => {
    btn.addEventListener('click',()=>{
      const input=document.getElementById(btn.dataset.target);
      if(!input)return;
      input.type=input.type==='password'?'text':'password';
    });
  });
}

function initSidebar() {
  const sidebar=document.getElementById('sidebar'),overlay=document.getElementById('sidebarOverlay'),menuBtn=document.getElementById('mobileMenuBtn'),logout=document.getElementById('logoutLink');
  const open=()=>{sidebar?.classList.add('mobile-open');overlay?.classList.add('open');};
  const close=()=>{sidebar?.classList.remove('mobile-open');overlay?.classList.remove('open');};
  menuBtn?.addEventListener('click',open);overlay?.addEventListener('click',close);
  logout?.addEventListener('click',e=>{e.preventDefault();safeSet('interviewai_user',null);showToast('Logged out successfully','info');setTimeout(()=>{window.location.href='index.html';},900);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
}

function initEventListeners() {
  document.getElementById('btnEditProfile')?.addEventListener('click',()=>{State.editing?closeEditForm():openEditForm();});
  document.getElementById('btnSaveProfile')?.addEventListener('click',saveProfile);
  document.getElementById('btnCancelEdit')?.addEventListener('click',closeEditForm);
  document.getElementById('btnChangePw')?.addEventListener('click',openPwForm);
  document.getElementById('btnSavePw')?.addEventListener('click',savePassword);
  document.getElementById('btnCancelPw')?.addEventListener('click',closePwForm);

  document.getElementById('pwNew')?.addEventListener('input',function(){
    const wrap=document.getElementById('pwStrengthWrap'),fill=document.getElementById('pwStrengthFill'),label=document.getElementById('pwStrengthLabel');
    if(!wrap||!fill||!label)return;
    if(!this.value){wrap.style.display='none';return;}
    wrap.style.display='block';
    const score=checkPwStrength(this.value);
    const levels=[{pct:20,color:'#f43f5e',text:'Very Weak'},{pct:40,color:'#f97316',text:'Weak'},{pct:60,color:'#fbbf24',text:'Fair'},{pct:80,color:'#10b981',text:'Strong'},{pct:100,color:'#00f5ff',text:'Very Strong'}];
    const level=levels[Math.min(score-1,4)]||levels[0];
    fill.style.width=level.pct+'%';fill.style.background=level.color;label.textContent=level.text;label.style.color=level.color;
  });

  document.getElementById('btnDeleteAccount')?.addEventListener('click',openDeleteModal);
  document.getElementById('btnCancelDelete')?.addEventListener('click',closeDeleteModal);
  document.getElementById('btnConfirmDelete')?.addEventListener('click',confirmDeleteAccount);
  document.getElementById('deleteModal')?.addEventListener('click',e=>{if(e.target===document.getElementById('deleteModal'))closeDeleteModal();});

  document.getElementById('editForm')?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&e.target.tagName!=='TEXTAREA'){e.preventDefault();saveProfile();}});
  document.getElementById('pwForm')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();savePassword();}});
  document.getElementById('deleteConfirmPw')?.addEventListener('keydown',e=>{if(e.key==='Enter')confirmDeleteAccount();});
}

function init() {
  loadData();
  renderHero();
  renderInfoView();
  renderStats();
  renderAchievements();
  renderPerformanceBars();
  renderPersonalizedAnalysis();
  renderTaskBadge();
  buildAvatarPicker();
  initImageUpload();
  initPasswordToggles();
  initSidebar();
  initEventListeners();
  console.log('[InterviewAI] Profile loaded ✓', {user:State.user.name, sessions:State.history.length, streak:computeStreak()});
}

document.addEventListener('DOMContentLoaded', init);