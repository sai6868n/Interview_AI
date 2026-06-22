FROM python:3.11-slim

# ffmpeg system binary — still required by librosa/soundfile for audio decoding
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the faster-whisper "tiny" model at BUILD time so the
# container never has to fetch it on startup (avoids the memory/time
# spike that was crashing the container before).
RUN python -c "from faster_whisper import WhisperModel; WhisperModel('tiny', device='cpu', compute_type='int8')"

COPY . .

EXPOSE 8080

CMD uvicorn app:app --host 0.0.0.0 --port $PORT