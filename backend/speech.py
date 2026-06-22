import librosa
import numpy as np
from textblob import TextBlob

# ──────────────────────────────────────────────────────────────
# faster-whisper: CTranslate2-based reimplementation of Whisper.
# Same model weights, same accuracy, but 4-10x faster on CPU
# than the original openai-whisper package. This is the fix for
# the multi-minute transcription times on small/free hosting.
# ──────────────────────────────────────────────────────────────
from faster_whisper import WhisperModel

model = None

def get_model():
    global model
    if model is None:
        # "tiny" model, int8 quantization for speed on CPU,
        # cpu_threads tuned for small instances (adjust if you
        # later move to a host with more CPU cores).
        model = WhisperModel(
            "tiny",
            device="cpu",
            compute_type="int8",
            cpu_threads=4,
        )
    return model


def speech_to_text(audio_path):
    segments, info = get_model().transcribe(
        audio_path,
        language="en",       # skip language auto-detection — faster, avoids garbled non-English output
        beam_size=1,         # greedy decoding — fastest option, good enough for short interview answers
        vad_filter=True,     # skip silent stretches instead of transcribing them — faster + cleaner output
    )
    text = " ".join(segment.text for segment in segments)
    return text.strip()


def get_audio_duration(audio_path):
    y, sr = librosa.load(audio_path)
    return librosa.get_duration(y=y, sr=sr)


def calculate_speaking_rate(text, audio_path):
    words = len(text.split())
    duration = get_audio_duration(audio_path)
    minutes = duration / 60
    if minutes == 0:
        return 0
    return round(words / minutes, 2)


def calculate_response_length(text):
    return len(text.split())


def calculate_filler_words(text):
    fillers = ["um", "uh", "like", "actually", "basically", "you know"]
    count = 0
    text = text.lower()
    for word in fillers:
        count += text.count(word)
    return count


def calculate_sentiment(text):
    polarity = TextBlob(text).sentiment.polarity
    return round(polarity, 2)


def calculate_average_pitch(audio_path):
    y, sr = librosa.load(audio_path)
    pitches = librosa.yin(y, fmin=50, fmax=400)
    pitches = pitches[np.isfinite(pitches)]
    if len(pitches) == 0:
        return 0
    return round(float(np.mean(pitches)), 2)


def calculate_pause_duration(audio_path):
    y, sr = librosa.load(audio_path)
    intervals = librosa.effects.split(y, top_db=20)
    total_silence = 0
    previous_end = 0
    for start, end in intervals:
        silence = start - previous_end
        total_silence += silence
        previous_end = end
    return round(total_silence / sr, 2)


def extract_speech_features(audio_path):
    try:
        text = speech_to_text(audio_path)
        features = {
            "transcript": str(text),
            "Speaking_Rate": float(calculate_speaking_rate(text, audio_path)),
            "Response_Length": int(calculate_response_length(text)),
            "Filler_Words": int(calculate_filler_words(text)),
            "Sentiment_Score": float(calculate_sentiment(text)),
            "Avg_Pitch": float(calculate_average_pitch(audio_path)),
            "Pause_Duration": float(calculate_pause_duration(audio_path))
        }
        print("EXTRACTED FEATURES =", features)
        return features
    except Exception as e:
        print("SPEECH ERROR =", str(e))
        return {
            "transcript": "",
            "Speaking_Rate": 120.0,
            "Response_Length": 20,
            "Filler_Words": 0,
            "Sentiment_Score": 0.0,
            "Avg_Pitch": 150.0,
            "Pause_Duration": 1.5,
            "error": str(e)
        }