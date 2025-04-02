const express = require('express');
const app = express();

// PORT 환경변수 사용, 없으면 8080 사용
const PORT = process.env.PORT || 8080;

app.get('/',async (req, res) => {

  res.send('Hello from Cloud Run!');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
