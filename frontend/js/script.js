/* ============================================================
   INTERVIEW AI EVALUATOR — script.js
   Complete production-ready JS
   ============================================================ */

window.onload = () => {

  /* ── DOM References ──────────────────────────────────────── */
  const evaluateBtn        = document.getElementById('evaluateBtn');
  const resetBtn           = document.getElementById('resetBtn');
  const resultsSection     = document.getElementById('resultsSection');
  const openSpeechModal    = document.getElementById('openSpeechModal');
  const closeModal         = document.getElementById('closeModal');
  const speechModal        = document.getElementById('speechModal');
  const startRecording     = document.getElementById('startRecording');
  const stopRecording      = document.getElementById('stopRecording');
  const processingStatus   = document.getElementById('processingStatus');
  const speechResults      = document.getElementById('speechResults');
  const applyMetrics       = document.getElementById('applyMetrics');
  const recordingTimer     = document.getElementById('recordingTimer');
  const timerDisplay       = document.getElementById('timerDisplay');
  const vizIdleText        = document.getElementById('vizIdleText');
  const transcriptText     = document.getElementById('transcriptText');

  /* Form fields */
  const fExperience        = document.getElementById('Experience_Years');
  const fRoleType          = document.getElementById('Role_Type');
  const fDifficulty        = document.getElementById('Interview_Difficulty');
  const fSpeakingRate      = document.getElementById('Speaking_Rate');
  const fAvgPitch          = document.getElementById('Avg_Pitch');
  const fPauseDuration     = document.getElementById('Pause_Duration');
  const fFillerWords       = document.getElementById('Filler_Words');
  const fResponseLength    = document.getElementById('Response_Length');
  const fSentiment         = document.getElementById('Sentiment_Score');
  const fTechCorrect       = document.getElementById('Technical_Correctness');
  const fGrammar           = document.getElementById('Grammar_Score');
  const fCommScore         = document.getElementById('Communication_Score');
  const fEyeContact        = document.getElementById('Eye_Contact_Score');

  /* Result display */
  const stressLevel        = document.getElementById('stressLevel');
  const confidenceScore    = document.getElementById('confidenceScore');
  const interviewResult    = document.getElementById('interviewResult');
  const stressIndicator    = document.getElementById('stressIndicator');
  const verdictBadge       = document.getElementById('verdictBadge');
  const verdictIcon        = document.getElementById('verdictIcon');
  const confidenceRingCircle = document.getElementById('confidenceRingCircle');

  const summaryRole        = document.getElementById('summaryRole');
  const summaryExp         = document.getElementById('summaryExp');
  const summaryDiff        = document.getElementById('summaryDiff');
  const summarySpeaking    = document.getElementById('summarySpeaking');
  const summaryTime        = document.getElementById('summaryTime');

  /* Score bars */
  const technicalBar       = document.getElementById('technicalBar');
  const grammarBar         = document.getElementById('grammarBar');
  const commBar            = document.getElementById('commBar');
  const eyeBar             = document.getElementById('eyeBar');
  const technicalVal       = document.getElementById('technicalVal');
  const grammarVal         = document.getElementById('grammarVal');
  const commVal            = document.getElementById('commVal');
  const eyeVal             = document.getElementById('eyeVal');

  /* Sentiment display */
  const sentimentEmoji     = document.getElementById('sentimentEmoji');
  const sentimentText      = document.getElementById('sentimentText');

  /* Difficulty pills */
  const diffPills          = document.querySelectorAll('.difficulty-pills .pill');

  /* Toast */
  const toast              = document.getElementById('toast');
  const toastIcon          = document.getElementById('toastIcon');
  const toastMsg           = document.getElementById('toastMsg');

  /* Visualizer */
  const canvas             = document.getElementById('visualizerCanvas');
  const ctx                = canvas.getContext('2d');

  /* ── State ───────────────────────────────────────────────── */
  let mediaRecorder        = null;
  let audioChunks          = [];
  let timerInterval        = null;
  let timerSeconds         = 0;
  let animationFrameId     = null;
  let analyserNode         = null;
  let audioCtx             = null;
  let speechMetrics        = null;

  const ROLE_LABELS = {
    '0': 'Data Scientist',
    '1': 'Software Engineer',
    '2': 'Data Analyst',
    '3': 'ML Engineer',
    '4': 'Frontend Developer',
    '5': 'Backend Developer'
  };
  const DIFF_LABELS = { '0': 'Easy', '1': 'Medium', '2': 'Hard' };

  /* ── Toast ───────────────────────────────────────────────── */
  let toastTimeout;
  function showToast(msg, type = 'success') {
    clearTimeout(toastTimeout);
    toastIcon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toastMsg.textContent  = msg;
    toast.className       = 'toast show';
    toastTimeout = setTimeout(() => { toast.className = 'toast'; }, 3200);
  }

  /* ── Difficulty Pills ────────────────────────────────────── */
  fDifficulty.addEventListener('change', () => {
    const v = fDifficulty.value;
    diffPills.forEach(p => p.classList.remove('active'));
    if (v === '0') diffPills[0].classList.add('active');
    else if (v === '1') diffPills[1].classList.add('active');
    else if (v === '2') diffPills[2].classList.add('active');
  });

  /* ── Score Bars ──────────────────────────────────────────── */
  function updateBar(selectEl, barEl, valEl) {
    selectEl.addEventListener('change', () => {
      const v = parseInt(selectEl.value, 10);
      barEl.style.width = (v * 10) + '%';
      valEl.textContent = v;
    });
  }
  updateBar(fTechCorrect, technicalBar, technicalVal);
  updateBar(fGrammar,     grammarBar,   grammarVal);
  updateBar(fCommScore,   commBar,      commVal);
  updateBar(fEyeContact,  eyeBar,       eyeVal);

  /* ── Sentiment Display ───────────────────────────────────── */
  fSentiment.addEventListener('input', () => updateSentimentDisplay(parseFloat(fSentiment.value)));
  function updateSentimentDisplay(val) {
    if (isNaN(val)) { sentimentEmoji.textContent = '😐'; sentimentText.textContent = 'Neutral'; return; }
    if (val > 0.4)       { sentimentEmoji.textContent = '😄'; sentimentText.textContent = 'Very Positive'; }
    else if (val > 0.1)  { sentimentEmoji.textContent = '🙂'; sentimentText.textContent = 'Positive'; }
    else if (val > -0.1) { sentimentEmoji.textContent = '😐'; sentimentText.textContent = 'Neutral'; }
    else if (val > -0.4) { sentimentEmoji.textContent = '😕'; sentimentText.textContent = 'Negative'; }
    else                 { sentimentEmoji.textContent = '😔'; sentimentText.textContent = 'Very Negative'; }
  }

  /* ── Modal Open / Close ──────────────────────────────────── */
  openSpeechModal.addEventListener('click', () => {
    speechModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    console.log('[Modal] Opened speech analyzer modal');
  });

  function closeSpeechModal() {
    speechModal.classList.remove('active');
    document.body.style.overflow = '';
    stopVisualization();
    console.log('[Modal] Closed');
  }
  closeModal.addEventListener('click', closeSpeechModal);
  speechModal.addEventListener('click', (e) => { if (e.target === speechModal) closeSpeechModal(); });

  /* ── Timer ───────────────────────────────────────────────── */
  function startTimer() {
    timerSeconds = 0;
    timerDisplay.textContent = '00:00';
    recordingTimer.style.display = 'flex';
    timerInterval = setInterval(() => {
      timerSeconds++;
      const m = String(Math.floor(timerSeconds / 60)).padStart(2,'0');
      const s = String(timerSeconds % 60).padStart(2,'0');
      timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerInterval);
    recordingTimer.style.display = 'none';
  }

  /* ── Canvas Visualizer ───────────────────────────────────── */
  function drawIdleWave() {
    const W = canvas.width; const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() / 1000;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = H/2 + Math.sin(x * 0.04 + t * 2) * 6 + Math.sin(x * 0.02 + t * 1.2) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0,0,W,0);
    grad.addColorStop(0, 'rgba(0,245,255,0.6)');
    grad.addColorStop(1, 'rgba(191,0,255,0.6)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.stroke();
    animationFrameId = requestAnimationFrame(drawIdleWave);
  }

  function drawLiveWave(analyser) {
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);
    function render() {
      animationFrameId = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);
      const W = canvas.width; const H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      const sliceWidth = W / bufferLength;
      let x = 0;
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128;
        const y = (v * H) / 2;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        x += sliceWidth;
      }
      const grad = ctx.createLinearGradient(0,0,W,0);
      grad.addColorStop(0,'rgba(255,61,127,0.9)');
      grad.addColorStop(0.5,'rgba(255,107,53,0.9)');
      grad.addColorStop(1,'rgba(255,216,74,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    render();
  }

  function stopVisualization() {
    if (animationFrameId) { cancelAnimationFrame(animationFrameId); animationFrameId = null; }
  }

  /* ── Recording ───────────────────────────────────────────── */
  startRecording.addEventListener('click', async () => {
    console.log('[Recording] Start requested');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('[Recording] Microphone access granted');

      audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 512;
      source.connect(analyserNode);

      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks   = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        console.log('[Recording] Stopped, processing audio...');
        stream.getTracks().forEach(t => t.stop());
        stopVisualization();
        drawIdleWave();
        vizIdleText.style.display = 'none';
        await processAudio();
      };

      mediaRecorder.start(250);

      startRecording.disabled = true;
      stopRecording.disabled  = false;
      vizIdleText.style.display = 'none';
      speechResults.style.display = 'none';
      processingStatus.style.display = 'none';
      stopVisualization();
      drawLiveWave(analyserNode);
      startTimer();
      showToast('Recording started!', 'info');
      console.log('[Recording] MediaRecorder running');

    } catch (err) {
      console.error('[Recording] Microphone error:', err);
      showToast('Microphone access denied. Please allow microphone.', 'error');
    }
  });

  stopRecording.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('[Recording] Stop requested');
      stopTimer();
      mediaRecorder.stop();
      startRecording.disabled = false;
      stopRecording.disabled  = true;
    }
  });

  /* ── Process Audio → Backend ─────────────────────────────── */
  async function processAudio() {
    processingStatus.style.display = 'block';
    speechResults.style.display = 'none';
    console.log('[API] Sending audio to /analyze-audio ...');

    try {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');

      const res = await fetch('https://interview-ai-ibg1.onrender.com/analyze-audio', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = await res.json();
      console.log('[API] analyze-audio response:', data);

      processingStatus.style.display = 'none';
      speechMetrics = data;
      displaySpeechResults(data);
      showToast('Speech analysis complete!', 'success');

    } catch (err) {
      console.error('[API] analyze-audio error:', err);
      processingStatus.style.display = 'none';
      showToast('Failed to analyze audio. Check backend is running.', 'error');

      /* Fallback: show mock data so UI can still be tested */
      const mock = {
        transcript: '[Backend unavailable — mock data shown]\n"I believe I have strong problem-solving skills and enjoy working in collaborative environments."',
        Speaking_Rate: 112.4,
        Response_Length: 22,
        Filler_Words: 1,
        Sentiment_Score: 0.42,
        Avg_Pitch: 148.6,
        Pause_Duration: 1.3
      };
      speechMetrics = mock;
      displaySpeechResults(mock);
    }
  }

  /* ── Display Speech Analysis Results in Modal ────────────── */
  function displaySpeechResults(data) {
    transcriptText.textContent = data.transcript || 'No transcript available.';

    document.getElementById('m_SpeakingRate').textContent   = data.Speaking_Rate   != null ? data.Speaking_Rate.toFixed(1)   + ' wpm' : '—';
    document.getElementById('m_AvgPitch').textContent       = data.Avg_Pitch        != null ? data.Avg_Pitch.toFixed(1)       + ' Hz'  : '—';
    document.getElementById('m_PauseDuration').textContent  = data.Pause_Duration   != null ? data.Pause_Duration.toFixed(1)  + 's'    : '—';
    document.getElementById('m_FillerWords').textContent    = data.Filler_Words     != null ? data.Filler_Words               : '—';
    document.getElementById('m_ResponseLength').textContent = data.Response_Length  != null ? data.Response_Length + ' words' : '—';
    document.getElementById('m_Sentiment').textContent      = data.Sentiment_Score  != null ? data.Sentiment_Score.toFixed(2) : '—';

    speechResults.style.display = 'flex';
    speechResults.style.flexDirection = 'column';
  }

  /* ── Apply Metrics to Form ───────────────────────────────── */
  applyMetrics.addEventListener('click', () => {
    if (!speechMetrics) return;
    console.log('[Form] Applying speech metrics to form fields');

    setInputVal(fSpeakingRate,   speechMetrics.Speaking_Rate);
    setInputVal(fAvgPitch,       speechMetrics.Avg_Pitch);
    setInputVal(fPauseDuration,  speechMetrics.Pause_Duration);
    setInputVal(fFillerWords,    speechMetrics.Filler_Words);
    setInputVal(fResponseLength, speechMetrics.Response_Length);
    setInputVal(fSentiment,      speechMetrics.Sentiment_Score);

    if (speechMetrics.Sentiment_Score != null) {
      updateSentimentDisplay(parseFloat(speechMetrics.Sentiment_Score));
    }

    closeSpeechModal();
    showToast('Speech metrics applied to form!', 'success');
    speechMetrics = null;
  });

  function setInputVal(el, val) {
    if (val != null) {
      el.value = typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;
      /* Trigger animation flash */
      el.style.transition = 'background 0.4s';
      el.style.background = 'rgba(0,245,255,0.12)';
      setTimeout(() => { el.style.background = ''; }, 600);
    }
  }

  /* ── Evaluate Candidate ──────────────────────────────────── */
  evaluateBtn.addEventListener('click', async () => {
    console.log('[Evaluate] Button clicked');

    /* Validate required fields */
    const required = [fExperience, fRoleType, fDifficulty, fTechCorrect, fGrammar, fCommScore, fEyeContact];
    const missing  = required.filter(f => !f.value || f.value === '');

    if (missing.length > 0) {
      showToast('Please fill in all required fields.', 'error');
      missing[0].focus();
      missing[0].style.borderColor = 'var(--pink)';
      setTimeout(() => { missing[0].style.borderColor = ''; }, 1500);
      console.warn('[Validate] Missing fields:', missing.map(f => f.id));
      return;
    }

    /* Build payload */
    const payload = {
      Experience_Years:       parseFloat(fExperience.value),
      Role_Type:              parseInt(fRoleType.value, 10),
      Interview_Difficulty:   parseInt(fDifficulty.value, 10),
      Speaking_Rate:          fSpeakingRate.value    ? parseFloat(fSpeakingRate.value)    : 0,
      Avg_Pitch:              fAvgPitch.value        ? parseFloat(fAvgPitch.value)        : 0,
      Pause_Duration:         fPauseDuration.value   ? parseFloat(fPauseDuration.value)   : 0,
      Filler_Words:           fFillerWords.value     ? parseInt(fFillerWords.value, 10)   : 0,
      Response_Length:        fResponseLength.value  ? parseInt(fResponseLength.value, 10): 0,
      Sentiment_Score:        fSentiment.value       ? parseFloat(fSentiment.value)       : 0,
      Technical_Correctness:  parseInt(fTechCorrect.value, 10),
      Grammar_Score:          parseInt(fGrammar.value, 10),
      Communication_Score:    parseInt(fCommScore.value, 10),
      Eye_Contact_Score:      parseInt(fEyeContact.value, 10)
    };

    console.log('[API] POST /predict payload:', payload);

    /* Animate button */
    evaluateBtn.disabled = true;
    evaluateBtn.querySelector('.btn-inner').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite">
        <circle cx="12" cy="12" r="10" stroke-opacity=".25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
      Evaluating...`;

    try {
      const res = await fetch('https://interview-ai-ibg1.onrender.com/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const result = await res.json();
      console.log('[API] /predict response:', result);
      displayResults(result, payload);

    } catch (err) {
      console.error('[API] /predict error:', err);
      showToast('Backend unreachable — showing demo results.', 'error');

      /* Demo fallback */
      const demo = {
        stress_level:     payload.Interview_Difficulty === 2 ? 'High' : payload.Interview_Difficulty === 1 ? 'Medium' : 'Low',
        confidence_score: Math.round(40 + payload.Technical_Correctness * 3.5 + payload.Communication_Score * 1.5),
        interview_result: payload.Technical_Correctness >= 8 && payload.Communication_Score >= 6 ? 'Selected' : 'Not Selected'
      };
      displayResults(demo, payload);
    }

    evaluateBtn.disabled = false;
    evaluateBtn.querySelector('.btn-inner').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      Evaluate Candidate`;
  });

  /* ── Display Results ─────────────────────────────────────── */
  function displayResults(result, payload) {
    console.log('[UI] Rendering results:', result);

    const stress     = result.stress_level     || 'Unknown';
    const confidence = result.confidence_score != null ? parseFloat(result.confidence_score) : 0;
    const verdict    = result.interview_result || 'Unknown';

    /* Stress */
    stressLevel.textContent = stress;
    stressIndicator.textContent = stress;
    if (stress === 'Low' || stress === 'low') {
      stressLevel.style.color = 'var(--green)';
      stressIndicator.style.background = 'rgba(0,229,160,0.15)';
      stressIndicator.style.color = 'var(--green)';
      stressIndicator.style.border = '1px solid rgba(0,229,160,0.3)';
    } else if (stress === 'High' || stress === 'high') {
      stressLevel.style.color = 'var(--pink)';
      stressIndicator.style.background = 'rgba(255,61,127,0.15)';
      stressIndicator.style.color = 'var(--pink)';
      stressIndicator.style.border = '1px solid rgba(255,61,127,0.3)';
    } else {
      stressLevel.style.color = 'var(--yellow)';
      stressIndicator.style.background = 'rgba(255,216,74,0.15)';
      stressIndicator.style.color = 'var(--yellow)';
      stressIndicator.style.border = '1px solid rgba(255,216,74,0.3)';
    }

    /* Confidence */
    const clampedConf = Math.max(0, Math.min(100, confidence));
    confidenceScore.textContent = clampedConf.toFixed(1) + '%';
    animateConfidenceRing(clampedConf);

    /* Verdict */
    const isSelected = verdict.toLowerCase().includes('select') && !verdict.toLowerCase().includes('not');
    interviewResult.textContent = verdict;
    if (isSelected) {
      interviewResult.style.color = 'var(--green)';
      verdictIcon.textContent = '🏆';
      verdictBadge.textContent = '✓ SELECTED';
      verdictBadge.style.background = 'rgba(0,229,160,0.15)';
      verdictBadge.style.border = '1px solid rgba(0,229,160,0.3)';
      verdictBadge.style.color = 'var(--green)';
    } else {
      interviewResult.style.color = 'var(--pink)';
      verdictIcon.textContent = '📋';
      verdictBadge.textContent = '✕ NOT SELECTED';
      verdictBadge.style.background = 'rgba(255,61,127,0.15)';
      verdictBadge.style.border = '1px solid rgba(255,61,127,0.3)';
      verdictBadge.style.color = 'var(--pink)';
    }

    /* Summary Bar */
    summaryRole.textContent     = ROLE_LABELS[String(payload.Role_Type)]      || '—';
    summaryExp.textContent      = payload.Experience_Years + ' yr' + (payload.Experience_Years !== 1 ? 's' : '');
    summaryDiff.textContent     = DIFF_LABELS[String(payload.Interview_Difficulty)] || '—';
    summarySpeaking.textContent = payload.Speaking_Rate ? payload.Speaking_Rate + ' wpm' : 'N/A';
    summaryTime.textContent     = new Date().toLocaleTimeString();

    /* Show results section */
    resultsSection.style.display = 'block';
    resultsSection.style.animation = 'none';

    /* Re-trigger card animations */
    document.querySelectorAll('.animate-in').forEach((el, i) => {
      el.style.animation = 'none';
      el.style.opacity = '0';
      el.style.transform = 'translateY(28px) scale(0.96)';
      setTimeout(() => {
        el.style.animation = `cardReveal 0.55s cubic-bezier(0.34,1.4,0.64,1) ${i * 0.15}s forwards`;
      }, 30);
    });

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    showToast('Evaluation complete!', 'success');
    console.log('[UI] Results displayed successfully');
  }

  /* ── Confidence Ring Animation ───────────────────────────── */
  function animateConfidenceRing(targetPct) {
    const circumference = 201; // 2π × 32
    const targetOffset  = circumference - (targetPct / 100) * circumference;
    let current = circumference;
    const step  = (circumference - targetOffset) / 60;
    const tick = () => {
      current = Math.max(targetOffset, current - step);
      confidenceRingCircle.style.strokeDashoffset = current;
      if (current > targetOffset) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ── Reset ───────────────────────────────────────────────── */
  resetBtn.addEventListener('click', () => {
    console.log('[Reset] Resetting form');
    document.getElementById('evaluationForm').reset();
    resultsSection.style.display = 'none';

    /* Clear auto-fill fields */
    [fSpeakingRate, fAvgPitch, fPauseDuration, fFillerWords, fResponseLength, fSentiment].forEach(f => f.value = '');

    /* Reset bars */
    [technicalBar, grammarBar, commBar, eyeBar].forEach(b => { b.style.width = '0%'; });
    [technicalVal, grammarVal, commVal, eyeVal].forEach(v => { v.textContent = '—'; });

    /* Reset pills */
    diffPills.forEach(p => p.classList.remove('active'));

    /* Reset confidence ring */
    confidenceRingCircle.style.strokeDashoffset = '201';

    /* Reset sentiment */
    sentimentEmoji.textContent = '😐';
    sentimentText.textContent  = 'Neutral';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Form reset — ready for new evaluation.', 'info');
  });

  /* ── Initialise idle visualizer ──────────────────────────── */
  (function initVisualizer() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 90;
    drawIdleWave();
  })();

  /* Resize canvas when modal opens */
  openSpeechModal.addEventListener('click', () => {
    setTimeout(() => {
      canvas.width  = canvas.offsetWidth  || 500;
      canvas.height = canvas.offsetHeight || 90;
      stopVisualization();
      drawIdleWave();
      vizIdleText.style.display = 'block';
    }, 50);
  });

  /* ── Inject keyframe for spin (used in button) ───────────── */
  if (!document.getElementById('spin-style')) {
    const style = document.createElement('style');
    style.id = 'spin-style';
    style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(style);
  }

  console.log('[Init] Interview AI Evaluator loaded successfully ✓');

}; /* end window.onload */

