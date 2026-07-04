# LEI-PINT

Projeto Integrado - Plataforma de Badges da Softinsa (2025/2026)

LEI-PINT is a multi-app platform for managing digital badges, learning paths, validations, gamification, and public badge verification for Softinsa. The repository contains:

- `api/`: Node.js + Express backend with PostgreSQL, Redis, Socket.IO, email flows, exports, and badge/workflow logic.
- `web/`: React + Vite front-office for consultants, talent managers, service line leaders, and administrators.
- `mobile/`: Flutter app focused on the consultant experience.
- `DB/`: database assets, scripts, and schema materials.
- `docs/`: project report and supporting documentation.

## What The Platform Covers

The project implements the main flows described in the assignment:

- badge catalog and learning paths;
- evidence submission and approval workflows;
- consultant dashboards, rankings, and progress metrics;
- public badge pages and verification links;
- notifications, reminders, exports, and reports;
- multilingual support and gamification;
- a mobile app for consultants.

## Prerequisites

Install the following before running the project locally:

- Node.js 24.x or newer for the backend and web app;
- npm;
- Flutter SDK 3.11 or newer for the mobile app;
- PostgreSQL access;
- Redis access;
- a Supabase storage project;
- an SMTP account for transactional emails;
- Android Studio / Android SDK if you want to run the mobile app on Android.

## Environment Configuration

There is no single root `.env` file. Each app reads its own environment file.

### 1) API: `api/keys.env`

Copy `api/keys.env.example` to `api/keys.env` and fill in the values for your local environment or deployment target.

The most important values are:

- `NODE_ENV`: use `development` locally and `production` in deployment.
- `PORT`: API port, usually `3000`.
- `APP_URL` and `WEB_APP_URL`: the allowed browser origin for the web app, for example `http://localhost:5173` during local development.
- `FRONTEND_URL`, `FRONTEND_EMAIL_CONFIRMATION_URL`, `FRONTEND_RESET_PASSWORD_URL`: links used in emails and public badge flows.
- `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT`: PostgreSQL connection details.
- `JWT_SECRET_KEY` and `JWT_EXPIRES_IN`: authentication settings.
- `REDIS_URL`: Redis connection string.
- `SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_API_KEY`: storage credentials.
- `EMAIL_USER` and `EMAIL_PASSWORD`: SMTP credentials.
- `LOGO_URL` and `CERTIFICATE_ISSUING_ENTITY`: branding for generated emails and certificates.
- `GOOGLE_TRANSLATE_API_KEY`: optional translation support.

Optional local/dev toggles accepted by the backend include `SKIP_FIREBASE`, `SKIP_API_ROUTES`, `DEV_PUBLIC_URL`, and `FRONTEND_VERIFY_BADGE_URL`.

### 2) Web: `web/src/config/.env`

Copy `web/src/config/.env.example` to `web/src/config/.env`.

Minimum values:

- `API_URL`: base URL of the backend, for example `http://localhost:3000` locally.
- `SUPABASE_STORAGE_URL` and `SUPABASE_STORAGE_API_KEY` if the browser needs direct access to Supabase storage.
- `VITE_SUPABASE_STORAGE_URL` and `VITE_SUPABASE_STORAGE_API_KEY` for Vite-exposed access when required by the app.

The web app reads env files from `web/src/config/`, not from `web/`.

### 3) Mobile: `mobile/.env`

Create `mobile/.env` and provide the values used by the Flutter app.

Minimum values:

- `API_BASE_URL`: backend base URL including `/api`, for example `http://10.0.2.2:3000/api` on an Android emulator or `http://localhost:3000/api` on desktop/simulator setups.
- `FRONTEND_URL`: public web app URL used for badge and verification links.
- `SUPABASE_URL` or `SUPABASE_STORAGE_URL`.
- `SUPABASE_ANON_KEY` or `SUPABASE_STORAGE_API_KEY`.

The mobile app accepts both the `SUPABASE_*` and `SUPABASE_STORAGE_*` naming variants.

## Running Locally

Start the services in this order for a full local setup:

1. Configure the environment files described above.
2. Start PostgreSQL and Redis, or point the API to hosted instances.
3. Start the API.
4. Start the web app.
5. Start the mobile app if needed.

### Backend API

From the `api/` folder:

```bash
npm install
npm run dev
```

The backend will listen on the port defined in `api/keys.env` and exposes the API and Socket.IO on the same server.

Alternative commands:

```bash
npm start
npm test
npm run db:generate
npm run db:test
```

If you prefer Docker for the API, the `api/docker-compose.yml` file uses the same `keys.env` file:

```bash
docker compose up --build
```

### Web App

From the `web/` folder:

```bash
npm install
npm run dev
```

The Vite dev server runs on `http://localhost:5173` by default. Make sure `API_URL` points to your local backend before starting the app.

Useful commands:

```bash
npm run build
npm run lint
npm run preview
```

### Mobile App

From the `mobile/` folder:

```bash
flutter pub get
flutter run
```

On Android emulator, point `API_BASE_URL` to `http://10.0.2.2:3000/api`. If the mobile app needs to reach a backend running on your machine from a physical device, use your local network IP instead.

If you are testing against a local backend on Android, this helper is often required:

```bash
adb reverse tcp:3000 tcp:3000
```

## Repository Utilities

- `api/dev/`: helper scripts for local development and certificate/testing flows.
- `DB/`: SQL scripts and database artifacts.
- `tests/` inside the API project: backend integration and unit tests.

## Notes

- The project is split across three apps, so there is no single root-level `npm install` or `flutter pub get` that prepares everything.
- The backend expects working database and Redis connections at startup.
- Email, badge verification, and some public links depend on the frontend URL values being correct in the API and mobile environment files.
