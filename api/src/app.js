const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const requestLogger = require('./middlewares/logger.middleware');
require('./validations/error-map'); // Necessary for validation codes to run
// Initialize firebase only when not explicitly skipped (useful for local dev without installing firebase-admin)
if (!process.env.SKIP_FIREBASE || process.env.SKIP_FIREBASE === '0') {
    try {
        require('./config/firebase'); // Necessary for firebase to initialize
    } catch (err) {
        // If firebase isn't available and SKIP_FIREBASE not set, log and continue.
        // This avoids crashing dev servers where firebase-admin is not installed.
        // eslint-disable-next-line no-console
        console.warn('Firebase initialization skipped or failed:', err && err.message);
    }
}


// Load public routes (safe for no-DB dev server)
const publicRoutes = require('./routes/public.routes');
// Load API routes only when SKIP_API_ROUTES is not set to '1'
let apiRoutes;
if (process.env.SKIP_API_ROUTES !== '1') {
    apiRoutes = require('./routes/apiRoutes');
}

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
// Public pages (HTML)
app.use('/public', publicRoutes);

if (apiRoutes) {
    app.use('/api', apiRoutes);
}

// Dev-only: serve generated files when Supabase/storage is not available
const path = require('path');
app.use('/_dev_storage', express.static(path.join(__dirname, '../logs/dev_storage')));

module.exports = {
    app,
    PORT
}
