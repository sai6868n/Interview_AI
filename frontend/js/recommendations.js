/* ============================================================
   INTERVIEW AI — recommendations.js
   Complete production-ready JS for recommendations page
   ============================================================ */

'use strict';

/* ── State ─────────────────────────────────────────────────── */
const State = {
  user: null,
  history: [],
  recommendations: [],
  filtered: [],
  activeCategory: 'all',
  expandedAll: false,
  completedPlans: new Set(),
  searchQuery: '',
  sortMode: 'default',
};

/* ── DOM ────────────────────────────────────────────────────── */
const DOM = {
  recCards:      () => document.getElementById('recCards'),
  filterTabs:    () => document.getElementById('filterTabs'),
  progressList:  () => document.getElementById('progressList'),
  statTotal:     () => document.getElementById('statTotal'),
  statHigh:      () => document.getElementById('statHigh'),
  statSessions:  () => document.getElementById('statSessions'),
  statCompleted: () => document.getElementById('statCompleted'),
  recSearch:     () => document.getElementById('recSearch'),
  sortSelect:    () => document.getElementById('sortSelect'),
  expandAllBtn:  () => document.getElementById('expandAllBtn'),
  taskBadge:     () => document.getElementById('taskBadge'),
  userName:      () => document.getElementById('userName'),
  userEmail:     () => document.getElementById('userEmail'),
  avatarSm:      () => document.getElementById('avatarSm'),
  toast:         () => document.getElementById('toastRec'),
  sidebar:       () => document.getElementById('sidebar'),
  sidebarOverlay:() => document.getElementById('sidebarOverlay'),
  mobileMenuBtn: () => document.getElementById('mobileMenuBtn'),
  logoutLink:    () => document.getElementById('logoutLink'),
};

