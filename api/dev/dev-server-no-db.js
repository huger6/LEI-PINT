const http = require('http');
require('../src/config/loadEnv')();

// Skip firebase and heavy API routes so this dev server can run without full deps
process.env.SKIP_FIREBASE = process.env.SKIP_FIREBASE || '1';
process.env.SKIP_API_ROUTES = process.env.SKIP_API_ROUTES || '1';

const { app } = require('../src/app');

const PORT = process.env.DEV_PUBLIC_PORT || 3001;

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`Dev no-DB server running at http://localhost:${PORT}`);
});
