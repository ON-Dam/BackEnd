const {Storage} = require('@google-cloud/storage');
const {exec} = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');

const storage = new Storage();
const OUTPUT_BUCKET = 'ondam_storage';

exports.processVideo = async (cloudevent) => {
    console.log('📌 Received CloudEvent:', JSON.stringify(cloudevent, null, 2));

    // ✅ CloudEvent 2nd Gen에서는 cloudevent에서 직접 bucket과 name을 가져와야 함
    const bucketName = cloudevent.bucket || cloudevent.data?.bucket;
    const fileName = cloudevent.name || cloudevent.data?.name;

    if (!bucketName || !fileName) {
        console.error('❌ 이벤트 데이터가 올바르지 않습니다. bucket 또는 name 속성이 없습니다.');
        return;
    }

    console.log(`📂 업로드된 파일 감지: ${fileName} in ${bucketName}`);

    if (!/\.(mp4|mov|avi|mkv)$/i.test(fileName)) {
        console.log(`❌ 지원되지 않는 파일 형식: ${fileName}`);
        return;
    }

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    const tempFilePath = path.join(os.tmpdir(), path.basename(fileName)); // 임시 저장 경로
    const outputFileName = `${path.parse(fileName).name}.wav`; // 변환된 파일명
    const tempOutputPath = path.join(os.tmpdir(), outputFileName); // 변환된 WAV 파일 임시 저장 경로

    try {
        // 📥 파일 다운로드
        await file.download({destination: tempFilePath});
        console.log(`✅ 파일 다운로드 완료: ${tempFilePath}`);

        // 🎵 FFmpeg를 사용하여 WAV 변환
        await convertVideoToWav(tempFilePath, tempOutputPath);
        console.log(`✅ 변환 완료: ${tempOutputPath}`);

        // 📤 변환된 파일을 Cloud Storage에 원본 경로를 유지한 채 업로드
        const outputBucket = storage.bucket(OUTPUT_BUCKET);
        const outputFilePath = `${path.dirname(fileName)}/${outputFileName}`.replace(/^\/+/, ''); // 원본 디렉토리 유지
        await outputBucket.upload(tempOutputPath, {
            destination: outputFilePath,
            metadata: {contentType: 'audio/wav'},
        });

        console.log(`🚀 변환된 파일 업로드 완료: gs://${OUTPUT_BUCKET}/${outputFilePath}`);

    } catch (error) {
        console.error('❌ 오류 발생:', error);
    } finally {
        if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            console.log(`🗑️ ${tempFilePath} 삭제 완료`);
        }
        if (fs.existsSync(tempOutputPath)) {
            fs.unlinkSync(tempOutputPath);
            console.log(`🗑️ ${tempOutputPath} 삭제 완료`);
        }
    }
};

async function convertVideoToWav(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        const command = `ffmpeg -i ${inputPath} -ac 1 -ar 44100 -vn ${outputPath}`;
        console.log(`▶️ FFmpeg 실행: ${command}`);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error('❌ FFmpeg 변환 오류:', stderr);
                return reject(error);
            }
            console.log(`📜 FFmpeg 출력:\n${stdout}`);
            resolve();
        });
    });
}
