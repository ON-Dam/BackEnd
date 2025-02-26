const express = require('express');
const path = require("path");
const {v1: uuidv1} = require("uuid");
const multer = require("multer");

const {stt} = require("../controller/stt");
const {bucketUpload} = require("../controller/bucketUpload");
const {convertWav} = require("../controller/convertWav");


const router = express.Router();
const bucketname = 'ondam_storage';


//영상 처리용 임시 페이지
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'stt.html'));
});


// 버킷 파일 업로드
const upload = multer({storage: multer.memoryStorage()});// 메모리 저장
router.post('/videoconvert', upload.single('video'), async (req, res) => {
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

    //STT
    try {
        const transcription = await stt(bucketname, audioPath, ScriptPath);
        console.log('변환 성공')
    } catch (error) {
        res.status(500).json({success: false, error: error.message});
    }
    
    console.log('stt완료');

});


module.exports = router;