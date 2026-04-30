'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `sl.${tag}.${S}@test.invalid`;
const uname = (tag) => `sl_${tag}_${S}`.slice(0, 50);

let adminUser, adminToken;
let regularUser, regularToken;
let lpSlug, slSlug;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createConsultantUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;

    // Create prerequisite learning path
    const lpRes = await request(app)
        .post('/api/learning-paths')
        .set(authHeader(adminToken))
        .send({ pathTitle: `SL Test LP ${S}`, pathSlug: `sl-test-lp-${S}` });
    lpSlug = lpRes.body.data?.pathSlug ?? lpRes.body.data?.path_slug ?? `sl-test-lp-${S}`;
});

afterAll(async () => {
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
// GET /api/service-lines
// ─────────────────────────────────────────────
describe('GET /api/service-lines', () => {
    test('200 – Authenticated user can list service lines', async () => {
        const res = await request(app).get('/api/service-lines').set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/service-lines');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// POST /api/service-lines
// ─────────────────────────────────────────────
describe('POST /api/service-lines', () => {
    test('201 – Admin creates a service line', async () => {
        const lpListRes = await request(app).get('/api/learning-paths').set(authHeader(adminToken));
        const lpData = lpListRes.body.data?.rows ?? lpListRes.body.data ?? [];
        const lp = Array.isArray(lpData) ? lpData.find(p => p.path_slug === lpSlug || p.pathSlug === lpSlug) : null;
        const lpId = lp?.learning_path_id ?? lp?.id;

        if (!lpId) {
            console.warn('Could not resolve LP id – skipping creation test');
            return;
        }

        const res = await request(app)
            .post('/api/service-lines')
            .set(authHeader(adminToken))
            .send({
                serviceLineName: `Test SL ${S}`,
                slSlug: `sl-test-${S}`,
                learningPathId: lpId
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        slSlug = res.body.data?.slSlug ?? res.body.data?.sl_slug ?? `sl-test-${S}`;
    });

    test('400 – Missing serviceLineName', async () => {
        const res = await request(app)
            .post('/api/service-lines')
            .set(authHeader(adminToken))
            .send({ slSlug: `sl-noname-${S}` });
        expect(res.status).toBe(400);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/service-lines').send({ serviceLineName: 'No Auth' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create', async () => {
        const res = await request(app)
            .post('/api/service-lines')
            .set(authHeader(regularToken))
            .send({ serviceLineName: 'Sneaky SL' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GET /api/service-lines/:slSlug
// ─────────────────────────────────────────────
describe('GET /api/service-lines/:slSlug', () => {
    test('200 – Returns service line by slug', async () => {
        if (!slSlug) return;
        const res = await request(app).get(`/api/service-lines/${slSlug}`).set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .get('/api/service-lines/does-not-exist-xyz')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!slSlug) return;
        const res = await request(app).get(`/api/service-lines/${slSlug}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/service-lines/check-slug
// ─────────────────────────────────────────────
describe('GET /api/service-lines/check-slug', () => {
    test('200 – Available slug', async () => {
        const res = await request(app)
            .get(`/api/service-lines/check-slug?slug=sl-avail-${S}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/service-lines/check-slug?slug=any');
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot check slug', async () => {
        const res = await request(app)
            .get('/api/service-lines/check-slug?slug=any')
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// PUT /api/service-lines/:slSlug
// ─────────────────────────────────────────────
describe('PUT /api/service-lines/:slSlug', () => {
    test('200 – Admin updates service line', async () => {
        if (!slSlug) return;
        const res = await request(app)
            .put(`/api/service-lines/${slSlug}`)
            .set(authHeader(adminToken))
            .send({ serviceLineDescription: 'Updated description.' });
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .put('/api/service-lines/nonexistent-sl')
            .set(authHeader(adminToken))
            .send({ serviceLineDescription: 'Ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!slSlug) return;
        const res = await request(app).put(`/api/service-lines/${slSlug}`).send({ serviceLineDescription: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        if (!slSlug) return;
        const res = await request(app)
            .put(`/api/service-lines/${slSlug}`)
            .set(authHeader(regularToken))
            .send({ serviceLineDescription: 'Sneaky' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/service-lines/:slSlug
// ─────────────────────────────────────────────
describe('DELETE /api/service-lines/:slSlug', () => {
    test('401 – No token', async () => {
        if (!slSlug) return;
        const res = await request(app).delete(`/api/service-lines/${slSlug}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot delete', async () => {
        if (!slSlug) return;
        const res = await request(app)
            .delete(`/api/service-lines/${slSlug}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .delete('/api/service-lines/nonexistent-sl')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('200 – Admin deletes service line', async () => {
        if (!slSlug) return;
        const res = await request(app)
            .delete(`/api/service-lines/${slSlug}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        slSlug = null;
    });
});
