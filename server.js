require('dotenv').config();

const {translateTextFromFile}=require('./file_test');
const {uploadText}=require('./script_upload');
const express = require('express');
const path = require('path');
const {stt} = require("./controller/stt");
const {v1: uuidv1} = require('uuid');


const app = express();
const PORT = 8080;
app.set('view engine', 'ejs');

app.get('/upload', async (req, res) => {
    //res.render('index');
    const textContent = `The Little Prince - Summary

                The story begins with a pilot who crashes his plane in the Sahara Desert. While trying to repair it, he meets a mysterious little boy—the Little Prince—who comes from a tiny asteroid called B-612. The Prince shares his journey across different planets, where he meets various unusual adults, each representing human flaws such as greed, vanity, and power.

                On his home planet, the Prince cares for a unique rose, but he leaves to explore the universe and understand life better. Along the way, he learns important lessons, especially from a wise fox, who teaches him that "what is essential is invisible to the eye."

                Eventually, the Prince decides to return to his beloved rose, believing that true love and responsibility connect them forever. He mysteriously disappears, leaving the pilot to reflect on the deep wisdom of their encounter.

                The story is a timeless allegory about love, innocence, and the importance of seeing the world with a child's heart.
                `;
    await uploadText('ondam_storage', textContent);
    res.send('업로드 완');
});
// app.post('/upload', upload.single('uploadedFile'), async (req, res) => {
//     if (!req.file) {
//         return res.status(400).send('파일이 업로드되지 않았습니다.');
//     }
//     const filePath = req.file.path;

//     console.log(filePath);

//     const outputFilePath = `./uploads/translated_${req.file.filename}`;
//     await translateTextFromFile(filePath, outputFilePath);

//     res.send(`
//             <h2>번역 완료!</h2>
//             <p><a href="/download/${path.basename(outputFilePath)}">📥 번역된 파일 다운로드</a></p>
//         `);
// });
// app.get(`/download/:filename`, (req, res)=>{
// const filePath = path.join(__dirname, 'uploads', req.params.filename);
    
//     if (!fs.existsSync(filePath)) {
//         return res.status(404).send('파일을 찾을 수 없습니다.');
//     }

//     res.download(filePath, err => {
//         if (err) {
//             console.error('파일 다운로드 오류:', err);
//             res.status(500).send('파일을 다운로드할 수 없습니다.');
//         }
//     });

// })

const sttRoutes = require("./routes/sttroutes");
app.use('/stt', sttRoutes);

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});