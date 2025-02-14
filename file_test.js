require('dotenv').config();
const {TranslationServiceClient} = require('@google-cloud/translate');
const fs = require('fs');
// Instantiates a client
const translationClient = new TranslationServiceClient();

const projectId = process.env.PROJECT_ID;
const location = 'global';
const filePath = './input.txt';
const outputFilePath = './output.txt';

async function translateTextFromFile(textFile, outputFilePath) {

    const text = fs.readFileSync(textFile, 'utf8').trim();
    console.log(`읽은 내용: ${text}`)

    // Construct request
    const request = {
        parent: `projects/${projectId}/locations/${location}`,
        contents: [text],
        mimeType: 'text/plain', // mime types: text/plain, text/html
        sourceLanguageCode: 'en',
        targetLanguageCode: 'ko',
    };

    // Run request
    const [response] = await translationClient.translateText(request);

    let translatedText = '';
        for (const translation of response.translations) {
            translatedText += `${translation.translatedText}\n`;
        }

        console.log(`📝 번역 결과: ${translatedText}`);

        // 번역 결과를 output.txt 파일에 저장
        fs.writeFileSync(outputFilePath, translatedText, 'utf8');
}

module.exports = {translateTextFromFile};