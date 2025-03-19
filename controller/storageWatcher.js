const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

/**
 * 특정 파일이 Cloud Storage에 업로드될 때까지 감지하는 함수
 */
async function watchStorageChanges(bucketName, targetPath, maxWaitTime = 300000, checkInterval = 5000) {
    console.log(`📌 Cloud Storage 감지 시작: ${bucketName}/${targetPath}`);

    const startTime = Date.now();

    return new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
            const elapsedTime = Date.now() - startTime;

            // 최대 대기 시간 초과 시 종료
            if (elapsedTime >= maxWaitTime) {
                clearInterval(interval);
                console.error(`❌ 파일 업로드 대기 시간 초과: ${targetPath}`);
                reject(new Error(`파일 업로드 대기 시간 초과: ${targetPath}`));
                return;
            }

            try {
                const [exists] = await storage.bucket(bucketName).file(targetPath).exists();
                if (exists) {
                    clearInterval(interval);
                    console.log(`✅ 파일 업로드 감지 완료: ${targetPath}`);
                    resolve();
                }
            } catch (error) {
                clearInterval(interval);
                console.error(`❌ 파일 확인 중 오류 발생:`, error);
                reject(error);
            }
        }, checkInterval);
    });
}

// 🚀 **올바르게 함수 내보내기**
module.exports = watchStorageChanges;
