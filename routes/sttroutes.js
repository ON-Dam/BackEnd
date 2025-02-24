const express = require('express');
const path = require("path");
const {v1: uuidv1} = require("uuid");
const multer = require("multer");

const {stt} = require("../controller/stt");
const {bucketUpload} = require("../controller/bucketUpload");
const {convertWav} = require("../controller/convertWav");


const router = express.Router();
const bucketname = 'ondam_storage';

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'stt.html'));
});
// 버킷 파일 업로드
const upload = multer({storage: multer.memoryStorage()});// Multer 설정 (메모리 저장)
router.post('/videoconvert', upload.single('video'), async (req, res) => {
    //영상 업로드
    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }
    const UUID = uuidv1();//임시 변환 아이디
    const ext = path.extname(req.file.originalname);//확장자
    const videoPath = `test/${UUID}/originalVideo${ext}`;
    const audioPath = `test/${UUID}/audio.wav`;
    const ScriptPath = `test/${UUID}/script.json`;
    try {
        await bucketUpload(bucketname, videoPath, req.file.buffer);
        console.log('업로드 성공')
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "업로드 실패", error: error.message});
    }

    //convert wav
    await convertWav(bucketname, videoPath, audioPath);

    //STT
    try {
        const transcription = await stt(bucketname, audioPath, ScriptPath);

    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }

});

router.get('/stttest', async (req, res) => {
    try {
        const transcription = await stt('ondam_storage', 'test/output.wav', 'test/trans.json');
        res.json({success: true, message: 'Transcription completed', transcription});
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
});


module.exports = router;