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
app.use(express.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
    res.render('index');
    
});

const sttRoutes = require("./routes/sttroutes");
app.use('/stt', sttRoutes);

app.listen(PORT, () => {
    console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
});