const { Storage } = require('@google-cloud/storage');
const { TranslationServiceClient } = require('@google-cloud/translate');
const functions = require('@google-cloud/functions-framework');
require('dotenv').config();

// 클라이언트 초기화
const storage = new Storage();
const translationClient = new TranslationServiceClient();

// CloudEvent 함수 정의
functions.cloudEvent('requestHandler', async (cloudevent) => {
  const bucketName = cloudevent.data.bucket;
  const fileName = cloudevent.data.name;

  console.log(`파일 ${fileName}이(가) 버킷 ${bucketName}에 업로드되었습니다.`);

  const bucket = storage.bucket(bucketName);
  const file = bucket.file(fileName);

  try {
    const [contents] = await file.download();
    const text = contents.toString('utf8');

    const request = {
      parent: `projects/${process.env.PROJECT_ID}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      sourceLanguageCode: 'en',
      targetLanguageCode: 'ko',
    };
    const [response] = await translationClient.translateText(request);
    let translatedText = '';
    for (const translation of response.translations) {
      translatedText += `${translation.translatedText}\n`;
    }

    const dt = new Date();
    const targetBucketName = 'ondam_storage';
    const targetBucket = storage.bucket(targetBucketName);
    const outputFileName = `translations_test/script_${dt.toISOString().replace(/[:.]/g, '_')}.txt`;
    const outputFile = targetBucket.file(outputFileName);

    await outputFile.save(translatedText, {
      metadata: { contentType: 'text/plain; charset=utf-8' },
    });

    console.log(`✅ 번역된 파일이 ${targetBucketName}/${outputFileName}에 저장되었습니다.`);
  } catch (err) {
    console.error('오류 발생:', err);
  }
});
