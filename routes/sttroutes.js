const express = require('express');
const path = require("path");
const {v1: uuidv1} = require("uuid");
const multer = require("multer");
const {stt} = require("../controller/stt");
const {bucketUpload} = require("../controller/bucketUpload");
const {convertWav} = require("../controller/convertWav");
const {korScriptGrouping, engScriptGrouping} = require("../controller/scriptGrouping");
const watchStorageChanges = require("../controller/storageWatcher");
const {downloadYoutubeVideo} = require('../controller/youtubeDownload');
const error = require("multer/lib/multer-error");

const router = express.Router();
const bucketname = 'ondam_storage';
const videobucket = 'ondamvideo';

//영상 처리용 임시 페이지
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'stt.html'));
});


// 한국어 영상 처리
const upload = multer({storage: multer.memoryStorage()});// 메모리 저장
router.post('/korvideoconvert', upload.single('video'), async (req, res) => {
    const UUID = uuidv1();//각 변환에 부여되는 Id
    const ext = path.extname(req.file.originalname);//영상 확장자
    const videoPath = `test/${UUID}/originalVideo${ext}`; //영상 저장 위치
    const audioPath = `test/${UUID}/audio.wav`; // 음성파일 저장 위치
    const scriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`; //타임스탬프 저장 위치

    console.log(`${UUID}:처리 시작`)
    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }

    try {
        // 영상 업로드
        await bucketUpload(bucketname, videoPath, req.file.buffer);
        console.log(`${UUID}:업로드 성공`)

        //wav 음성파일 생성
        await convertWav(bucketname, videoPath, audioPath);
        console.log(`${UUID}:wav 변환 성공`)

        //STT
        let transcription = await stt(bucketname, audioPath, scriptPath, 'ko-KR');
        console.log(`${UUID}: stt 성공`)

        //timestamp
        let timestampJson = JSON.stringify(korScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
        console.log(`${UUID}: 타임스탬프 생성 성공`)
    } catch (err) {
        return res.status(500).json({success: false, error: error.message});
    }
});

//영어 영상 처리
router.post('/engvideoconvert', upload.single('video'), async (req, res) => {
    const UUID = uuidv1();//각 변환에 부여되는 Id
    const ext = path.extname(req.file.originalname);//영상 확장자
    const videoPath = `test/${UUID}/originalVideo${ext}`; //영상 저장 위치
    const audioPath = `test/${UUID}/audio.wav`; // 음성파일 저장 위치
    const ScriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`;

    //영상 업로드
    console.log('처리시작');
    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }
    try {
        // 영상 업로드
        await bucketUpload(bucketname, videoPath, req.file.buffer);
        console.log(`${UUID}:업로드 성공`)

        //wav 음성파일 생성
        await convertWav(bucketname, videoPath, audioPath);
        console.log(`${UUID}:wav 변환 성공`)

        //stt
        let transcription = await stt(bucketname, audioPath, ScriptPath, 'en-US');
        console.log(`${UUID}:stt 성공`)

        //timestamp
        let timestampJson = JSON.stringify(engScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
        console.log(`${UUID}:타임스탬프 생성 성공`)
    } catch (err) {
        return res.status(500).json({success: false, error: err});
    }
});

//한국어 유튜브 영상 처리
router.post('/koryoutubeconvert', async (req, res) => {
    const UUID = uuidv1();
    const audioPath = `test/${UUID}/audio.wav`;
    const scriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`;

    console.log(`${UUID}:처리 시작`)

    const {url} = req.body || {};
    if (!url) {
        return res.status(400).json({message: "YouTube URL이 필요합니다."});
    }


    try {
        //youtube영상 wav저장
        downloadYoutubeVideo(url, bucketname, audioPath);
        await watchStorageChanges(bucketname, audioPath);
        console.log(`${UUID}:유튜브 영상 업로드 성공`)

        //stt
        let transcription = await stt(bucketname, audioPath, scriptPath, 'ko-KR');
        console.log(`${UUID}:stt 성공`)

        //timestamp
        let timestampJson = JSON.stringify(korScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
        console.log(`${UUID}:타임스탬프 생성 성공`)
    } catch (err) {
        return res.status(500).json({success: false, error: err});
    }

});

//영어 유튜브 영상 처리
router.post('/engyoutubeconvert', async (req, res) => {
    const UUID = uuidv1();//각 변환에 부여되는 Id
    const audioPath = `test/${UUID}/audio.wav`; // 음성파일 저장 위치
    const ScriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`;

    console.log(`${UUID}:처리 시작`)

    const {url} = req.body || {};
    if (!url) {
        return res.status(400).json({message: "YouTube URL이 필요합니다."});
    }
    try {
        //youtube영상 wav 저장
        downloadYoutubeVideo(url, bucketname, audioPath);
        await watchStorageChanges(bucketname, audioPath);
        console.log(`${UUID}:유튜브 업로드 성공`)

        //stt
        let transcription = await stt(bucketname, audioPath, ScriptPath, 'en-US');
        console.log(`${UUID}:stt 성공`)

        //timestamplet
        timestampJson = JSON.stringify(engScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
        console.log(`${UUID}:타임스탬프 생성 성공`)
    } catch (err) {
        return res.status(500).json({success: false, error: err});
    }
});

module.exports = router;