/* ── Recommendation data bank ───────────────────────────────
   Each entry has:
   - id, category, icon, title, shortDesc, improvement
   - priority: 'high' | 'med' | 'low'
   - accent color CSS var
   - tags[]
   - plan: { techniques[], exercises[], commTips[], techTips[], confidenceTips[] }
   Recommendations are generated dynamically based on user's
   interview history + scores. If no history exists, defaults
   are shown from the full bank.
─────────────────────────────────────────────────────────────── */
const REC_BANK = [
  {
    id: 'filler-words',
    category: 'Speech',
    icon: '🗣️',
    accent: '#00f5ff',
    iconBg: 'rgba(0,245,255,0.1)',
    tags: ['Speech', 'Clarity'],
    title: 'Reduce Filler Words',
    shortDesc: 'Excessive use of "um", "uh", "like", and "you know" reduces perceived confidence and clarity. Interviewers notice more than you think.',
    improvement: '+18% confidence when eliminated',
    priority: 'high',
    plan: {
      techniques: [
        'Record yourself answering a question and count every filler word — awareness is the first fix.',
        'Introduce deliberate silent pauses instead of fillers; silence signals thoughtfulness, not uncertainty.',
        'Slow your speaking rate to 110–130 wpm — rushing is the root cause of most filler words.',
        'Use the "pause-breathe-respond" technique: pause 1 second after a question before you speak.',
      ],
      exercises: [
        '60-second recording drill: answer "Tell me about yourself" — replay and tally fillers daily.',
        '"No filler" conversation: pick one daily conversation where fillers are completely banned.',
        'Join a Toastmasters session — they use a dedicated filler-word counter in every meeting.',
        'Shadow a confident speaker (TED Talk) for 5 minutes, matching their rhythm and pauses.',
      ],
      commTips: [
        'Structured answers (STAR method) remove the need to think mid-sentence, eliminating fillers naturally.',
        'If you need thinking time, say "That\'s an interesting angle — let me think through it." instead of "Umm...".',
        'Maintain consistent eye contact — it discourages nervous speech habits.',
      ],
      techTips: [],
      confidenceTips: [
        'Prepare 5–7 go-to interview stories thoroughly so answers flow without hesitation.',
        'Visualise a successful, smooth delivery before each interview session.',
      ],
    },
  },
  {
    id: 'speaking-rate',
    category: 'Speech',
    icon: '⏱️',
    accent: '#00f5ff',
    iconBg: 'rgba(0,245,255,0.1)',
    tags: ['Speech', 'Pacing'],
    title: 'Optimise Speaking Rate',
    shortDesc: 'Speaking too fast makes you sound nervous; too slow loses the listener. The optimal interview pace is 120–140 words per minute.',
    improvement: '+22% clarity score at optimal pace',
    priority: 'med',
    plan: {
      techniques: [
        'Record a 2-minute answer and use a word count ÷ time formula to measure your wpm.',
        'Use a metronome app set to 120 bpm to pace your speech during practice.',
        'Mark your written answer scripts with "PAUSE" indicators every 2–3 sentences.',
        'Vary pace intentionally — slow down on key points, speed up on connecting phrases.',
      ],
      exercises: [
        'Read a newspaper paragraph aloud at 3 different speeds — identify the most natural.',
        '"Anchor word" drill: pick 3 key words per answer and land them with a micro-pause after each.',
        'Practice answering with a 90-second timer — adjust length, not speed, to fit.',
      ],
      commTips: [
        'Match the interviewer\'s pace subtly — it creates unconscious rapport.',
        'Breathe deeply between sentences — it naturally controls pace and projects calmness.',
      ],
      techTips: [],
      confidenceTips: [
        'Slow, deliberate speech signals authority and expertise — it is not a weakness.',
        'Preparation is the best pace controller; uncertainty causes speed.',
      ],
    },
  },
  {
    id: 'confidence-boost',
    category: 'Confidence',
    icon: '💪',
    accent: '#7c3aed',
    iconBg: 'rgba(124,58,237,0.1)',
    tags: ['Confidence', 'Mindset'],
    title: 'Build Interview Confidence',
    shortDesc: 'Your confidence score fell below 70%. Confidence is trainable — specific drills and mindset shifts produce measurable results within 2 weeks.',
    improvement: '+30% confidence with 2-week plan',
    priority: 'high',
    plan: {
      techniques: [
        'Power posing: stand in a confident posture (hands on hips, upright) for 2 minutes before each session.',
        'Pre-interview affirmations: write 5 specific strengths and read them aloud before recording.',
        'Gradually increase mock difficulty — start Easy, build to Hard over 2 weeks.',
        'Keep a "win journal" — log every successful answer or positive feedback daily.',
      ],
      exercises: [
        'Record a 60-second "elevator pitch" daily for 7 days — compare day 1 vs day 7.',
        'Mock interview with a friend or tool once every 2 days.',
        'Present one technical concept to a mirror for 2 minutes, maintaining eye contact.',
        'Box breathing: 4s inhale, 4s hold, 4s exhale, 4s hold — 4 rounds pre-interview.',
      ],
      commTips: [
        'Open answers with confident framing: "Absolutely — from my experience..." instead of "I think maybe...".',
        'Nod deliberately when listening — it signals active engagement and builds interviewer trust.',
      ],
      techTips: [
        'Thinking aloud during technical questions projects confidence even when working through uncertainty.',
      ],
      confidenceTips: [
        'Imposter syndrome affects 70% of professionals — label it, don\'t let it drive behaviour.',
        'Reframe mistakes as data points, not failures — say "I\'d approach that differently next time" out loud.',
      ],
    },
  },
  {
    id: 'stress-management',
    category: 'Stress',
    icon: '🧠',
    accent: '#f43f5e',
    iconBg: 'rgba(244,63,94,0.1)',
    tags: ['Stress', 'Mental'],
    title: 'Manage Interview Stress',
    shortDesc: 'High stress levels are degrading your speech quality and answer coherence. These techniques reduce cortisol measurably and are interview-proven.',
    improvement: 'Avg. 35% stress reduction in sessions',
    priority: 'high',
    plan: {
      techniques: [
        'Physiological sigh: double-inhale through the nose, long exhale through the mouth — fastest known stress reducer.',
        'Cognitive reframing: replace "I must not fail" with "I am showcasing my capabilities today".',
        'Mental simulation: visualise the full interview from start to handshake — include small imperfections.',
        'Progressive muscle relaxation: tense and release each muscle group from feet to shoulders before recording.',
      ],
      exercises: [
        '5-4-3-2-1 grounding: name 5 things you see, 4 you hear, 3 you can touch, 2 you smell, 1 you taste.',
        'Cold water on wrists for 30 seconds activates the parasympathetic nervous system — keep a glass handy.',
        'Journaling: write "worst case vs most likely outcome" before each session — externalises catastrophising.',
      ],
      commTips: [
        'Treat the interviewer as a colleague, not a judge — this cognitive shift lowers threat response.',
        'Ask a clarifying question early ("Could you tell me more about X aspect?") — it buys thinking time and signals engagement.',
      ],
      techTips: [],
      confidenceTips: [
        'Over-prepare technically so cognitive load is low, freeing mental bandwidth to stay calm.',
        'Remind yourself: they already liked your CV enough to invite you — you belong in this conversation.',
      ],
    },
  },
  {
    id: 'star-method',
    category: 'Communication',
    icon: '⭐',
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.1)',
    tags: ['Communication', 'Structure'],
    title: 'Master the STAR Method',
    shortDesc: 'Unstructured answers score 40% lower on clarity metrics. The STAR framework (Situation, Task, Action, Result) is the single highest-impact communication skill for interviews.',
    improvement: '+40% answer clarity score',
    priority: 'high',
    plan: {
      techniques: [
        'Write out 6 STAR stories covering: leadership, conflict, failure, success, teamwork, initiative.',
        'Time your STAR answers — target 90 seconds; anything over 2 minutes loses the interviewer.',
        'Lead with the Result first ("I reduced deployment time by 60%...") then walk back through STAR.',
        'Quantify every Result with a number, percentage, or time metric — vague results are weak results.',
      ],
      exercises: [
        '"STAR sprint" — pick a random behaviour question, write a STAR outline in under 3 minutes.',
        'Record 3 STAR answers this week; critique your Situation (too long?) and Result (too vague?).',
        'Reverse-engineer 5 job descriptions — identify the top 3 competencies tested and pre-load STAR stories.',
      ],
      commTips: [
        'Signal your structure: "Let me give you a specific example..." puts the interviewer into listening mode.',
        'Use the Action section to highlight your thinking process, not just what you did.',
        'The Result should answer "so what?" — always include impact on team, business, or customer.',
      ],
      techTips: [],
      confidenceTips: [
        'Pre-loaded stories eliminate hesitation — you stop searching for examples mid-answer.',
        'Stories are memorable — interviewers recall candidates who told vivid stories, not lists of skills.',
      ],
    },
  },
  {
    id: 'technical-accuracy',
    category: 'Technical',
    icon: '⚙️',
    accent: '#3b82f6',
    iconBg: 'rgba(59,130,246,0.1)',
    tags: ['Technical', 'Problem-Solving'],
    title: 'Improve Technical Accuracy',
    shortDesc: 'Technical correctness below 8/10 significantly reduces selection probability. Structured preparation across data structures, algorithms, and system design is required.',
    improvement: '+45% selection rate above 8/10',
    priority: 'high',
    plan: {
      techniques: [
        'Diagnose your weakest area first: Algorithms, Data Structures, System Design, or Domain Knowledge.',
        'Solve 1 LeetCode problem daily — rotate Easy (Mon/Wed/Fri), Medium (Tue/Thu), Hard (Sat).',
        'Think aloud when solving — narrate your approach before writing a single line of code.',
        'After each wrong answer, write a 3-sentence post-mortem: what failed, why, how to fix.',
      ],
      exercises: [
        '15-minute whiteboard drill: solve a problem without IDE autocomplete or documentation.',
        'Explain a technical concept (e.g., binary search) to a non-technical friend — Feynman technique.',
        'Review 2 system design case studies (Grokking the System Design Interview) per week.',
        'Build a "knowledge map" of your role — list every topic that can be tested and rate confidence 1–5.',
      ],
      commTips: [
        'If you\'re stuck, narrate your thinking: "I\'m considering an O(n log n) approach here because..." — partial credit is real.',
        'Ask clarifying questions about constraints before solving — it signals senior-level thinking.',
      ],
      techTips: [
        'Pattern recognition beats memorisation: learn the 14 core patterns (sliding window, two pointers, BFS/DFS, etc.).',
        'For system design: always start with requirements → estimation → API design → DB schema → component diagram.',
        'Big-O analysis should be second nature — practice stating complexity before and after optimisation.',
      ],
      confidenceTips: [
        'Technical confidence comes from reps, not intelligence — 30 days of daily practice creates visible change.',
      ],
    },
  },
  {
    id: 'eye-contact',
    category: 'Communication',
    icon: '👁️',
    accent: '#10b981',
    iconBg: 'rgba(16,185,129,0.1)',
    tags: ['Communication', 'Non-verbal'],
    title: 'Strengthen Eye Contact',
    shortDesc: 'Eye contact below 7/10 signals low confidence to interviewers. In video interviews, looking at the camera lens — not the screen — is the equivalent of direct eye contact.',
    improvement: '+25% perceived confidence score',
    priority: 'med',
    plan: {
      techniques: [
        'In video calls: place a small sticker dot at camera level on your monitor as a focal point.',
        'Use the triangle technique: alternate between both eyes and the forehead in 3–5 second intervals.',
        'Natural breaks: look away briefly when thinking (up and to the side) — avoids the "staring" effect.',
        'Record your mock interviews and watch them back — you will immediately feel what interviewers feel.',
      ],
      exercises: [
        '30-second mirror drill: hold eye contact with your own reflection while speaking — build the habit.',
        'Watch 3 TED Talk speakers for 5 minutes each; note specifically how and when they use eye contact.',
        'In daily conversations, challenge yourself to maintain eye contact for entire sentences.',
      ],
      commTips: [
        'Nodding while maintaining eye contact signals understanding without interruption.',
        'Smile naturally when making eye contact — warmth + confidence is the winning combination.',
      ],
      techTips: [],
      confidenceTips: [
        'Strong eye contact is the fastest visual signal of confidence — it costs zero preparation time.',
      ],
    },
  },
  {
    id: 'sentiment-positive',
    category: 'Communication',
    icon: '😊',
    accent: '#10b981',
    iconBg: 'rgba(16,185,129,0.1)',
    tags: ['Communication', 'Tone'],
    title: 'Improve Positive Sentiment',
    shortDesc: 'Negative or neutral sentiment in your answers reduces engagement and likability scores. Interviewers make hiring decisions emotionally first, rationally second.',
    improvement: '+20% interviewer engagement',
    priority: 'med',
    plan: {
      techniques: [
        'Reframe every weakness as a growth story: "I used to struggle with X; here\'s what I did about it."',
        'Use positively charged language: "opportunity" instead of "problem", "learning" instead of "failure".',
        'Genuine enthusiasm: identify 3 specific things about the role/company you genuinely find exciting — mention them.',
        'Energy calibration: speak slightly louder and with slightly more variation in pitch than feels natural.',
      ],
      exercises: [
        'Audit your 3 most recent answers — highlight every negative word or phrase and rewrite each one positively.',
        'Practice telling a "failure story" with a positive framing arc three times until it feels natural.',
      ],
      commTips: [
        'Open every answer with a genuine positive micro-statement: "Great question — this is something I\'ve thought a lot about."',
        'Close every answer with forward-looking energy: "...and I\'m excited to bring that approach here."',
      ],
      techTips: [],
      confidenceTips: [
        'Positive sentiment is contagious — interviewers feel better talking to you and attribute it to your potential.',
      ],
    },
  },
  {
    id: 'grammar-clarity',
    category: 'Communication',
    icon: '✍️',
    accent: '#f59e0b',
    iconBg: 'rgba(245,158,11,0.1)',
    tags: ['Communication', 'Grammar'],
    title: 'Sharpen Grammar & Clarity',
    shortDesc: 'Grammar errors and unclear sentence construction reduce your credibility, particularly for senior or client-facing roles. Small improvements here have outsized impact.',
    improvement: '+15% professional credibility',
    priority: 'low',
    plan: {
      techniques: [
        'Subject-verb agreement check: before every answer, mentally confirm who is doing what.',
        'Avoid double negatives ("I don\'t have no experience") — rephrase as a positive statement.',
        'Use active voice: "I built the API" not "The API was built by me."',
        'Short sentences are safer than long ones — break complex thoughts into two sentences.',
      ],
      exercises: [
        'Write out your 5 core interview answers — read them aloud to catch grammatical awkwardness.',
        'Use Grammarly or LanguageTool on your written answer scripts before recording.',
        'Read the Economist or Harvard Business Review for 10 minutes daily — absorbs professional prose structure.',
      ],
      commTips: [
        'When unsure of a word mid-sentence, choose a simpler synonym — clarity beats vocabulary.',
        'Pause slightly before key nouns or numbers — it prevents grammatical scrambling.',
      ],
      techTips: [],
      confidenceTips: [
        'Grammar confidence comes from writing practice — journaling daily for 2 weeks creates noticeably better spoken structure.',
      ],
    },
  },
  {
    id: 'response-length',
    category: 'Speech',
    icon: '📏',
    accent: '#00f5ff',
    iconBg: 'rgba(0,245,255,0.1)',
    tags: ['Speech', 'Conciseness'],
    title: 'Calibrate Response Length',
    shortDesc: 'Responses under 50 words signal unpreparedness; over 300 words lose the interviewer\'s focus. The target window is 100–200 words per behavioural answer.',
    improvement: 'Optimal engagement at 120–180 words',
    priority: 'med',
    plan: {
      techniques: [
        'Time your answers — aim for 60–90 seconds for behavioural, 3–5 minutes for technical deep-dives.',
        'Write your answer, count the words, then cut 30% — every sentence should earn its place.',
        'Use a "core + expansion" structure: deliver the key point in 30 seconds, expand only if asked.',
        'Watch for the "ramble flag": if you hear yourself saying "...and also..." three times, stop and summarise.',
      ],
      exercises: [
        '"1-minute drill" — answer any question in exactly 60 seconds. Repeat with 90-second cap.',
        'Record two versions of the same answer: 45 seconds and 2 minutes. Identify which is stronger.',
      ],
      commTips: [
        'End answers cleanly: "...so that\'s my approach — happy to go deeper on any part." signals control.',
        'Shorter, clearer answers in early interview rounds leave room for follow-up — which you welcome.',
      ],
      techTips: [],
      confidenceTips: [
        'Concise answers signal clarity of thought, not lack of depth — brevity is a senior-level skill.',
      ],
    },
  },
];

