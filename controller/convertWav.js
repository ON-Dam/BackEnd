const axios = require("axios");

async function convertWav(bucketName, videoFilename, audioFilename) {
    //영상 변환 서버 url
    const fastApiUrl = "https://convertowav-service-337863912489.asia-northeast3.run.app/convert_videos";

    try {
        console.log("FastAPI 서버 호출 요청:", {
            bucket_name: bucketName,
            video_filename: videoFilename,
            wav_filename: audioFilename
        });

        const response = await axios.post(fastApiUrl, {
            bucket_name: bucketName,
            video_filename: videoFilename,
            wav_filename: audioFilename
        });

        console.log("FastAPI 서버 응답:", response.data);
        return "success";
    } catch (error) {
        console.error("FastAPI 서버 호출 중 오류 발생:", error);
        return `error: ${error.message}`;
    }
}

exports.convertWav = convertWav;