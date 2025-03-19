# BackEnd

## 1.프로젝트 설명

## 2. API 엔드포인트

### 2.1. STT 페이지 제공

#### STT 테스트 페이지 렌더링

**GET stt/**

- 설명: STT 테스트용 HTML 페이지(stt.html) 제공
- 응답: HTML 파일 반환

### 2.2. 영상 업로드 및 변환

#### 영상 업로드 및 STT 변환

**POST stt / videoconvert**

- 설명: 업로드된 영상을 Google Cloud Storage에 저장하고, 음성을 추출한 후 STT 변환 수행
- 요청 (Form-Data):
    - `video`: 업로드할 영상 파일
- 처리 과정:
    1. UUID를 생성하여 변환에 고유 ID 부여
    2. 영상을 `test/{UUID}/originalVideo.{ext}` 경로에 저장
    3. 음성 파일을 `test/{UUID}/audio.wav`로 변환하여 저장
    4. STT를 수행하여 결과를 `test/{UUID}/script.json`에 저장
- 응답:
    - 200 OK: 변환 성공
    - 400 Bad Request: 파일이 업로드되지 않음
    - 500 Internal Server Error: 업로드, 변환, STT 수행 중 오류 발생

---

## 3. 파일 저장 구조

- 업로드된 영상: `ondam_storage/test/{UUID}/originalVideo.{확장자}`
- 변환된 오디오 파일: `ondam_storage/test/{UUID}/audio.wav`
- STT 결과 스크립트: `ondam_storage/test/{UUID}/script.json`

---

## 4. 에러 처리

| 오류 코드 | 설명                      |
|-------|-------------------------|
| 400   | 잘못된 요청 (파일이 없음)         |
| 500   | 업로드, 변환, STT 수행 중 오류 발생 |

## 5. 주요 모듈 설명

- **controller / bucketUpload**: Google Cloud Storage로 파일 업로드 수행
- **controller / convertWav**: 업로드된 영상에서 오디오 파일 추출
- **controller / stt**: Google Cloud Speech-to-Text API를 이용하여 STT 변환 수행

---
