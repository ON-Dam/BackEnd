import os
import tempfile
import subprocess
import traceback
from fastapi import FastAPI
from pydantic import BaseModel
from google.cloud import storage

app = FastAPI()

class DownloadRequest(BaseModel):
    youtube_url: str
    bucket_name: str
    gcs_path: str  # GCS에 저장할 blob 경로

@app.post("/download")
async def download_youtube_to_gcs(data: DownloadRequest):
    youtube_url = data.youtube_url.strip()
    bucket_name = data.bucket_name
    gcs_path = data.gcs_path

    try:
        print(f"🎯 YouTube URL: {youtube_url}")
    except Exception as e:
        print("❌ URL validation failed")
        return {"error": f"URL validation failed - {str(e)}"}

    try:
        print("Step 1: Download video using yt-dlp")
        temp_dir = tempfile.gettempdir()
        yt_dlp_path = os.path.join(os.path.dirname(__file__), 'yt-dlp')
        if not os.path.isfile(yt_dlp_path):
            return {"error": "yt-dlp binary not found"}

        output_path_template = os.path.join(temp_dir, "downloaded_video.%(ext)s")

        result = subprocess.run([
            yt_dlp_path,
            '--no-check-certificate',
            '--force-ipv4',
            '--quiet',
            '-f', 'bestaudio',
            '-o', output_path_template,
            youtube_url
        ], capture_output=True, text=True)

        print("yt-dlp stdout:")
        print(result.stdout)
        print("yt-dlp stderr:")
        print(result.stderr)

        if result.returncode != 0:
            return {"error": f"yt-dlp failed: {result.stderr}"}

        downloaded_files = [f for f in os.listdir(temp_dir) if f.startswith("downloaded_video")]
        if not downloaded_files:
            return {"error": "Download failed, file not found"}

        input_file_path = os.path.join(temp_dir, downloaded_files[0])
        print(f"✅ Downloaded file: {input_file_path}")

    except Exception as e:
        print("❌ Download error")
        print(traceback.format_exc())
        return {"error": f"Download failed - {str(e)}"}

    try:
        print("Step 2: Convert to LINEAR16 WAV with ffmpeg")
        wav_path = os.path.join(temp_dir, "converted_audio.wav")

        ffmpeg_result = subprocess.run([
            "ffmpeg",
            "-y",
            "-i", input_file_path,
            "-ac", "1",
            "-ar", "44100",
            "-f", "wav",
            wav_path
        ], capture_output=True, text=True)

        print("ffmpeg stdout:")
        print(ffmpeg_result.stdout)
        print("ffmpeg stderr:")
        print(ffmpeg_result.stderr)

        if ffmpeg_result.returncode != 0 or not os.path.isfile(wav_path):
            return {"error": "ffmpeg conversion failed"}

        print(f"✅ Converted WAV: {wav_path}")

    except Exception as e:
        print("❌ WAV 변환 실패")
        print(traceback.format_exc())
        return {"error": f"ffmpeg failed - {str(e)}"}

    try:
        print(f"Step 3: Upload to GCS: {bucket_name}/{gcs_path}")
        client = storage.Client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(gcs_path)
        blob.upload_from_filename(wav_path)
        print("✅ Upload successful")

    except Exception as e:
        print("❌ GCS upload error")
        print(traceback.format_exc())
        return {"error": f"GCS upload failed - {str(e)}"}

    try:
        os.remove(input_file_path)
        os.remove(wav_path)
        print("🧹 Temporary files deleted")
    except Exception as e:
        print("⚠️ Cleanup error")
        print(traceback.format_exc())

    return {
        "message": f"Uploaded to gs://{bucket_name}/{gcs_path}"
    }
