from fastapi import FastAPI
from pydantic import BaseModel

from predict import evaluate_candidate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from speech import extract_speech_features
import os
import uuid
import asyncio
import httpx
from typing import List

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

# ── Gemini config (Speaking Practice tutor) ─────────────────────
# Set GEMINI_API_KEY in Railway → your service → Variables.
# Never hardcode the key here.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


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


# ── Speaking Practice chat models ────────────────────────────────
class ChatMessage(BaseModel):
    role: str          # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    system: str
    messages: List[ChatMessage]


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


# ── Speaking Practice chat endpoint ──────────────────────────────
# Proxies to Gemini so the API key never reaches the browser.
# Retries on 429 (rate limit) with exponential backoff: 1s, 2s, 4s.
@app.post("/chat")
async def chat(req: ChatRequest):
    if not GEMINI_API_KEY:
        return {"error": "GEMINI_API_KEY not set on the backend"}

    contents = [
        {
            "role": "model" if m.role == "assistant" else "user",
            "parts": [{"text": m.content}],
        }
        for m in req.messages
    ]

    payload = {
        "system_instruction": {"parts": [{"text": req.system}]},
        "contents": contents,
        "generationConfig": {"maxOutputTokens": 1000, "temperature": 0.8},
    }

    max_retries = 3
    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(max_retries + 1):
            resp = await client.post(GEMINI_URL, params={"key": GEMINI_API_KEY}, json=payload)

            if resp.status_code == 200:
                data = resp.json()
                text = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [{}])[0]
                    .get("text", "")
                )
                return {"content": [{"type": "text", "text": text}]}

            if resp.status_code == 429 and attempt < max_retries:
                await asyncio.sleep(2 ** attempt)
                continue

            try:
                err_msg = resp.json().get("error", {}).get("message", "Gemini API error")
            except Exception:
                err_msg = "Gemini API error"
            return {"error": err_msg}


@app.get("/")
def home():
    return {
        "status": "running",
        "project": "Interview AI"
    }