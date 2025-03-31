from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from google.cloud import storage
import requests
import subprocess
import os
import uuid
import logging

app = FastAPI()
storage_client = storage.Client()
TMP_DIR = "/tmp"
logging.basicConfig(level=logging.INFO)

class DownloadRequest(BaseModel):
    video_id: str  # 유튜브 영상 ID (예: 'dQw4w9WgXcQ')
    bucket: str
    destination: str

@app.post("/download")
def download_video(req: DownloadRequest, authorization: str = Header(...)):
    access_token = authorization.replace("Bearer ", "").strip()
    headers = {"Authorization": f"Bearer {access_token}"}

    # 1. 유튜브 영상 정보 요청
    yt_api = f"https://www.googleapis.com/youtube/v3/videos?part=snippet&id={req.video_id}"
    resp = requests.get(yt_api, headers=headers)

    if resp.status_code != 200:
        logging.error(f"❌ YouTube API 인증 실패: {resp.text}")
        raise HTTPException(status_code=401, detail="YouTube API 인증 실패")

    data = resp.json()
    items = data.get("items", [])
    if not items:
        raise HTTPException(status_code=404, detail="영상이 존재하지 않거나 권한이 없습니다.")

    title = items[0]["snippet"]["title"]
    logging.info(f"🎥 영상 제목: {title}")

    # 2. yt-dlp 명령어 준비
    video_url = f"https://www.youtube.com/watch?v={req.video_id}"
    filename = f"audio-{uuid.uuid4()}.wav"
    local_path = os.path.join(TMP_DIR, filename)

    command = [
        "yt-dlp",
        "-x",
        "--audio-format", "wav",
        "--postprocessor-args", "ffmpeg:-ac 1 -ar 44100 -sample_fmt s16",
        "-o", local_path,
        video_url
    ]

    try:
        logging.info(f"▶️ yt-dlp 실행: {' '.join(command)}")
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        logging.info(f"✅ yt-dlp 출력: {result.stdout}")
    except subprocess.CalledProcessError as e:
        logging.error(f"❌ yt-dlp 실패: {e.stderr}")
        raise HTTPException(status_code=500, detail=f"다운로드 실패: {e.stderr.strip()}")

    if not os.path.exists(local_path):
        raise HTTPException(status_code=500, detail="오디오 파일이 생성되지 않았습니다.")

    # 3. GCS 업로드
    try:
        bucket = storage_client.bucket(req.bucket)
        blob = bucket.blob(req.destination)
        blob.upload_from_filename(local_path)
        logging.info(f"🚀 GCS 업로드 완료: gs://{req.bucket}/{req.destination}")
    except Exception as e:
        logging.error(f"❌ GCS 업로드 실패: {str(e)}")
        raise HTTPException(status_code=500, detail=f"GCS 업로드 실패: {str(e)}")
    finally:
        if os.path.exists(local_path):
            os.remove(local_path)
            logging.info(f"🧹 임시 파일 삭제 완료: {local_path}")

    return {
        "message": "성공",
        "title": title,
        "gcs_path": f"gs://{req.bucket}/{req.destination}"
    }
