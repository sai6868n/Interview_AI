/* ============================================================
   INTERVIEW AI EVALUATOR — script.js  (v4 — transcript toggle)
   ============================================================ */

window.onload = () => {

  /* ════════════════════════════════════════════════════════
     CONSTANTS
  ════════════════════════════════════════════════════════ */
  const BACKEND = 'https://interviewai-production-8f80.up.railway.app';

  const ROLE_LABELS = {
    '0': 'Data Scientist',
    '1': 'Software Engineer',
    '2': 'Data Analyst',
    '3': 'ML Engineer',
    '4': 'Frontend Developer',
    '5': 'Backend Developer'
  };

  const DIFF_LABELS = { '0': 'Easy', '1': 'Medium', '2': 'Hard' };

  /* ════════════════════════════════════════════════════════
     DOM REFERENCES
  ════════════════════════════════════════════════════════ */
  const evaluateBtn          = document.getElementById('evaluateBtn');
  const resetBtn             = document.getElementById('resetBtn');
  const resultsSection       = document.getElementById('resultsSection');
  const openSpeechModal      = document.getElementById('openSpeechModal');
  const closeModal           = document.getElementById('closeModal');
  const speechModal          = document.getElementById('speechModal');
  const startRecording       = document.getElementById('startRecording');
  const stopRecording        = document.getElementById('stopRecording');
  const processingStatus     = document.getElementById('processingStatus');
  const speechResults        = document.getElementById('speechResults');
  const applyMetrics         = document.getElementById('applyMetrics');
  const recordingTimer       = document.getElementById('recordingTimer');
  const timerDisplay         = document.getElementById('timerDisplay');
  const vizIdleText          = document.getElementById('vizIdleText');
  const transcriptText       = document.getElementById('transcriptText');
  const canvas               = document.getElementById('visualizerCanvas');
  const ctx                  = canvas.getContext('2d');

  /* Transcript toggle */
  const toggleTranscriptBtn   = document.getElementById('toggleTranscript');
  const toggleTranscriptLabel = document.getElementById('toggleTranscriptLabel');
  const transcriptBox         = document.getElementById('transcriptBox');

  /* Form fields */
  const fExperience          = document.getElementById('Experience_Years');
  const fRoleType            = document.getElementById('Role_Type');
  const fDifficulty          = document.getElementById('Interview_Difficulty');
  const fSpeakingRate        = document.getElementById('Speaking_Rate');
  const fAvgPitch            = document.getElementById('Avg_Pitch');
  const fPauseDuration       = document.getElementById('Pause_Duration');
  const fFillerWords         = document.getElementById('Filler_Words');
  const fResponseLength      = document.getElementById('Response_Length');
  const fSentiment           = document.getElementById('Sentiment_Score');
  const fTechCorrect         = document.getElementById('Technical_Correctness');
  const fGrammar             = document.getElementById('Grammar_Score');
  const fCommScore           = document.getElementById('Communication_Score');
  const fEyeContact          = document.getElementById('Eye_Contact_Score');

  /* Result display */
  const stressLevel          = document.getElementById('stressLevel');
  const confidenceScore      = document.getElementById('confidenceScore');
  const interviewResult      = document.getElementById('interviewResult');
  const stressIndicator      = document.getElementById('stressIndicator');
  const verdictBadge         = document.getElementById('verdictBadge');
  const verdictIcon          = document.getElementById('verdictIcon');
  const confidenceRingCircle = document.getElementById('confidenceRingCircle');
  const summaryRole          = document.getElementById('summaryRole');
  const summaryExp           = document.getElementById('summaryExp');
  const summaryDiff          = document.getElementById('summaryDiff');
  const summarySpeaking      = document.getElementById('summarySpeaking');
  const summaryTime          = document.getElementById('summaryTime');

  /* Score bars */
  const technicalBar         = document.getElementById('technicalBar');
  const grammarBar           = document.getElementById('grammarBar');
  const commBar              = document.getElementById('commBar');
  const eyeBar               = document.getElementById('eyeBar');
  const technicalVal         = document.getElementById('technicalVal');
  const grammarVal           = document.getElementById('grammarVal');
  const commVal              = document.getElementById('commVal');
  const eyeVal               = document.getElementById('eyeVal');

  /* Sentiment */
  const sentimentEmoji       = document.getElementById('sentimentEmoji');
  const sentimentText        = document.getElementById('sentimentText');

  /* Difficulty pills */
  const diffPills            = document.querySelectorAll('.difficulty-pills .pill');

  /* Toast */
  const toast                = document.getElementById('toast');
  const toastIcon            = document.getElementById('toastIcon');
  const toastMsg             = document.getElementById('toastMsg');

  /* Processing text elements */
  const processingText       = document.querySelector('.processing-text');
  const processingSub        = document.querySelector('.processing-sub');

  /* ════════════════════════════════════════════════════════
     STATE
  ════════════════════════════════════════════════════════ */
  let mediaRecorder    = null;
  let audioChunks      = [];
  let timerInterval    = null;
  let timerSeconds     = 0;
  let animationFrameId = null;
  let analyserNode     = null;
  let audioCtx         = null;
  let speechMetrics    = null;
  let backendAwake     = false;

  /* ════════════════════════════════════════════════════════
     WAKE UP BACKEND ON PAGE LOAD
     Keeps the backend warm so the first real request is faster.
  ════════════════════════════════════════════════════════ */
  (function wakeBackend() {
    console.log('[Backend] Pinging backend to warm it up...');
    fetch(`${BACKEND}/`)
      .then(r => r.json())
      .then(d => {
        backendAwake = true;
        console.log('[Backend] Awake:', d.status);
      })
      .catch(() => {
        console.warn('[Backend] Still waking up — will retry on first use');
      });
  })();

  /* ════════════════════════════════════════════════════════
     TOAST
  ════════════════════════════════════════════════════════ */
  let toastTimeout;
  function showToast(msg, type = 'success') {
    clearTimeout(toastTimeout);
    toastIcon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toastMsg.textContent  = msg;
    toast.className       = 'toast show';
    toastTimeout = setTimeout(() => { toast.className = 'toast'; }, 3500);
  }

  /* ════════════════════════════════════════════════════════
     DIFFICULTY PILLS
  ════════════════════════════════════════════════════════ */
  fDifficulty.addEventListener('change', () => {
    const v = fDifficulty.value;
    diffPills.forEach(p => p.classList.remove('active'));
    if (v === '0') diffPills[0]?.classList.add('active');
    else if (v === '1') diffPills[1]?.classList.add('active');
    else if (v === '2') diffPills[2]?.classList.add('active');
  });

  /* ════════════════════════════════════════════════════════
     SCORE BARS
  ════════════════════════════════════════════════════════ */
  function bindScoreBar(selectEl, barEl, valEl) {
    selectEl.addEventListener('change', () => {
      const v = parseInt(selectEl.value, 10);
      barEl.style.width = (v * 10) + '%';
      valEl.textContent = v;
    });
  }
  bindScoreBar(fTechCorrect, technicalBar, technicalVal);
  bindScoreBar(fGrammar,     grammarBar,   grammarVal);
  bindScoreBar(fCommScore,   commBar,      commVal);
  bindScoreBar(fEyeContact,  eyeBar,       eyeVal);

  /* ════════════════════════════════════════════════════════
     SENTIMENT DISPLAY
  ════════════════════════════════════════════════════════ */
  fSentiment.addEventListener('input', () => updateSentiment(parseFloat(fSentiment.value)));

  function updateSentiment(val) {
    if (isNaN(val)) {
      sentimentEmoji.textContent = '😐';
      sentimentText.textContent  = 'Neutral';
      return;
    }
    if      (val >  0.4) { sentimentEmoji.textContent = '😄'; sentimentText.textContent = 'Very Positive'; }
    else if (val >  0.1) { sentimentEmoji.textContent = '🙂'; sentimentText.textContent = 'Positive'; }
    else if (val > -0.1) { sentimentEmoji.textContent = '😐'; sentimentText.textContent = 'Neutral'; }
    else if (val > -0.4) { sentimentEmoji.textContent = '😕'; sentimentText.textContent = 'Negative'; }
    else                 { sentimentEmoji.textContent = '😔'; sentimentText.textContent = 'Very Negative'; }
  }

  /* ════════════════════════════════════════════════════════
     TRANSCRIPT TOGGLE
  ════════════════════════════════════════════════════════ */
  toggleTranscriptBtn?.addEventListener('click', () => {
    const isHidden = transcriptBox.style.display === 'none';
    transcriptBox.style.display = isHidden ? 'block' : 'none';
    toggleTranscriptLabel.textContent = isHidden ? 'Hide Speech Transcript' : 'Show Speech Transcript';
  });

  function resetTranscriptToggle() {
    if (!transcriptBox || !toggleTranscriptLabel) return;
    transcriptBox.style.display = 'none';
    toggleTranscriptLabel.textContent = 'Show Speech Transcript';
  }

  /* ════════════════════════════════════════════════════════
     MODAL OPEN / CLOSE
  ════════════════════════════════════════════════════════ */
  openSpeechModal.addEventListener('click', () => {
    speechModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      canvas.width  = canvas.offsetWidth  || 500;
      canvas.height = canvas.offsetHeight || 90;
      stopVisualization();
      drawIdleWave();
      if (vizIdleText) vizIdleText.style.display = 'block';
    }, 50);
  });

  function closeSpeechModal() {
    speechModal.classList.remove('active');
    document.body.style.overflow = '';
    stopVisualization();
  }

  closeModal.addEventListener('click', closeSpeechModal);
  speechModal.addEventListener('click', e => {
    if (e.target === speechModal) closeSpeechModal();
  });

  /* ════════════════════════════════════════════════════════
     RECORDING TIMER
  ════════════════════════════════════════════════════════ */
  function startTimer() {
    timerSeconds = 0;
    timerDisplay.textContent = '00:00';
    recordingTimer.style.display = 'flex';
    timerInterval = setInterval(() => {
      timerSeconds++;
      const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');
      timerDisplay.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    recordingTimer.style.display = 'none';
  }

  /* ════════════════════════════════════════════════════════
     CANVAS VISUALIZER
  ════════════════════════════════════════════════════════ */
  function drawIdleWave() {
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const t = Date.now() / 1000;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const y = H / 2 + Math.sin(x * 0.04 + t * 2) * 6 + Math.sin(x * 0.02 + t * 1.2) * 4;
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(0,245,255,0.6)');
    grad.addColorStop(1, 'rgba(191,0,255,0.6)');
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 2;
    ctx.stroke();
    animationFrameId = requestAnimationFrame(drawIdleWave);
  }

  function drawLiveWave(analyser) {
    const bufferLength = analyser.fftSize;
    const dataArray    = new Uint8Array(bufferLength);
    function render() {
      animationFrameId = requestAnimationFrame(render);
      analyser.getByteTimeDomainData(dataArray);
      const W = canvas.width;
      const H = canvas.height;
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
      const grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0,   'rgba(255,61,127,0.9)');
      grad.addColorStop(0.5, 'rgba(255,107,53,0.9)');
      grad.addColorStop(1,   'rgba(255,216,74,0.9)');
      ctx.strokeStyle = grad;
      ctx.lineWidth   = 2.5;
      ctx.stroke();
    }
    render();
  }

  function stopVisualization() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }

  /* ════════════════════════════════════════════════════════
     RECORDING
  ════════════════════════════════════════════════════════ */
  startRecording.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioCtx     = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 512;
      source.connect(analyserNode);

      mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunks   = [];

      mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        stopVisualization();
        drawIdleWave();
        if (vizIdleText) vizIdleText.style.display = 'none';
        await processAudio();
      };

      mediaRecorder.start(250);

      startRecording.disabled          = true;
      stopRecording.disabled           = false;
      if (vizIdleText) vizIdleText.style.display = 'none';
      speechResults.style.display      = 'none';
      processingStatus.style.display   = 'none';
      resetTranscriptToggle();

      stopVisualization();
      drawLiveWave(analyserNode);
      startTimer();
      showToast('Recording started — speak clearly!', 'info');

    } catch (err) {
      console.error('[Recording] Error:', err);
      showToast('Microphone access denied. Please allow microphone.', 'error');
    }
  });

  stopRecording.addEventListener('click', () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      stopTimer();
      mediaRecorder.stop();
      startRecording.disabled = false;
      stopRecording.disabled  = true;
    }
  });

  /* ════════════════════════════════════════════════════════
     PROCESS AUDIO → BACKEND
     Uses AbortController for 90-second timeout to handle
     backend cold starts (can take 30-60s after idle).
  ════════════════════════════════════════════════════════ */
  async function processAudio() {
    processingStatus.style.display = 'block';
    speechResults.style.display    = 'none';
    resetTranscriptToggle();

    /* Show cold-start warning if backend hasn't confirmed awake */
    if (processingText) processingText.textContent = '⏳ Processing Speech...';
    if (processingSub)  processingSub.textContent  = backendAwake
      ? 'Analyzing audio with AI models...'
      : '🔄 Backend waking up — this may take 30–60s on first use';

    const blob     = new Blob(audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('file', blob, 'recording.webm');

    /* 180-second timeout — Whisper + librosa processing has been
       observed taking 60-90+ seconds on the current Railway plan */
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 180000);

    try {
      const res = await fetch(`${BACKEND}/analyze-audio`, {
        method: 'POST',
        body:   formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();
      console.log('[API] /analyze-audio response:', data);

      /* Check if backend returned an error field (speech processing failed) */
      if (data.error) {
        console.warn('[API] Backend speech error:', data.error);
        showToast('Speech processing error — check backend logs.', 'error');
      } else {
        backendAwake = true;
        showToast('Speech analysis complete!', 'success');
      }

      processingStatus.style.display = 'none';
      speechMetrics = data;
      renderSpeechResults(data);

    } catch (err) {
      clearTimeout(timeoutId);
      console.error('[API] /analyze-audio error:', err);
      processingStatus.style.display = 'none';

      if (err.name === 'AbortError') {
        showToast('Request timed out — backend may still be waking up. Try again.', 'error');
      } else {
        showToast('Failed to reach backend. Showing demo data.', 'error');
      }

      /* Fallback mock so UI remains testable */
      const mock = {
        transcript:     '[Backend unavailable — mock data shown] "I believe I have strong problem-solving skills and enjoy working in collaborative environments."',
        Speaking_Rate:  112.4,
        Response_Length: 22,
        Filler_Words:   1,
        Sentiment_Score: 0.42,
        Avg_Pitch:      148.6,
        Pause_Duration: 1.3
      };
      speechMetrics = mock;
      renderSpeechResults(mock);
    }
  }

  /* ════════════════════════════════════════════════════════
     RENDER SPEECH RESULTS IN MODAL
  ════════════════════════════════════════════════════════ */
  function renderSpeechResults(data) {
    transcriptText.textContent = data.transcript || 'No transcript available.';
    resetTranscriptToggle();

    document.getElementById('m_SpeakingRate').textContent   = data.Speaking_Rate   != null ? Number(data.Speaking_Rate).toFixed(1)   + ' wpm' : '—';
    document.getElementById('m_AvgPitch').textContent       = data.Avg_Pitch        != null ? Number(data.Avg_Pitch).toFixed(1)       + ' Hz'  : '—';
    document.getElementById('m_PauseDuration').textContent  = data.Pause_Duration   != null ? Number(data.Pause_Duration).toFixed(1)  + 's'    : '—';
    document.getElementById('m_FillerWords').textContent    = data.Filler_Words     != null ? data.Filler_Words                               : '—';
    document.getElementById('m_ResponseLength').textContent = data.Response_Length  != null ? data.Response_Length + ' words'                : '—';
    document.getElementById('m_Sentiment').textContent      = data.Sentiment_Score  != null ? Number(data.Sentiment_Score).toFixed(2)         : '—';

    speechResults.style.display       = 'flex';
    speechResults.style.flexDirection = 'column';
  }

  /* ════════════════════════════════════════════════════════
     APPLY SPEECH METRICS TO FORM
  ════════════════════════════════════════════════════════ */
  applyMetrics.addEventListener('click', () => {
    if (!speechMetrics) return;

    setFieldValue(fSpeakingRate,  speechMetrics.Speaking_Rate);
    setFieldValue(fAvgPitch,      speechMetrics.Avg_Pitch);
    setFieldValue(fPauseDuration, speechMetrics.Pause_Duration);
    setFieldValue(fFillerWords,   speechMetrics.Filler_Words);
    setFieldValue(fResponseLength,speechMetrics.Response_Length);
    setFieldValue(fSentiment,     speechMetrics.Sentiment_Score);

    if (speechMetrics.Sentiment_Score != null) {
      updateSentiment(parseFloat(speechMetrics.Sentiment_Score));
    }

    closeSpeechModal();
    showToast('Speech metrics applied to form!', 'success');
    speechMetrics = null;
  });

  function setFieldValue(el, val) {
    if (val == null || !el) return;
    el.value = typeof val === 'number' ? parseFloat(val.toFixed(2)) : val;
    el.style.transition = 'background 0.4s';
    el.style.background = 'rgba(0,245,255,0.12)';
    setTimeout(() => { el.style.background = ''; }, 700);
  }

  /* ════════════════════════════════════════════════════════
     EVALUATE CANDIDATE → /predict
  ════════════════════════════════════════════════════════ */
  evaluateBtn.addEventListener('click', async () => {

    /* Validate required fields */
    const required = [fExperience, fRoleType, fDifficulty, fTechCorrect, fGrammar, fCommScore, fEyeContact];
    const missing  = required.filter(f => !f.value || f.value === '');

    if (missing.length > 0) {
      showToast('Please fill in all required fields.', 'error');
      missing[0].focus();
      missing[0].style.borderColor = 'var(--pink)';
      setTimeout(() => { missing[0].style.borderColor = ''; }, 1500);
      return;
    }

    /* Build payload */
    const payload = {
      Experience_Years:      parseFloat(fExperience.value),
      Role_Type:             parseInt(fRoleType.value, 10),
      Interview_Difficulty:  parseInt(fDifficulty.value, 10),
      Speaking_Rate:         fSpeakingRate.value   ? parseFloat(fSpeakingRate.value)    : 0,
      Avg_Pitch:             fAvgPitch.value        ? parseFloat(fAvgPitch.value)        : 0,
      Pause_Duration:        fPauseDuration.value   ? parseFloat(fPauseDuration.value)   : 0,
      Filler_Words:          fFillerWords.value     ? parseInt(fFillerWords.value, 10)   : 0,
      Response_Length:       fResponseLength.value  ? parseInt(fResponseLength.value, 10): 0,
      Sentiment_Score:       fSentiment.value       ? parseFloat(fSentiment.value)       : 0,
      Technical_Correctness: parseInt(fTechCorrect.value, 10),
      Grammar_Score:         parseInt(fGrammar.value, 10),
      Communication_Score:   parseInt(fCommScore.value, 10),
      Eye_Contact_Score:     parseInt(fEyeContact.value, 10)
    };

    /* Button loading state */
    evaluateBtn.disabled = true;
    evaluateBtn.querySelector('.btn-inner').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        style="animation:spin 1s linear infinite">
        <circle cx="12" cy="12" r="10" stroke-opacity=".25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
      </svg>
      Evaluating...`;

    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${BACKEND}/predict`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
        signal:  controller.signal
      });

      clearTimeout(tid);

      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const result = await res.json();
      console.log('[API] /predict response:', result);
      renderResults(result, payload);

    } catch (err) {
      console.error('[API] /predict error:', err);

      if (err.name === 'AbortError') {
        showToast('Request timed out — backend may be starting up. Try again.', 'error');
      } else {
        showToast('Backend unreachable — showing demo results.', 'error');
      }

      /* Calculated demo fallback based on actual form values */
      const demo = {
        stress_level:     payload.Interview_Difficulty === 2 ? 'High' : payload.Interview_Difficulty === 1 ? 'Medium' : 'Low',
        confidence_score: Math.min(99, Math.round(30 + payload.Technical_Correctness * 3 + payload.Communication_Score * 2 + payload.Grammar_Score)),
        interview_result: (payload.Technical_Correctness >= 8 && payload.Communication_Score >= 7) ? 'Selected' : 'Not Selected'
      };
      renderResults(demo, payload);
    }

    /* Restore button */
    evaluateBtn.disabled = false;
    evaluateBtn.querySelector('.btn-inner').innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
      Evaluate Candidate`;
  });

  /* ════════════════════════════════════════════════════════
     RENDER RESULTS
  ════════════════════════════════════════════════════════ */
  function renderResults(result, payload) {
    const stress     = result.stress_level     || 'Unknown';
    const confidence = result.confidence_score != null ? parseFloat(result.confidence_score) : 0;
    const verdict    = result.interview_result || 'Unknown';

    /* ── Stress ── */
    stressLevel.textContent     = stress;
    stressIndicator.textContent = stress;

    const stressStyles = {
      low:    { color: 'var(--green)',  bg: 'rgba(0,229,160,0.15)',   border: '1px solid rgba(0,229,160,0.3)' },
      medium: { color: 'var(--yellow)', bg: 'rgba(255,216,74,0.15)',  border: '1px solid rgba(255,216,74,0.3)' },
      high:   { color: 'var(--pink)',   bg: 'rgba(255,61,127,0.15)',  border: '1px solid rgba(255,61,127,0.3)' }
    };
    const stressKey = stress.toLowerCase();
    const ss = stressStyles[stressKey] || stressStyles.medium;

    stressLevel.style.color              = ss.color;
    stressIndicator.style.color          = ss.color;
    stressIndicator.style.background     = ss.bg;
    stressIndicator.style.border         = ss.border;

    /* ── Confidence ── */
    const clamped = Math.max(0, Math.min(100, confidence));
    confidenceScore.textContent = clamped.toFixed(1) + '%';
    animateRing(clamped);

    /* ── Verdict ── */
    const isSelected = verdict.toLowerCase().includes('select') && !verdict.toLowerCase().includes('not');
    interviewResult.textContent = verdict;

    if (isSelected) {
      interviewResult.style.color = 'var(--green)';
      verdictIcon.textContent     = '🏆';
      verdictBadge.textContent    = '✓ SELECTED';
      verdictBadge.style.background = 'rgba(0,229,160,0.15)';
      verdictBadge.style.border     = '1px solid rgba(0,229,160,0.3)';
      verdictBadge.style.color      = 'var(--green)';
    } else {
      interviewResult.style.color = 'var(--pink)';
      verdictIcon.textContent     = '📋';
      verdictBadge.textContent    = '✕ NOT SELECTED';
      verdictBadge.style.background = 'rgba(255,61,127,0.15)';
      verdictBadge.style.border     = '1px solid rgba(255,61,127,0.3)';
      verdictBadge.style.color      = 'var(--pink)';
    }

    /* ── Summary Bar ── */
    summaryRole.textContent     = ROLE_LABELS[String(payload.Role_Type)]           || '—';
    summaryExp.textContent      = payload.Experience_Years + ' yr' + (payload.Experience_Years !== 1 ? 's' : '');
    summaryDiff.textContent     = DIFF_LABELS[String(payload.Interview_Difficulty)] || '—';
    summarySpeaking.textContent = payload.Speaking_Rate ? payload.Speaking_Rate + ' wpm' : 'N/A';
    summaryTime.textContent     = new Date().toLocaleTimeString();

    /* ── Show results ── */
    resultsSection.style.display   = 'block';
    resultsSection.style.animation = 'none';

    document.querySelectorAll('.animate-in').forEach((el, i) => {
      el.style.animation  = 'none';
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(28px) scale(0.96)';
      setTimeout(() => {
        el.style.animation = `cardReveal 0.55s cubic-bezier(0.34,1.4,0.64,1) ${i * 0.15}s forwards`;
      }, 30);
    });

    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    /* ── Save to user-specific history ── */
    saveToHistory(result, payload);

    showToast('Evaluation complete!', 'success');
  }

  /* ════════════════════════════════════════════════════════
     SAVE TO USER-SPECIFIC HISTORY
  ════════════════════════════════════════════════════════ */
  function saveToHistory(result, payload) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('interviewai_user') || '{}');
      const userEmail   = currentUser.email || 'guest';
      const historyKey  = 'interviewai_history_' + userEmail;

      const existing = JSON.parse(localStorage.getItem(historyKey) || '[]');

      const entry = {
        id:         'h_' + Date.now(),
        date:       new Date().toISOString(),

        /* Dashboard / history page keys */
        role:        ROLE_LABELS[String(payload.Role_Type)] || 'Unknown',
        difficulty:  DIFF_LABELS[String(payload.Interview_Difficulty)] || 'Medium',
        confidence:  parseFloat(result.confidence_score || 0),
        stress:      result.stress_level    || 'Medium',
        result:      result.interview_result || 'Not Selected',
        speakingRate: payload.Speaking_Rate  || 0,
        avgPitch:    payload.Avg_Pitch       || 0,
        pauseDuration: payload.Pause_Duration || 0,
        fillerWords: payload.Filler_Words    || 0,
        responseLen: payload.Response_Length || 0,
        sentiment:   payload.Sentiment_Score || 0,
        techScore:   payload.Technical_Correctness || 0,
        commScore:   payload.Communication_Score   || 0,
        grammarScore: payload.Grammar_Score        || 0,
        eyeContact:  payload.Eye_Contact_Score     || 0,
        transcript:  speechMetrics?.transcript     || '',

        /* Raw keys for recommendations / profile pages */
        confidence_score:      parseFloat(result.confidence_score || 0),
        stress_level:          result.stress_level    || 'Medium',
        interview_result:      result.interview_result || 'Not Selected',
        Technical_Correctness: payload.Technical_Correctness || 0,
        Communication_Score:   payload.Communication_Score   || 0,
        Grammar_Score:         payload.Grammar_Score         || 0,
        Eye_Contact_Score:     payload.Eye_Contact_Score     || 0,
        Filler_Words:          payload.Filler_Words          || 0,
        Speaking_Rate:         payload.Speaking_Rate         || 0,
        Sentiment_Score:       payload.Sentiment_Score       || 0,
      };

      existing.unshift(entry); // newest first
      localStorage.setItem(historyKey, JSON.stringify(existing));

      /* Also write shared key so legacy pages still read something */
      localStorage.setItem('interviewai_history', JSON.stringify(existing));

      console.log('[History] Saved entry to', historyKey, '— total:', existing.length);

    } catch (e) {
      console.error('[History] Failed to save:', e);
    }
  }

  /* ════════════════════════════════════════════════════════
     CONFIDENCE RING ANIMATION
  ════════════════════════════════════════════════════════ */
  function animateRing(targetPct) {
    const circumference = 201; // 2π × 32
    const targetOffset  = circumference - (targetPct / 100) * circumference;
    let   current       = circumference;
    const step          = (circumference - targetOffset) / 60;

    const tick = () => {
      current = Math.max(targetOffset, current - step);
      confidenceRingCircle.style.strokeDashoffset = current;
      if (current > targetOffset) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ════════════════════════════════════════════════════════
     RESET FORM
  ════════════════════════════════════════════════════════ */
  resetBtn.addEventListener('click', () => {
    document.getElementById('evaluationForm').reset();
    resultsSection.style.display = 'none';

    [fSpeakingRate, fAvgPitch, fPauseDuration, fFillerWords, fResponseLength, fSentiment].forEach(f => { f.value = ''; });
    [technicalBar, grammarBar, commBar, eyeBar].forEach(b => { b.style.width = '0%'; });
    [technicalVal, grammarVal, commVal, eyeVal].forEach(v => { v.textContent = '—'; });
    diffPills.forEach(p => p.classList.remove('active'));

    confidenceRingCircle.style.strokeDashoffset = '201';
    sentimentEmoji.textContent = '😐';
    sentimentText.textContent  = 'Neutral';

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Form reset — ready for new evaluation.', 'info');
  });

  /* ════════════════════════════════════════════════════════
     INIT VISUALIZER
  ════════════════════════════════════════════════════════ */
  (function initVisualizer() {
    canvas.width  = canvas.offsetWidth  || 500;
    canvas.height = canvas.offsetHeight || 90;
    drawIdleWave();
  })();

  /* ════════════════════════════════════════════════════════
     SPIN KEYFRAME (for loading button)
  ════════════════════════════════════════════════════════ */
  if (!document.getElementById('spin-style')) {
    const s = document.createElement('style');
    s.id = 'spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
  }

  console.log('[InterviewAI] script.js v4 loaded ✓ (transcript toggle enabled)');

}; /* end window.onload */