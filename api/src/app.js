const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const requestLogger = require('./middlewares/logger.middleware');
require('./validations/error-map'); // Necessary for validation codes to run
require('./workers/sla.worker'); // Starts the SLA breach monitor while the API process is running
require('./workers/custom_sla.worker'); // Starts the standalone SLA breach monitor while the API process is running
require('./workers/badge_expiration.worker'); // Starts the badge expiration alert monitor (30/7/1 day + expired)
require('./workers/goal_reminder.worker'); // Starts the goal deadline reminder monitor
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

app.set('trust proxy', 1);

// Middleware
const allowedOrigins = [process.env.APP_URL, process.env.WEB_APP_URL].filter(Boolean);
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(helmet());
// Explicit body-size cap (file bytes go straight to Supabase, never through the
// API body, so request payloads are small text). Guards against large-body DoS.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
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
