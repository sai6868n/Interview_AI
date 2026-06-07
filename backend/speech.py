import whisper
import librosa
import numpy as np
from textblob import TextBlob

# Load Whisper once
model = whisper.load_model("base")


def speech_to_text(audio_path):

    result = model.transcribe(audio_path,fp16=False)

    return result["text"]


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

    fillers = [
        "um",
        "uh",
        "like",
        "actually",
        "basically",
        "you know"
    ]

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

    pitches = librosa.yin(
        y,
        fmin=50,
        fmax=400
    )

    pitches = pitches[np.isfinite(pitches)]

    if len(pitches) == 0:
        return 0

    return round(float(np.mean(pitches)), 2)


def calculate_pause_duration(audio_path):

    y, sr = librosa.load(audio_path)

    intervals = librosa.effects.split(
        y,
        top_db=20
    )

    total_silence = 0

    previous_end = 0

    for start, end in intervals:

        silence = start - previous_end

        total_silence += silence

        previous_end = end

    total_silence_seconds = total_silence / sr

    return round(total_silence_seconds, 2)


def extract_speech_features(audio_path):

    try:

        text = speech_to_text(audio_path)

        speaking_rate = float(
            calculate_speaking_rate(
                text,
                audio_path
            )
        )

        response_length = int(
            calculate_response_length(
                text
            )
        )

        filler_words = int(
            calculate_filler_words(
                text
            )
        )

        sentiment_score = float(
            calculate_sentiment(
                text
            )
        )

        avg_pitch = float(
            calculate_average_pitch(
                audio_path
            )
        )

        pause_duration = float(
            calculate_pause_duration(
                audio_path
            )
        )

        features = {

            "transcript":
            str(text),

            "Speaking_Rate":
            speaking_rate,

            "Response_Length":
            response_length,

            "Filler_Words":
            filler_words,

            "Sentiment_Score":
            sentiment_score,

            "Avg_Pitch":
            avg_pitch,

            "Pause_Duration":
            pause_duration
        }

        print(
            "EXTRACTED FEATURES =",
            features
        )

        return features

    except Exception as e:

        print(
            "SPEECH ERROR =",
            str(e)
        )

        return {

            "transcript":
            "",

            "Speaking_Rate":
            120.0,

            "Response_Length":
            20,

            "Filler_Words":
            0,

            "Sentiment_Score":
            0.0,

            "Avg_Pitch":
            150.0,

            "Pause_Duration":
            1.5,

            "error":
            str(e)
        }


