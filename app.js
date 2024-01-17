const express = require('express');
const routes = require('./functions/routes');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
