const axios = require('axios');
const cloudRunUrl = " https://youtube-wav-service-337863912489.asia-northeast3.run.app";

async function downloadYoutubeVideo(youtubeUrl, bucketName, destinationPath) {
    try {
        const response = await axios.post(
            `${cloudRunUrl}/download`,
            {
                youtube_url: youtubeUrl,
                bucket_name: bucketName,
                gcs_path: destinationPath
            },
            {
                headers: {
                    "Content-Type": "application/json"
                }
            });

        console.log('✅ 다운로드 요청 성공:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ 다운로드 요청 실패:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {downloadYoutubeVideo};
