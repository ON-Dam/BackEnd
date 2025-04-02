FROM python:3.10-slim

# 필수 패키지 설치
RUN apt-get update && \
    apt-get install -y ffmpeg python3-pip curl && \
    pip install --no-cache-dir yt-dlp

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
