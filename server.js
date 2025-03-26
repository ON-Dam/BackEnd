require('dotenv').config();

const {translateTextFromFile}=require('./file_test');
const express = require('express');
const path = require('path');
const {stt} = require("./controller/stt");
const {v1: uuidv1} = require('uuid');


const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');


app.use(express.json());
app.use(express.urlencoded({extended: true}));


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = './uploads/';
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir); // 업로드 폴더가 없으면 생성
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // 파일명 변경
    }
});
const upload = multer({storage});

app.get('/', (req, res) => {
    res.render('index');
});
app.post('/upload', upload.single('uploadedFile'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('파일이 업로드되지 않았습니다.');
    }
    const filePath = req.file.path;

    console.log(filePath);

    const outputFilePath = `./uploads/translated_${req.file.filename}`;
    await translateTextFromFile(filePath, outputFilePath);

    res.send(`
            <h2>번역 완료!</h2>
            <p><a href="/download/${path.basename(outputFilePath)}">📥 번역된 파일 다운로드</a></p>
        `);

});

app.get('/', async (req, res) => {
    res.render('index');
    
});

const sttRoutes = require("./routes/sttroutes");
app.use('/stt', sttRoutes);

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});