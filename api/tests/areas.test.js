'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `ar.${tag}.${S}@test.invalid`;
const uname = (tag) => `ar_${tag}_${S}`.slice(0, 50);

let adminUser, adminToken;
let regularUser, regularToken;
let lpSlug, slSlug, areaSlug;
let slId;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createConsultantUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;

    // Create prerequisite LP
    const lpRes = await request(app)
        .post('/api/learning-paths')
        .set(authHeader(adminToken))
        .send({ pathTitle: `AR Test LP ${S}`, pathSlug: `ar-lp-${S}` });
    lpSlug = lpRes.body.data?.pathSlug ?? lpRes.body.data?.path_slug ?? `ar-lp-${S}`;

    // Resolve LP id
    const lpListRes = await request(app).get('/api/learning-paths').set(authHeader(adminToken));
    const lpData = lpListRes.body.data?.rows ?? lpListRes.body.data ?? [];
    const lp = Array.isArray(lpData) ? lpData.find(p => p.path_slug === lpSlug || p.pathSlug === lpSlug) : null;
    const lpId = lp?.learning_path_id ?? lp?.id;

    // Create prerequisite SL
    if (lpId) {
        const slRes = await request(app)
            .post('/api/service-lines')
            .set(authHeader(adminToken))
            .send({ serviceLineName: `AR Test SL ${S}`, slSlug: `ar-sl-${S}`, learningPathId: lpId });
        slSlug = slRes.body.data?.slSlug ?? slRes.body.data?.sl_slug ?? `ar-sl-${S}`;
        slId = slRes.body.data?.service_line_id ?? slRes.body.data?.id;
    }
});

afterAll(async () => {
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
// GET /api/areas
// ─────────────────────────────────────────────
describe('GET /api/areas', () => {
    test('200 – Public list of areas', async () => {
        const res = await request(app).get('/api/areas');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

// ─────────────────────────────────────────────
// POST /api/areas
// ─────────────────────────────────────────────
describe('POST /api/areas', () => {
    test('201 – Admin creates an area', async () => {
        if (!slId) { console.warn('No SL available – skipping area creation'); return; }
        const res = await request(app)
            .post('/api/areas')
            .set(authHeader(adminToken))
            .send({ areaName: `Test Area ${S}`, areaSlug: `area-test-${S}`, serviceLineId: slId });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        areaSlug = res.body.data?.areaSlug ?? res.body.data?.area_slug ?? `area-test-${S}`;
    });

    test('400 – Missing areaName', async () => {
        const res = await request(app)
            .post('/api/areas')
            .set(authHeader(adminToken))
            .send({ areaSlug: `area-noname-${S}` });
        expect(res.status).toBe(400);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/areas').send({ areaName: 'No Auth' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create area', async () => {
        const res = await request(app)
            .post('/api/areas')
            .set(authHeader(regularToken))
            .send({ areaName: 'Sneaky Area' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GET /api/areas/:areaSlug
// ─────────────────────────────────────────────
describe('GET /api/areas/:areaSlug', () => {
    test('200 – Authenticated user gets area by slug', async () => {
        if (!areaSlug) return;
        const res = await request(app).get(`/api/areas/${areaSlug}`).set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent area slug', async () => {
        const res = await request(app)
            .get('/api/areas/area-does-not-exist-xyz')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!areaSlug) return;
        const res = await request(app).get(`/api/areas/${areaSlug}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/areas/check-slug
// ─────────────────────────────────────────────
describe('GET /api/areas/check-slug', () => {
    test('200 – Admin can check available slug', async () => {
        const res = await request(app)
            .get(`/api/areas/check-slug?slug=area-slug-avail-${S}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/areas/check-slug?slug=any');
        expect(res.status).toBe(401);
    });

    test('403 – Regular user blocked', async () => {
        const res = await request(app)
            .get('/api/areas/check-slug?slug=any')
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// PUT /api/areas/:areaSlug
// ─────────────────────────────────────────────
describe('PUT /api/areas/:areaSlug', () => {
    test('200 – Admin updates area', async () => {
        if (!areaSlug) return;
        const res = await request(app)
            .put(`/api/areas/${areaSlug}`)
            .set(authHeader(adminToken))
            .send({ areaDescription: 'Updated description.' });
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent area', async () => {
        const res = await request(app)
            .put('/api/areas/nonexistent-area')
            .set(authHeader(adminToken))
            .send({ areaDescription: 'Ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!areaSlug) return;
        const res = await request(app).put(`/api/areas/${areaSlug}`).send({ areaDescription: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        if (!areaSlug) return;
        const res = await request(app)
            .put(`/api/areas/${areaSlug}`)
            .set(authHeader(regularToken))
            .send({ areaDescription: 'Sneaky' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/areas/:areaSlug
// ─────────────────────────────────────────────
describe('DELETE /api/areas/:areaSlug', () => {
    test('401 – No token', async () => {
        if (!areaSlug) return;
        const res = await request(app).delete(`/api/areas/${areaSlug}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot delete', async () => {
        if (!areaSlug) return;
        const res = await request(app)
            .delete(`/api/areas/${areaSlug}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });

    test('404 – Non-existent area', async () => {
        const res = await request(app)
            .delete('/api/areas/nonexistent-area')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('200 – Admin deletes area', async () => {
        if (!areaSlug) return;
        const res = await request(app)
            .delete(`/api/areas/${areaSlug}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        areaSlug = null;
    });
});
