FROM python:3.11-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the Whisper "tiny" model into the image at BUILD time.
# This means the container never has to download it on startup —
# removes the memory spike that was killing the container, and
# makes every cold start faster.
RUN python -c "import whisper; whisper.load_model('tiny')"

COPY . .

EXPOSE 8000

CMD uvicorn app:app --host 0.0.0.0 --port $PORT