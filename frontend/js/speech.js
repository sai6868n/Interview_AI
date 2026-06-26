// ── speech.js ── Web Speech API wrapper ──────────────────────────

const Speech = (() => {
  // ── Speech Recognition ─────────────────────────────────────────
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  let isListening = false;
  let finalTranscript = '';
  let interimTranscript = '';
  let onResultCb = null;
  let onEndCb = null;
  let silenceTimer = null;

  function initRecognition(lang = 'en-US') {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Google Chrome.');
      return false;
    }
    if (recognition) {
      recognition.abort();
    }
    recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (e) => {
      interimTranscript = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          finalTranscript += t + ' ';
        } else {
          interimTranscript += t;
        }
      }
      if (onResultCb) onResultCb(finalTranscript, interimTranscript);

      // Auto-stop after 2s silence
      clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        if (isListening) stopListening();
      }, 2200);
    };

    recognition.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        alert('Microphone access denied. Please allow microphone access in your browser settings.');
      }
      stopListening();
    };

    recognition.onend = () => {
      if (isListening) {
        // Restart if still expected to be listening
        try { recognition.start(); } catch (_) {}
      }
    };

    return true;
  }

  function startListening(lang, onResult, onEnd) {
    finalTranscript = '';
    interimTranscript = '';
    onResultCb = onResult;
    onEndCb = onEnd;
    if (!initRecognition(lang)) return;
    isListening = true;
    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  }

  function stopListening() {
    isListening = false;
    clearTimeout(silenceTimer);
    if (recognition) {
      recognition.stop();
      recognition.onend = null;
    }
    const result = finalTranscript.trim();
    finalTranscript = '';
    interimTranscript = '';
    if (onEndCb && result) onEndCb(result);
    else if (onEndCb) onEndCb(null);
    onResultCb = null;
    onEndCb = null;
  }

  function getIsListening() { return isListening; }

  // ── Speech Synthesis ───────────────────────────────────────────
  let voices = [];
  let selectedVoice = null;

  function loadVoices() {
    voices = window.speechSynthesis.getVoices();
    return voices;
  }

  // Voices load asynchronously in some browsers
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  loadVoices();

  function getVoices() {
    if (!voices.length) voices = window.speechSynthesis.getVoices();
    return voices;
  }

  function setVoice(voiceName) {
    selectedVoice = voices.find(v => v.name === voiceName) || null;
  }

  function speak(text, onDone) {
    if (!text) return;
    window.speechSynthesis.cancel(); // stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    if (selectedVoice) utterance.voice = selectedVoice;
    if (onDone) utterance.onend = onDone;
    window.speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    window.speechSynthesis.cancel();
  }

  return { startListening, stopListening, getIsListening, speak, stopSpeaking, getVoices, setVoice, loadVoices };
})();