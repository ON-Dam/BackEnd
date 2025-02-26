const {Storage} = require('@google-cloud/storage');
require('dotenv').config();


async function uploadText(bucketName, text) {
    const storage = new Storage();
    try {
        const dt = new Date()
        const fileName = `translations_test/script_${dt.toISOString().replace(/[:.]/g, '_')}.txt`;
        
        console.log(`업로딩중 : ${fileName}`);

        await storage.bucket(bucketName).file(`${fileName}`).save(text, {
            metadata: {contentType: 'text/plain'},
        })
        console.log(`✅ Upload Success: ${bucketName}/${fileName}`);
    }
    catch (err){
        console.error('Upload Error: ', err) 
    }

}

exports.uploadText = uploadText;