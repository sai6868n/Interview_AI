from fastapi import FastAPI
from pydantic import BaseModel

from predict import evaluate_candidate
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
from speech import extract_speech_features
import os

app = FastAPI()
    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)      
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

    return evaluate_candidate(
        candidate.model_dump()
    )    
@app.post("/analyze-audio")
async def analyze_audio(
    file: UploadFile = File(...)
):

    try:

        file_path = "recording.webm"

        with open(file_path, "wb") as f:

            f.write(
                await file.read()
            )

        result = extract_speech_features(
            file_path
        )
        print("RESULT =",result)

        if os.path.exists(file_path):
            os.remove(file_path)

        return result

    except Exception as e:

        return {
            "error": str(e)
        }    
@app.get("/")
def home():
    return {
        "status": "running",
        "project": "Interview AI"
    }  

