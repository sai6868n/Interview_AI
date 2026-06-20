from fastapi import FastAPI
from pydantic import BaseModel

from predict import evaluate_candidate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from speech import extract_speech_features
import os
import uuid
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "https://interview-ai-nu-virid.vercel.app",
        "https://interview-ai-sai.netlify.app",
        "*"
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Concurrency guard ───────────────────────────────────────────
# Whisper transcription is CPU/RAM heavy. Running too many at once
# on a small Railway instance can crash or slow everyone down.
# This limits how many /analyze-audio requests run AT THE SAME TIME.
# Extra requests simply wait their turn — FastAPI queues them
# automatically behind this semaphore. No custom queue UI needed.
MAX_CONCURRENT_TRANSCRIPTIONS = 1  # raise to 2-3 later if RAM allows
transcription_semaphore = asyncio.Semaphore(MAX_CONCURRENT_TRANSCRIPTIONS)


class Candidate(BaseModel):
    Speaking_Rate: float
    Avg_Pitch: float
    Pause_Duration: float
    Filler_Words: int
    Response_Length: int

    Technical_Correctness: float
    Grammar_Score: float
    Sentiment_Score: float

    Eye_Contact_Score: float
    Communication_Score: float

    Experience_Years: float

    Interview_Difficulty: int
    Role_Type: int


@app.post("/predict")
def predict(candidate: Candidate):
    return evaluate_candidate(candidate.model_dump())


@app.post("/analyze-audio")
async def analyze_audio(file: UploadFile = File(...)):
    # Unique filename per request — prevents one user's audio from
    # overwriting another's mid-processing when requests overlap.
    file_path = f"recording_{uuid.uuid4().hex}.webm"

    try:
        with open(file_path, "wb") as f:
            f.write(await file.read())

        # Wait here if another transcription is already running.
        # The user's browser just sees "processing" a bit longer.
        async with transcription_semaphore:
            result = extract_speech_features(file_path)

        print("RESULT =", result)
        return result

    except Exception as e:
        return {"error": str(e)}

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.get("/")
def home():
    return {
        "status": "running",
        "project": "Interview AI"
    }
