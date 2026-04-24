const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const requestLogger = require('./middlewares/logger.middleware');


const apiRoutes = require('./routes/apiRoutes');

// App
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.APP_URL,
    credentials: true
}));;
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(requestLogger);

// Routes
app.use('/api', apiRoutes)

module.exports = {
    app,
    PORT
}