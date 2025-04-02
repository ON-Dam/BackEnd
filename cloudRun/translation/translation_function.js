const express = require('express');
const app = express();
app.use(express.json()); // JSON 본문 파싱

const { Storage } = require('@google-cloud/storage');
const { TranslationServiceClient } = require('@google-cloud/translate');
require('dotenv').config();

// 클라이언트 초기화
const storage = new Storage();
const translationClient = new TranslationServiceClient();

app.post('/', async (req, res) => {
  // CloudEvent 형식의 데이터가 POST 본문에 있다고 가정
  const cloudevent = req.body;
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

    const targetBucketName = 'ondam_storage';
    const targetBucket = storage.bucket(targetBucketName);
    const outputFileName = `${fileName}`;
    const outputFile = targetBucket.file(outputFileName);

    await outputFile.save(translatedText, {
      metadata: { contentType: 'text/plain; charset=utf-8' },
    });

    console.log(`✅ 번역된 파일이 ${targetBucketName}/${outputFileName}에 저장되었습니다.`);
    res.status(200).send('Success');
  } catch (err) {
    console.error('오류 발생:', err);
    res.status(500).send('Error');
  }
});

// Cloud Run은 기본적으로 PORT 환경변수를 통해 포트를 전달합니다.
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
