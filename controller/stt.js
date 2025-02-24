const {SpeechClient} = require('@google-cloud/speech');
const {bucketUpload} = require("./bucketUpload");

async function stt(bucketName, audioFilePath, outputFilePath) {
    try {
        const speechClient = new SpeechClient();
        const audioUri = `gs://${bucketName}/${audioFilePath}`;//오디오 위치(gs 버킷)

        //stt 옵션
        const audio = {uri: audioUri};
        const config = {
            encoding: 'LINEAR16',  // 인코딩
            sampleRateHertz: 16000,  // 샘플링 레이트
            languageCode: 'ko-KR',
            enableWordTimeOffsets: true,  // 단어별 타임스탬프
            enableAutomaticPunctuation: true,  // 문장 부호
            useEnhanced: true,  // 향상된 모델
            model: 'latest_long',  // 긴 문장에 최적화된 모델
        };

        console.log(`Transcribing file`);

        // stt 실행
        const [operation] = await speechClient.longRunningRecognize({config, audio});
        const [response] = await operation.promise();

        //stt 결과 에러 체크
        if (!response || !response.results || response.results.length === 0) {
            throw new Error('No transcription results found');
        }


        // 결과값 -> json 변환
        const transcriptionData = response.results.map((result) => ({
            text: result.alternatives[0].transcript,
            words: result.alternatives[0].words.map((wordInfo) => ({
                word: wordInfo.word,
                startTime: parseFloat(wordInfo.startTime.seconds) + wordInfo.startTime.nanos * 1e-9,
                endTime: parseFloat(wordInfo.endTime.seconds) + wordInfo.endTime.nanos * 1e-9,
            })),
        }));


        // 🎯 JSON 데이터를 GCS에 저장
        await bucketUpload(bucketName, outputFilePath, JSON.stringify(transcriptionData, null, 2));
        console.log(`✅ JSON file saved to: gs://${bucketName}/${outputFilePath}`);

        return transcriptionData;
    } catch (error) {
        console.error('❌ Error in transcribeAndSave:', error);
        throw error;
    }
}

exports.stt = stt;