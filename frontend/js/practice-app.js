// ── practice-app.js ── Controller for the embedded Speaking Practice panel ──
// Adapted from the standalone AI Speaking Tutor's app.js, retargeted to the
// tp-* class names used in speaking_practice.html so it doesn't collide with
// any of InterviewAI's existing site-wide styles.

let currentMode = 'conversation';
let currentLang = 'en-US';
let sessionTurns = 0;
let sessionWords = 0;
let sessionScores = [];
let isMicActive = false;
let transcript = [];

const modeLabels = {
  conversation:  '💬 Free Conversation',
  interview:     '👔 Job Interview',
  storytelling:  '📖 Storytelling',
  debate:        '⚖️ Debate Practice',
  pronunciation: '🔤 Pronunciation'
};

window.addEventListener('DOMContentLoaded', () => {
  populateVoices();
  window.speechSynthesis.onvoiceschanged = populateVoices;
});

function populateVoices() {
  const voices = Speech.getVoices();
  const select = document.getElementById('voiceSelect');
  if (!select || !voices.length) return;
  select.innerHTML = '';
  const preferred = ['Google US English', 'Microsoft Aria', 'Samantha', 'Alex', 'Karen'];
  const sorted = [...voices].sort((a, b) => {
    const ai = preferred.findIndex(p => a.name.includes(p));
    const bi = preferred.findIndex(p => b.name.includes(p));
    if (ai !== -1 && bi === -1) return -1;
    if (bi !== -1 && ai === -1) return 1;
    return 0;
  });
  sorted.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = v.name.length > 28 ? v.name.slice(0, 28) + '…' : v.name;
    select.appendChild(opt);
  });
  if (sorted.length) Speech.setVoice(sorted[0].name);
  select.addEventListener('change', () => Speech.setVoice(select.value));
}