/* ── Skill progress data derived from history ─────────────── */
const SKILL_KEYS = [
  { key: 'confidence', label: 'Confidence',    color: 'linear-gradient(90deg,#00f5ff,#7c3aed)' },
  { key: 'technical',  label: 'Technical',     color: 'linear-gradient(90deg,#3b82f6,#7c3aed)' },
  { key: 'comm',       label: 'Communication', color: 'linear-gradient(90deg,#10b981,#3b82f6)' },
  { key: 'stress',     label: 'Stress Control',color: 'linear-gradient(90deg,#f59e0b,#10b981)' },
  { key: 'grammar',    label: 'Grammar',       color: 'linear-gradient(90deg,#f59e0b,#f43f5e)' },
];

/* ── Utility ────────────────────────────────────────────────── */
function showToast(msg, type = 'info') {
  const t = DOM.toast();
  const colors = { success: '#10b981', error: '#f43f5e', info: '#00f5ff', warn: '#f59e0b' };
  t.style.borderLeftColor = colors[type] || colors.info;
  t.style.borderLeft = `3px solid ${colors[type] || colors.info}`;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 3200);
}

function safeGet(key, fallback = null) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function safeSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function animateCounter(el, target, duration = 700) {
  if (!el) return;
  const start = performance.now();
  const from = parseInt(el.textContent) || 0;
  const step = ts => {
    const p = Math.min((ts - start) / duration, 1);
    el.textContent = Math.round(from + (target - from) * p);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ── Load user + history ────────────────────────────────────── */
function loadUserData() {
  State.user    = safeGet('interviewai_user') || { name: 'Guest User', email: 'guest@interviewai.com' };
  State.history = safeGet('interviewai_history') || [];
  State.completedPlans = new Set(safeGet('interviewai_completed_plans') || []);
  renderUserInfo();
}

function renderUserInfo() {
  const u = State.user;
  if (DOM.userName()) DOM.userName().textContent = u.name || 'Guest';
  if (DOM.userEmail()) DOM.userEmail().textContent = u.email || '—';
  if (DOM.avatarSm()) DOM.avatarSm().textContent = initials(u.name);
}

/* ── Generate recommendations from history ──────────────────── */
function generateRecommendations() {
  const history = State.history;

  if (!history.length) {
    // No history — show all recs from bank with defaults
    State.recommendations = REC_BANK.map(r => ({ ...r }));
    return;
  }

  const recent = history.slice(-5); // last 5 sessions
  const avg = field => recent.reduce((s, h) => s + (parseFloat(h[field]) || 0), 0) / recent.length;

  const avgConf   = avg('confidence_score');
  const avgFiller = avg('Filler_Words');
  const avgRate   = avg('Speaking_Rate');
  const avgTech   = avg('Technical_Correctness');
  const avgComm   = avg('Communication_Score');
  const avgSent   = avg('Sentiment_Score');
  const avgGram   = avg('Grammar_Score');
  const avgEye    = avg('Eye_Contact_Score');
  const avgResp   = avg('Response_Length');
  const stressHigh = recent.filter(h => (h.stress_level || '').toLowerCase() === 'high').length;

  const selected = [];

  // Always prioritise by score gaps
  if (avgFiller > 3)      selected.push({ ...REC_BANK.find(r => r.id === 'filler-words'),  priority: avgFiller > 6 ? 'high' : 'med' });
  if (avgConf < 70)       selected.push({ ...REC_BANK.find(r => r.id === 'confidence-boost') });
  if (stressHigh >= 2)    selected.push({ ...REC_BANK.find(r => r.id === 'stress-management') });
  if (avgTech < 7)        selected.push({ ...REC_BANK.find(r => r.id === 'technical-accuracy') });
  if (avgComm < 7)        selected.push({ ...REC_BANK.find(r => r.id === 'star-method') });
  if (avgSent < 0.1)      selected.push({ ...REC_BANK.find(r => r.id === 'sentiment-positive') });
  if (avgGram < 7)        selected.push({ ...REC_BANK.find(r => r.id === 'grammar-clarity') });
  if (avgEye < 7)         selected.push({ ...REC_BANK.find(r => r.id === 'eye-contact') });
  if (avgRate > 160 || avgRate < 80) selected.push({ ...REC_BANK.find(r => r.id === 'speaking-rate'), priority: 'high' });
  if (avgResp < 50 || avgResp > 300) selected.push({ ...REC_BANK.find(r => r.id === 'response-length') });

  // Pad with remaining recs if < 4
  const usedIds = new Set(selected.map(r => r.id));
  for (const r of REC_BANK) {
    if (!usedIds.has(r.id)) { selected.push({ ...r }); usedIds.add(r.id); }
    if (selected.length >= 10) break;
  }

  State.recommendations = selected;
}

/* ── Compute skill progress percentages ─────────────────────── */
function computeSkillProgress() {
  const history = State.history;
  if (!history.length) {
    return SKILL_KEYS.map(s => ({ ...s, pct: 0, label: s.label }));
  }
  const recent = history.slice(-3);
  const avg = field => recent.reduce((s, h) => s + (parseFloat(h[field]) || 0), 0) / recent.length;

  return [
    { ...SKILL_KEYS[0], pct: Math.min(100, Math.round(avg('confidence_score') || 0)) },
    { ...SKILL_KEYS[1], pct: Math.min(100, Math.round((avg('Technical_Correctness') || 0) * 10)) },
    { ...SKILL_KEYS[2], pct: Math.min(100, Math.round((avg('Communication_Score') || 0) * 10)) },
    { ...SKILL_KEYS[3], pct: Math.min(100, Math.round(avg('stress_pct') || Math.max(0, 100 - (history.filter(h => (h.stress_level||'').toLowerCase() === 'high').length / history.length) * 100))) },
    { ...SKILL_KEYS[4], pct: Math.min(100, Math.round((avg('Grammar_Score') || 0) * 10)) },
  ];
}

/* ── Stats strip ────────────────────────────────────────────── */
function renderStats() {
  const recs     = State.recommendations;
  const highCount = recs.filter(r => r.priority === 'high').length;
  const sessions  = State.history.length;
  const completed = State.completedPlans.size;

  animateCounter(DOM.statTotal(),     recs.length);
  animateCounter(DOM.statHigh(),      highCount);
  animateCounter(DOM.statSessions(),  sessions);
  animateCounter(DOM.statCompleted(), completed);
}

/* ── Filter tabs ────────────────────────────────────────────── */
function renderFilterTabs() {
  const categories = ['All', ...new Set(State.recommendations.map(r => r.category))];
  const container  = DOM.filterTabs();
  if (!container) return;
  container.innerHTML = '';

  categories.forEach((cat, i) => {
    const btn = document.createElement('button');
    btn.className = 'filter-tab' + (i === 0 ? ' active' : '');
    const count = cat === 'All' ? State.recommendations.length
      : State.recommendations.filter(r => r.category === cat).length;
    btn.innerHTML = `${cat} <span style="opacity:0.5;font-size:11px">(${count})</span>`;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.activeCategory = cat === 'All' ? 'all' : cat;
      applyFiltersAndRender();
    });
    container.appendChild(btn);
  });
}

