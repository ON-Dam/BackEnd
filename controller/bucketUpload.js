const {Storage} = require('@google-cloud/storage');

async function bucketUpload(bucketName, filePath, file) {
    const storage = new Storage();
    try {
        await storage.bucket(bucketName).file(`${filePath}`).save(file);
    } catch (error) {
        console.log(error);
    }
}

exports.bucketUpload = bucketUpload;
