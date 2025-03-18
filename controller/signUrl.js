const {Storage} = require('@google-cloud/storage');

async function signUrl(bucketname,filepath ){
    const storage = new Storage();
    const bucket = storage.bucket(bucketname);
    const file = bucket.file(filepath);
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 1000 * 60 * 10, // 5분간 유효
    });
    return url;
}
exports.signUrl = signUrl;