/* ── Apply search / category filter / sort ──────────────────── */
function applyFiltersAndRender() {
  let recs = [...State.recommendations];

  // Category filter
  if (State.activeCategory !== 'all') {
    recs = recs.filter(r => r.category === State.activeCategory);
  }

  // Search filter
  if (State.searchQuery) {
    const q = State.searchQuery.toLowerCase();
    recs = recs.filter(r =>
      r.title.toLowerCase().includes(q) ||
      r.shortDesc.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  // Sort
  if (State.sortMode === 'priority') {
    const order = { high: 0, med: 1, low: 2 };
    recs.sort((a, b) => (order[a.priority] ?? 9) - (order[b.priority] ?? 9));
  } else if (State.sortMode === 'category') {
    recs.sort((a, b) => a.category.localeCompare(b.category));
  }

  State.filtered = recs;
  renderRecCards();
}

/* ── Render recommendation cards ────────────────────────────── */
function renderRecCards() {
  const container = DOM.recCards();
  if (!container) return;
  container.innerHTML = '';

  if (!State.filtered.length) {
    container.innerHTML = `
      <div class="rec-empty">
        <div class="rec-empty-icon">🔍</div>
        <h3>No recommendations found</h3>
        <p>Try a different search term or category filter.</p>
      </div>`;
    return;
  }

  State.filtered.forEach((rec, idx) => {
    const isCompleted = State.completedPlans.has(rec.id);
    const card = buildRecCard(rec, idx, isCompleted);
    container.appendChild(card);
  });

  // Re-apply expand-all state
  if (State.expandedAll) {
    container.querySelectorAll('.improvement-plan').forEach(p => p.classList.add('visible'));
    container.querySelectorAll('.btn-view-plan').forEach(b => b.classList.add('open'));
  }
}

function buildRecCard(rec, idx, isCompleted) {
  const priorityLabel = { high: '🔴 High Priority', med: '🟡 Medium', low: '🟢 Low' }[rec.priority] || '';
  const priorityClass = { high: 'priority-high', med: 'priority-med', low: 'priority-low' }[rec.priority] || '';

  const card = document.createElement('div');
  card.className = 'rec-card';
  card.style.cssText = `--card-accent:${rec.accent}; animation-delay:${idx * 0.07}s`;
  card.dataset.id = rec.id;

  card.innerHTML = `
    <div class="rec-card-header">
      <div class="rec-card-icon" style="background:${rec.iconBg}">${rec.icon}</div>
      <div class="rec-card-meta">
        <div class="rec-card-title">${isCompleted ? '✅ ' : ''}${rec.title}</div>
        <div class="rec-card-source">
          ${rec.tags.map(t => `<span class="rec-tag">${t}</span>`).join('')}
          <span class="rec-source">AI-generated from your sessions</span>
        </div>
      </div>
      <span class="rec-priority-badge ${priorityClass}">${priorityLabel}</span>
    </div>

    <p class="rec-short-desc">${rec.shortDesc}</p>

    <div class="rec-improvement">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
      ${rec.improvement}
    </div>

    <button class="btn-view-plan" data-id="${rec.id}">
      <span>📋 View Improvement Plan</span>
      <svg class="plan-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <div class="improvement-plan" id="plan-${rec.id}">
      ${buildPlanHTML(rec, isCompleted)}
    </div>`;

  // Toggle plan
  card.querySelector('.btn-view-plan').addEventListener('click', () => togglePlan(rec.id));

  return card;
}

function buildPlanHTML(rec, isCompleted) {
  const { plan, id } = rec;

  const section = (title, items) => {
    if (!items || !items.length) return '';
    return `
      <div class="plan-section">
        <div class="plan-section-title">${title}</div>
        <ul class="plan-list">
          ${items.map(i => `<li>${i}</li>`).join('')}
        </ul>
      </div>`;
  };

  return `
    <div class="plan-inner">
      <div class="plan-header">
        <span class="plan-header-icon">🗺️</span>
        <span class="plan-header-title">Your Personalised Improvement Plan</span>
      </div>
      ${section('🔧 Techniques', plan.techniques)}
      ${section('🏋️ Exercises', plan.exercises)}
      ${plan.commTips?.length ? section('💬 Communication Tips', plan.commTips) : ''}
      ${plan.techTips?.length ? section('⚙️ Technical Preparation', plan.techTips) : ''}
      ${section('💡 Confidence Builders', plan.confidenceTips)}
      <div class="plan-section" style="display:flex;justify-content:flex-end">
        <button class="btn-mark-done" data-id="${id}"
          style="padding:8px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;
                 background:${isCompleted ? 'rgba(16,185,129,0.15)' : 'rgba(0,245,255,0.08)'};
                 border:1px solid ${isCompleted ? 'rgba(16,185,129,0.35)' : 'rgba(0,245,255,0.25)'};
                 color:${isCompleted ? 'var(--green)' : 'var(--cyan)'};
                 font-family:var(--font-body); transition:all 0.2s">
          ${isCompleted ? '✅ Plan Completed' : '✔ Mark as Done'}
        </button>
      </div>
    </div>`;
}

/* ── Toggle improvement plan ────────────────────────────────── */
function togglePlan(id) {
  const plan = document.getElementById(`plan-${id}`);
  const btn  = document.querySelector(`.btn-view-plan[data-id="${id}"]`);
  if (!plan || !btn) return;

  const isOpen = plan.classList.contains('visible');
  plan.classList.toggle('visible', !isOpen);
  btn.classList.toggle('open', !isOpen);

  if (!isOpen) {
    // Attach mark-as-done listener when plan opens
    const markBtn = plan.querySelector('.btn-mark-done');
    if (markBtn) {
      markBtn.addEventListener('click', () => markPlanDone(id, markBtn));
    }
  }
}

/* ── Mark plan as done ──────────────────────────────────────── */
function markPlanDone(id, btn) {
  if (State.completedPlans.has(id)) {
    // Undo
    State.completedPlans.delete(id);
    btn.style.background = 'rgba(0,245,255,0.08)';
    btn.style.borderColor = 'rgba(0,245,255,0.25)';
    btn.style.color = 'var(--cyan)';
    btn.textContent = '✔ Mark as Done';
    showToast('Plan marked as in-progress', 'info');
  } else {
    State.completedPlans.add(id);
    btn.style.background = 'rgba(16,185,129,0.15)';
    btn.style.borderColor = 'rgba(16,185,129,0.35)';
    btn.style.color = 'var(--green)';
    btn.textContent = '✅ Plan Completed';
    showToast('🎉 Great work! Plan marked as complete.', 'success');
  }
  safeSet('interviewai_completed_plans', [...State.completedPlans]);
  renderStats();

  // Update card title
  const card = document.querySelector(`.rec-card[data-id="${id}"]`);
  if (card) {
    const title = card.querySelector('.rec-card-title');
    const rec   = State.recommendations.find(r => r.id === id);
    if (title && rec) {
      title.textContent = (State.completedPlans.has(id) ? '✅ ' : '') + rec.title;
    }
  }
}

/* ── Render skill progress ──────────────────────────────────── */
function renderSkillProgress() {
  const list   = DOM.progressList();
  if (!list) return;
  const skills = computeSkillProgress();

  if (!State.history.length) {
    list.innerHTML = '<p class="progress-empty">Complete an interview to see your skill progress.</p>';
    return;
  }

  list.innerHTML = skills.map(s => `
    <div class="progress-item">
      <div class="progress-row">
        <span class="progress-label">${s.label}</span>
        <span class="progress-pct" style="color:${s.pct >= 70 ? 'var(--green)' : s.pct >= 40 ? 'var(--yellow)' : 'var(--pink)'}">
          ${s.pct}%
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:0%;background:${s.color}" data-target="${s.pct}"></div>
      </div>
    </div>`).join('');

  // Animate bars after render
  requestAnimationFrame(() => {
    list.querySelectorAll('.progress-fill').forEach(bar => {
      const target = bar.dataset.target;
      setTimeout(() => { bar.style.width = target + '%'; }, 120);
    });
  });
}

/* ── Expand / collapse all plans ────────────────────────────── */
function toggleExpandAll() {
  State.expandedAll = !State.expandedAll;
  const btn = DOM.expandAllBtn();
  if (btn) btn.textContent = State.expandedAll ? 'Collapse All Plans' : 'Expand All Plans';

  document.querySelectorAll('.improvement-plan').forEach(p => p.classList.toggle('visible', State.expandedAll));
  document.querySelectorAll('.btn-view-plan').forEach(b => b.classList.toggle('open', State.expandedAll));

  if (State.expandedAll) {
    // Attach all mark-done listeners
    document.querySelectorAll('.btn-mark-done').forEach(markBtn => {
      markBtn.replaceWith(markBtn.cloneNode(true)); // clear old listeners
    });
    document.querySelectorAll('.btn-mark-done').forEach(markBtn => {
      markBtn.addEventListener('click', () => markPlanDone(markBtn.dataset.id, markBtn));
    });
  }

  showToast(State.expandedAll ? 'All plans expanded' : 'All plans collapsed', 'info');
}

/* ── Task badge (pending daily tasks) ───────────────────────── */
function renderTaskBadge() {
  const tasks  = safeGet('interviewai_daily_tasks') || [];
  const pending = tasks.filter(t => !t.done).length;
  const badge   = DOM.taskBadge();
  if (!badge) return;
  badge.textContent = pending > 0 ? pending : '';
  badge.style.display = pending > 0 ? 'inline-block' : 'none';
}

/* ── Sidebar mobile toggle ──────────────────────────────────── */
function initSidebar() {
  const sidebar  = DOM.sidebar();
  const overlay  = DOM.sidebarOverlay();
  const menuBtn  = DOM.mobileMenuBtn();
  const logout   = DOM.logoutLink();

  const open  = () => { sidebar?.classList.add('mobile-open'); overlay?.classList.add('open'); };
  const close = () => { sidebar?.classList.remove('mobile-open'); overlay?.classList.remove('open'); };

  menuBtn?.addEventListener('click', open);
  overlay?.addEventListener('click', close);

  logout?.addEventListener('click', e => {
    e.preventDefault();
    safeSet('interviewai_user', null);
    showToast('Logged out successfully', 'info');
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  });
}

/* ── Search ─────────────────────────────────────────────────── */
function initSearch() {
  const input = DOM.recSearch();
  if (!input) return;
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      State.searchQuery = input.value.trim();
      applyFiltersAndRender();
    }, 250);
  });
}

