'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `lv.${tag}.${S}@test.invalid`;
const uname = (tag) => `lv_${tag}_${S}`.slice(0, 50);
const STAGE_CODE = `LV${S}`.slice(0, 20);

let adminUser, adminToken;
let regularUser, regularToken;
let lpSlug, slSlug, areaSlug;
let areaId;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createConsultantUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;

    // LP
    const lpRes = await request(app).post('/api/learning-paths').set(authHeader(adminToken))
        .send({ pathTitle: `LV LP ${S}`, pathSlug: `lv-lp-${S}` });
    lpSlug = lpRes.body.data?.pathSlug ?? lpRes.body.data?.path_slug ?? `lv-lp-${S}`;

    // Resolve LP id
    const lpListRes = await request(app).get('/api/learning-paths').set(authHeader(adminToken));
    const lpData = lpListRes.body.data?.rows ?? lpListRes.body.data ?? [];
    const lp = Array.isArray(lpData) ? lpData.find(p => p.path_slug === lpSlug || p.pathSlug === lpSlug) : null;
    const lpId = lp?.learning_path_id ?? lp?.id;

    // SL
    if (lpId) {
        const slRes = await request(app).post('/api/service-lines').set(authHeader(adminToken))
            .send({ serviceLineName: `LV SL ${S}`, slSlug: `lv-sl-${S}`, learningPathId: lpId });
        slSlug = slRes.body.data?.slSlug ?? slRes.body.data?.sl_slug ?? `lv-sl-${S}`;
        const slId = slRes.body.data?.service_line_id ?? slRes.body.data?.id;

        // Area
        if (slId) {
            const arRes = await request(app).post('/api/areas').set(authHeader(adminToken))
                .send({ areaName: `LV Area ${S}`, areaSlug: `lv-area-${S}`, serviceLineId: slId });
            areaSlug = arRes.body.data?.areaSlug ?? arRes.body.data?.area_slug ?? `lv-area-${S}`;
            areaId = arRes.body.data?.area_id ?? arRes.body.data?.id;
        }
    }
});

afterAll(async () => {
    // Levels are deleted via area cascade or explicit delete; just delete the area hierarchy
    if (areaSlug) {
        await request(app).delete(`/api/areas/${areaSlug}`).set(authHeader(adminToken)).catch(() => {});
    }
    if (slSlug) {
        await request(app).delete(`/api/service-lines/${slSlug}`).set(authHeader(adminToken)).catch(() => {});
    }
    if (lpSlug) {
        await request(app).delete(`/api/learning-paths/${lpSlug}`).set(authHeader(adminToken)).catch(() => {});
    }
    await deleteUser(regularUser.user_id);
    await deleteUser(adminUser.user_id);
});

// ─────────────────────────────────────────────
// GET /api/levels
// ─────────────────────────────────────────────
describe('GET /api/levels', () => {
    test('200 – Authenticated user can list levels', async () => {
        const res = await request(app).get('/api/levels').set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/levels');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// POST /api/levels
// ─────────────────────────────────────────────
describe('POST /api/levels', () => {
    test('201 – Admin creates a level', async () => {
        if (!areaId) { console.warn('No areaId – skipping level creation'); return; }
        const res = await request(app)
            .post('/api/levels')
            .set(authHeader(adminToken))
            .send({ areaId, stageCode: STAGE_CODE, stageTitle: `Test Level ${S}` });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('400 – Missing stageCode', async () => {
        const res = await request(app)
            .post('/api/levels')
            .set(authHeader(adminToken))
            .send({ areaId: 1, stageTitle: 'No Code' });
        expect(res.status).toBe(400);
    });

    test('400 – Missing areaId', async () => {
        const res = await request(app)
            .post('/api/levels')
            .set(authHeader(adminToken))
            .send({ stageCode: 'NOAREA', stageTitle: 'No Area' });
        expect(res.status).toBe(400);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/levels').send({ stageCode: 'X', stageTitle: 'X', areaId: 1 });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create', async () => {
        const res = await request(app)
            .post('/api/levels')
            .set(authHeader(regularToken))
            .send({ stageCode: STAGE_CODE, stageTitle: 'Sneaky', areaId: 1 });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GET /api/levels/:stageCode
// ─────────────────────────────────────────────
describe('GET /api/levels/:stageCode', () => {
    test('200 – Finds levels by stage code', async () => {
        const res = await request(app)
            .get(`/api/levels/${STAGE_CODE}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get(`/api/levels/${STAGE_CODE}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// PUT /api/levels/:stageCode
// ─────────────────────────────────────────────
describe('PUT /api/levels/:stageCode', () => {
    test('200 – Admin updates level', async () => {
        if (!areaId) return;
        const res = await request(app)
            .put(`/api/levels/${STAGE_CODE}`)
            .set(authHeader(adminToken))
            .send({ stageDescription: 'Updated description.' });
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent stageCode', async () => {
        const res = await request(app)
            .put('/api/levels/NONEXISTENT_CODE')
            .set(authHeader(adminToken))
            .send({ stageDescription: 'Ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        const res = await request(app).put(`/api/levels/${STAGE_CODE}`).send({ stageDescription: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        const res = await request(app)
            .put(`/api/levels/${STAGE_CODE}`)
            .set(authHeader(regularToken))
            .send({ stageDescription: 'Sneaky' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/levels/:stageCode
// ─────────────────────────────────────────────
describe('DELETE /api/levels/:stageCode', () => {
    test('401 – No token', async () => {
        const res = await request(app).delete(`/api/levels/${STAGE_CODE}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot delete', async () => {
        const res = await request(app)
            .delete(`/api/levels/${STAGE_CODE}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });

    test('404 – Non-existent stageCode', async () => {
        const res = await request(app)
            .delete('/api/levels/NONEXISTENT_CODE')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('200 – Admin deletes level', async () => {
        if (!areaId) return;
        const res = await request(app)
            .delete(`/api/levels/${STAGE_CODE}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });
});
