const express = require('express');
const path = require("path");
const {v1: uuidv1} = require("uuid");
const multer = require("multer");

const {stt} = require("../controller/stt");
const {bucketUpload} = require("../controller/bucketUpload");
const {convertWav} = require("../controller/convertWav");
const {korScriptGrouping, engScriptGrouping} = require("../controller/scriptGrouping");
const watchStorageChanges = require("../controller/storageWatcher");


const router = express.Router();
const bucketname = 'ondam_storage';
const videobucket = 'ondamvideo';

//영상 처리용 임시 페이지
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'stt.html'));
});


// 버킷 파일 업로드
const upload = multer({storage: multer.memoryStorage()});// 메모리 저장
router.post('/korvideoconvert', upload.single('video'), async (req, res) => {
    //영상 업로드
    console.log('처리시작');
    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }
    const UUID = uuidv1();//각 변환에 부여되는 Id
    const ext = path.extname(req.file.originalname);//영상 확장자
    const videoPath = `test/${UUID}/originalVideo${ext}`; //영상 저장 위치
    const audioPath = `test/${UUID}/audio.wav`; // 음성파일 저장 위치
    const ScriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`;
    // 영상 업로드
    try {
        await bucketUpload(bucketname, videoPath, req.file.buffer);
        console.log('업로드 성공')
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "업로드 실패", error: error.message});
    }

    //wav 음성파일 생성
    try {
        await convertWav(bucketname, videoPath, audioPath);
        console.log('변환 성공')
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "변환 실패", error: error.message});
    }
    let transcription;
    //STT
    try {
        transcription = await stt(bucketname, audioPath, ScriptPath, 'ko-KR');
        console.log('변환 성공')
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }

    //timestamp
    try {
        let timestampJson = JSON.stringify(korScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
    console.log('stt완료');
});

router.post('/engconvert', upload.single('video'), async (req, res) => {
    //영상 업로드
    console.log('처리시작');
    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }
    const UUID = uuidv1();//각 변환에 부여되는 Id
    const ext = path.extname(req.file.originalname);//영상 확장자
    const videoPath = `test/${UUID}/originalVideo${ext}`; //영상 저장 위치
    const audioPath = `test/${UUID}/audio.wav`; // 음성파일 저장 위치
    const ScriptPath = `test/${UUID}/script.json`; // 스크립트 저장 위치
    const timestampPath = `test/${UUID}/timestamp.json`;
    // 영상 업로드
    try {
        await bucketUpload(bucketname, videoPath, req.file.buffer);
        console.log('업로드 성공')
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "업로드 실패", error: error.message});
    }

    //wav 음성파일 생성
    try {
        await convertWav(bucketname, videoPath, audioPath);
        console.log('변환 성공')
    } catch (error) {
        console.error(error);
        res.status(500).json({message: "변환 실패", error: error.message});
    }
    let transcription;
    //STT
    try {
        transcription = await stt(bucketname, audioPath, ScriptPath, 'en-US');
        console.log('변환 성공')
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }

    //timestamp
    try {
        let timestampJson = JSON.stringify(engScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
    console.log('stt완료');
});
router.post('/converttest', upload.single('video'), async (req, res) => {
    console.log('처리 시작');

    if (!req.file) {
        return res.status(400).json({message: "파일이 없습니다."});
    }

    const UUID = uuidv1();
    const ext = path.extname(req.file.originalname);
    const videoPath = `test/${UUID}/originalVideo${ext}`;
    const audioPath = `test/${UUID}/originalVideo.wav`;
    const scriptPath = `test/${UUID}/script.json`;
    const timestampPath = `test/${UUID}/timestamp.json`;

    try {
        bucketUpload(videobucket, videoPath, req.file.buffer);
        console.log(`영상 업로드 완료: ${videoPath}`);
    } catch (error) {
        console.error(`업로드 실패:`, error);
        return res.status(500).json({message: "업로드 실패", error: error.message});
    }
    try {
        await watchStorageChanges(bucketname, audioPath);//영상 wav 변환 대기
        console.log('wav 변환 완료');
    } catch (error) {
        console.error(`변환 실패:`, error);
        return res.status(500).json({message: "업로드 실패", error: error.message});

    }

    let transcription;
    try {
        // 🎤 STT 실행
        transcription = await stt(bucketname, audioPath, scriptPath, 'en-US');
        console.log('STT 변환 성공');
    } catch (error) {
        console.error(`STT 변환 실패:`, error);
        return res.status(500).json({success: false, error: error.message}); // ✅ `return` 추가하여 중복 응답 방지
    }

    try {
        // ⏱️ Timestamp JSON 저장
        let timestampJson = JSON.stringify(engScriptGrouping(transcription), null, 2);
        await bucketUpload(bucketname, timestampPath, timestampJson);
        console.log('Timestamp 저장 완료');
    } catch (error) {
        console.error(`imestamp 저장 실패:`, error);
        return res.status(500).json({success: false, error: error.message}); // ✅ `return` 추가하여 중복 응답 방지
    }

    console.log('STT 완료');
    return res.status(200).json({success: true, message: "STT 완료", uuid: UUID}); // ✅ `return` 추가하여 응답 중복 방지
});


module.exports = router;