/* ── Sort ───────────────────────────────────────────────────── */
function initSort() {
  const sel = DOM.sortSelect();
  if (!sel) return;
  sel.addEventListener('change', () => {
    State.sortMode = sel.value;
    applyFiltersAndRender();
  });
}

/* ── Expand all button ──────────────────────────────────────── */
function initExpandAll() {
  DOM.expandAllBtn()?.addEventListener('click', toggleExpandAll);
}

/* ── Demo history injection (for first-time users) ──────────── */
function injectDemoHistoryIfEmpty() {
  if (State.history.length) return;
  // Inject sample data so progress bars + smart recs fire
  const demo = [
    { confidence_score: 58, Filler_Words: 7, Speaking_Rate: 170, Technical_Correctness: 6,
      Communication_Score: 6, Sentiment_Score: 0.05, Grammar_Score: 6, Eye_Contact_Score: 5,
      Response_Length: 280, stress_level: 'High', interview_result: 'Not Selected',
      date: new Date(Date.now() - 86400000 * 2).toISOString() },
    { confidence_score: 64, Filler_Words: 5, Speaking_Rate: 148, Technical_Correctness: 7,
      Communication_Score: 7, Sentiment_Score: 0.15, Grammar_Score: 7, Eye_Contact_Score: 6,
      Response_Length: 190, stress_level: 'Medium', interview_result: 'Not Selected',
      date: new Date(Date.now() - 86400000).toISOString() },
  ];
  State.history = demo;
  // Note: we do NOT persist demo history — it's view-only for empty states
}

/* ── Main init ──────────────────────────────────────────────── */
function init() {
  loadUserData();
  injectDemoHistoryIfEmpty();
  generateRecommendations();

  State.filtered = [...State.recommendations];

  renderStats();
  renderFilterTabs();
  renderRecCards();
  renderSkillProgress();
  renderTaskBadge();

  initSidebar();
  initSearch();
  initSort();
  initExpandAll();

  // Keyboard shortcut: Escape closes sidebar on mobile
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      DOM.sidebar()?.classList.remove('mobile-open');
      DOM.sidebarOverlay()?.classList.remove('open');
    }
  });

  console.log('[InterviewAI] Recommendations page loaded ✓', {
    recs: State.recommendations.length,
    history: State.history.length,
    completed: State.completedPlans.size,
  });
}

document.addEventListener('DOMContentLoaded', init);
