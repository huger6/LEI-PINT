const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const requestLogger = require('./middlewares/logger');


const apiRoutes = require('./routes/apiRoutes');

// App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes)

module.exports = {
    app,
    PORT
}