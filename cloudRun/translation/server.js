const express = require('express');
const axios = require('axios');
const { Storage } = require('@google-cloud/storage');
const { TranslationServiceClient } = require('@google-cloud/translate');
require('dotenv').config();

const app = express();
app.use(express.json());

// 환경 변수
const PROJECT_ID = process.env.PROJECT_ID;
const TARGET_BUCKET = process.env.TARGET_BUCKET;  // 번역 결과를 저장할 버킷
const NOTIFY_API_URL = process.env.NOTIFY_API_URL;  // 번역 완료 후 알림을 보낼 API URL

// Cloud Storage와 Translation API 클라이언트 초기화
const storage = new Storage();
const translationClient = new TranslationServiceClient();

// 요청받은 파일만 처리하는 함수
async function processFile(bucketName, fileName) {
  try {
    // 요청받은 파일만 다운로드
    const file = storage.bucket(bucketName).file(fileName);
    const [contents] = await file.download();
    const text = contents.toString('utf8');
    console.log(`파일 [${fileName}] 다운로드 완료.`);

    // 번역 API 요청 구성 (영어 -> 한국어)
    const request = {
      parent: `projects/${PROJECT_ID}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ko',
    };

    // 번역 실행
    const [response] = await translationClient.translateText(request);
    const translatedText = response.translations
      .map(translation => translation.translatedText)
      .join('\n');
    console.log(`파일 [${fileName}] 번역 완료.`);

    // 번역 결과를 대상 버킷에 저장 (파일 이름은 동일하게 사용)
    const targetFile = storage.bucket(TARGET_BUCKET).file(fileName);
    await targetFile.save(translatedText, {
      metadata: { contentType: 'text/plain; charset=utf-8' },
    });
    console.log(`번역된 파일 저장 완료: ${TARGET_BUCKET}/${fileName}`);

    return { fileName, status: 'success' };
  } catch (error) {
    console.error(`파일 처리 중 오류 (${fileName}):`, error);
    return { fileName, status: 'error', error: error.message };
  }
}

async function requestOthAPI(fileName){
  // 번역 완료 후 다른 API에 알림 전송 (POST 요청)
    try {
      const notifyResponse = await axios.post(NOTIFY_API_URL, {
        fileName,
        targetBucket: TARGET_BUCKET,
        status: 'completed'
      });
      console.log('알림 전송 완료:', notifyResponse.data);
    } catch (notifyError) {
      console.error('알림 전송 오류:', notifyError.message);
      // 알림 전송 실패 시 로그만 남기고 계속 진행할 수도 있습니다.
    }
}

// POST /translate 엔드포인트: 클라이언트가 파일의 버킷 이름과 파일 이름을 전달합니다.
app.post('/translate', async (req, res) => {
  try {
    const { bucketName, fileName } = req.body;
    if (!bucketName || !fileName) {
      return res.status(400).send('bucketName과 fileName이 필요합니다.');
    }
    console.log(`요청받음 - 버킷: ${bucketName}, 파일: ${fileName}`);

    // 지정된 파일만 처리
    const result = await processFile(bucketName, fileName);
    if (result.status !== 'success') {
      return res.status(500).json(result);
    }

    //다른 API로 요청 보내기
    // requestOthAPI(fileName);

    return res.status(200).json({ message: '번역 및 알림 전송 완료', fileName });
  } catch (error) {
    console.error('엔드포인트 처리 중 오류:', error);
    return res.status(500).send('서버 오류');
  }
});

// Cloud Run은 기본적으로 PORT 환경변수(기본 8080)를 사용합니다.
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});