// ── Mode Switching ───────────────────────────────────────────────
function setMode(mode) {
  currentMode = mode;
  Tutor.setMode(mode);

  document.querySelectorAll('.tp-nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });

  document.getElementById('modeBadge').textContent = modeLabels[mode];

  clearChat(false);
  const greetings = {
    conversation:  "Hi! I'm Nova, your AI speaking tutor. Let's have a conversation to improve your English! What's on your mind today?",
    interview:     "Welcome! I'll be your interviewer today. Let's start: Can you please introduce yourself and tell me a bit about your background?",
    storytelling:  "Hello! I'm Nova, your storytelling coach. Let's practice expressive speaking. Tell me about something interesting that happened to you recently.",
    debate:        "Hi! Ready to debate? Let's start with a topic: 'Social media does more harm than good.' What's your stance?",
    pronunciation: "Hi there! I'm Nova, your pronunciation coach. Let's warm up — tell me what you had for breakfast today, focusing on speaking clearly."
  };
  addTutorMessage({ response: greetings[mode], feedback: null, followup: null });
  Speech.speak(greetings[mode]);
}

// ── Mic Control ───────────────────────────────────────────────────
function toggleMic() {
  if (Speech.getIsListening()) {
    Speech.stopListening();
    setMicState(false);
  } else {
    Speech.stopSpeaking();
    startListening();
  }
}

function startListening() {
  setMicState(true);
  const liveEl = document.getElementById('liveTranscript');
  liveEl.textContent = 'Listening...';
  liveEl.classList.add('active');

  Speech.startListening(
    currentLang,
    (final, interim) => {
      liveEl.textContent = (final + interim).trim() || 'Listening...';
    },
    async (spokenText) => {
      setMicState(false);
      liveEl.textContent = 'Press the mic and start speaking...';
      liveEl.classList.remove('active');
      if (spokenText) await handleUserInput(spokenText);
    }
  );
}

function setMicState(active) {
  isMicActive = active;
  const btn = document.getElementById('micBtn');
  btn.classList.toggle('listening', active);
  btn.querySelector('.mic-label').textContent = active ? 'Listening…' : 'Hold to Speak';
  btn.querySelector('.mic-icon').textContent = active ? '🔴' : '🎤';
}

// ── Text Input ────────────────────────────────────────────────────
function sendTextInput() {
  const input = document.getElementById('textInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  handleUserInput(text);
}

// ── Core Processing ───────────────────────────────────────────────
async function handleUserInput(text) {
  if (!text) return;
  addUserMessage(text);
  const words = text.trim().split(/\s+/).length;
  sessionWords += words;
  sessionTurns++;
  updateStats();

  const thinkId = addThinking();

  try {
    const result = await Tutor.chat(text);
    removeThinking(thinkId);
    addTutorMessage(result);
    updateFeedbackBar(result.feedback);

    if (result.feedback) {
      const avg = Math.round((result.feedback.grammar.score + result.feedback.vocabulary.score + result.feedback.fluency.score) / 3);
      sessionScores.push(avg);
      updateStats();
    }

    const toSpeak = [result.response, result.followup].filter(Boolean).join(' ');
    Speech.speak(toSpeak);

    transcript.push({ role: 'You', text });
    transcript.push({ role: 'Nova', text: toSpeak, feedback: result.feedback });
  } catch (err) {
    removeThinking(thinkId);
    addErrorMessage(err.message);
    console.error('[Speaking Practice]', err);
  }
}

// ── Chat Rendering (tp-* classes) ─────────────────────────────────
function addUserMessage(text) {
  const chatArea = document.getElementById('chatArea');
  removeWelcome();
  const div = document.createElement('div');
  div.className = 'tp-msg user';
  div.innerHTML = `<div class="tp-avatar">🧑</div><div class="tp-bubble">${escHtml(text)}</div>`;
  chatArea.appendChild(div);
  scrollChat();
}

function addTutorMessage(result) {
  const chatArea = document.getElementById('chatArea');
  removeWelcome();

  const div = document.createElement('div');
  div.className = 'tp-msg tutor';

  let inner = `<div class="tp-avatar">🤖</div><div class="tp-bubble">`;
  inner += `<div>${escHtml(result.response || '')}</div>`;

  if (result.feedback) {
    if (result.feedback.correction) {
      inner += `<div class="tp-correction-block"><strong>💡 Correction</strong>${escHtml(result.feedback.correction)}</div>`;
    }
    const scores = result.feedback;
    inner += `<div class="tp-scores-row">
      ${scoreChip('Grammar', scores.grammar?.score)}
      ${scoreChip('Vocabulary', scores.vocabulary?.score)}
      ${scoreChip('Fluency', scores.fluency?.score)}
    </div>`;
    if (scores.overall) {
      inner += `<div style="margin-top:8px;font-size:12.5px;color:var(--t-muted)">${escHtml(scores.overall)}</div>`;
    }
  }

  if (result.followup) {
    inner += `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--t-border);font-size:13.5px">${escHtml(result.followup)}</div>`;
  }

  inner += `</div>`;
  div.innerHTML = inner;
  chatArea.appendChild(div);
  scrollChat();
}

function scoreChip(label, score) {
  if (!score) return '';
  const cls = score >= 85 ? 'good' : score >= 65 ? 'ok' : 'bad';
  return `<span class="tp-score-chip ${cls}">${label}: ${score}</span>`;
}

function addThinking() {
  const chatArea = document.getElementById('chatArea');
  const id = 'think_' + Date.now();
  const div = document.createElement('div');
  div.className = 'tp-msg tutor';
  div.id = id;
  div.innerHTML = `<div class="tp-avatar">🤖</div><div class="tp-thinking-bubble"><div class="tp-dot"></div><div class="tp-dot"></div><div class="tp-dot"></div></div>`;
  chatArea.appendChild(div);
  scrollChat();
  return id;
}

function removeThinking(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function addErrorMessage(msg) {
  const chatArea = document.getElementById('chatArea');
  const div = document.createElement('div');
  div.className = 'tp-msg tutor';
  div.innerHTML = `<div class="tp-avatar">⚠️</div><div class="tp-bubble" style="border-color:var(--t-red);color:var(--t-red)">Error: ${escHtml(msg)}<br><small>Please check your connection and try again.</small></div>`;
  chatArea.appendChild(div);
  scrollChat();
}

// ── Feedback Bar ──────────────────────────────────────────────────
function updateFeedbackBar(feedback) {
  if (!feedback) return;
  const strip = document.getElementById('feedbackStrip');
  strip.style.display = 'flex';

  const items = [
    { fill: 'fillGrammar', score: 'scoreGrammar', val: feedback.grammar?.score },
    { fill: 'fillVocab',   score: 'scoreVocab',   val: feedback.vocabulary?.score },
    { fill: 'fillFluency', score: 'scoreFluency',  val: feedback.fluency?.score }
  ];

  items.forEach(({ fill, score, val }) => {
    if (!val) return;
    const fillEl = document.getElementById(fill);
    const scoreEl = document.getElementById(score);
    fillEl.style.width = val + '%';
    fillEl.style.background = val >= 85 ? 'var(--t-green)' : val >= 65 ? 'var(--t-yellow)' : 'var(--t-red)';
    scoreEl.textContent = val;
  });
}

// ── Session Stats ─────────────────────────────────────────────────
function updateStats() {
  document.getElementById('statTurns').textContent = sessionTurns;
  document.getElementById('statWords').textContent = sessionWords;
  if (sessionScores.length) {
    const avg = Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);
    document.getElementById('statScore').textContent = avg;
  }
}

// ── Utilities ──────────────────────────────────────────────────────
function updateLanguage() {
  currentLang = document.getElementById('langSelect').value;
}

function clearChat(addGreeting = true) {
  const chatArea = document.getElementById('chatArea');
  chatArea.innerHTML = '';
  Tutor.clearHistory();
  transcript = [];
  sessionTurns = 0;
  sessionWords = 0;
  sessionScores = [];
  updateStats();
  document.getElementById('feedbackStrip').style.display = 'none';
  if (addGreeting) {
    chatArea.innerHTML = `<div class="tp-welcome-card">
      <div class="tp-welcome-icon">🎤</div>
      <h2>Ready to improve your speaking?</h2>
      <p>Choose a practice mode, then press the mic and start talking.</p>
      <div class="tp-tip-pills"><span class="tp-pill">Speak clearly</span><span class="tp-pill">Chrome works best</span><span class="tp-pill">Any topic welcome</span></div>
    </div>`;
  }
}

function removeWelcome() {
  const w = document.querySelector('.tp-welcome-card');
  if (w) w.remove();
}

function scrollChat() {
  const c = document.getElementById('chatArea');
  c.scrollTop = c.scrollHeight;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function downloadTranscript() {
  if (!transcript.length) { alert('No conversation yet!'); return; }
  let text = `InterviewAI — Speaking Practice Transcript\nDate: ${new Date().toLocaleString()}\nMode: ${modeLabels[currentMode]}\n${'─'.repeat(50)}\n\n`;
  transcript.forEach(t => {
    text += `[${t.role}]: ${t.text}\n`;
    if (t.feedback) {
      text += `  Grammar: ${t.feedback.grammar?.score}/100 | Vocabulary: ${t.feedback.vocabulary?.score}/100 | Fluency: ${t.feedback.fluency?.score}/100\n`;
    }
    text += '\n';
  });
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `speaking-practice-${Date.now()}.txt`;
  a.click();
}