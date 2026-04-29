'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `lp.${tag}.${S}@test.invalid`;
const uname = (tag) => `lp_${tag}_${S}`.slice(0, 50);
const slug = (tag) => `lp-test-${tag}-${S}`.toLowerCase();

let adminUser, adminToken;
let regularUser, regularToken;
let createdSlug;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createConsultantUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;
});

afterAll(async () => {
    if (createdSlug) {
        await request(app).delete(`/api/learning-paths/${createdSlug}`).set(authHeader(adminToken)).catch(() => {});
    }
    await deleteUser(regularUser.user_id);
    await deleteUser(adminUser.user_id);
});

// ─────────────────────────────────────────────
// GET /api/learning-paths
// ─────────────────────────────────────────────
describe('GET /api/learning-paths', () => {
    test('200 – Public list', async () => {
        const res = await request(app).get('/api/learning-paths');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('200 – With pagination params', async () => {
        const res = await request(app).get('/api/learning-paths?page=1&limit=5');
        expect(res.status).toBe(200);
    });
});

// ─────────────────────────────────────────────
// POST /api/learning-paths
// ─────────────────────────────────────────────
describe('POST /api/learning-paths', () => {
    test('201 – Admin creates a learning path', async () => {
        const res = await request(app)
            .post('/api/learning-paths')
            .set(authHeader(adminToken))
            .send({ pathTitle: `Test LP ${S}`, pathSlug: slug('create') });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        createdSlug = res.body.data?.pathSlug ?? res.body.data?.path_slug ?? slug('create');
    });

    test('400 – Missing pathTitle', async () => {
        const res = await request(app)
            .post('/api/learning-paths')
            .set(authHeader(adminToken))
            .send({ pathSlug: slug('notitle') });
        expect(res.status).toBe(400);
    });

    test('401 – No token', async () => {
        const res = await request(app)
            .post('/api/learning-paths')
            .send({ pathTitle: 'No Token LP' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create', async () => {
        const res = await request(app)
            .post('/api/learning-paths')
            .set(authHeader(regularToken))
            .send({ pathTitle: 'Sneaky LP' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GET /api/learning-paths/:pathSlug
// ─────────────────────────────────────────────
describe('GET /api/learning-paths/:pathSlug', () => {
    test('200 – Admin gets created path', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .get(`/api/learning-paths/${createdSlug}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .get('/api/learning-paths/definitely-does-not-exist-xyz')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!createdSlug) return;
        const res = await request(app).get(`/api/learning-paths/${createdSlug}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/learning-paths/check-slug
// ─────────────────────────────────────────────
describe('GET /api/learning-paths/check-slug', () => {
    test('200 – Available slug', async () => {
        const res = await request(app)
            .get(`/api/learning-paths/check-slug?slug=lp-slug-avail-${S}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/learning-paths/check-slug?slug=any');
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot check slug', async () => {
        const res = await request(app)
            .get('/api/learning-paths/check-slug?slug=any')
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// PUT /api/learning-paths/:pathSlug
// ─────────────────────────────────────────────
describe('PUT /api/learning-paths/:pathSlug', () => {
    test('200 – Admin updates learning path', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .put(`/api/learning-paths/${createdSlug}`)
            .set(authHeader(adminToken))
            .send({ pathDescription: 'Updated description.' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .put('/api/learning-paths/nonexistent-slug')
            .set(authHeader(adminToken))
            .send({ pathDescription: 'Update ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .put(`/api/learning-paths/${createdSlug}`)
            .send({ pathDescription: 'No auth' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .put(`/api/learning-paths/${createdSlug}`)
            .set(authHeader(regularToken))
            .send({ pathDescription: 'Sneaky update' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/learning-paths/:pathSlug
// ─────────────────────────────────────────────
describe('DELETE /api/learning-paths/:pathSlug', () => {
    test('401 – No token', async () => {
        if (!createdSlug) return;
        const res = await request(app).delete(`/api/learning-paths/${createdSlug}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot delete', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .delete(`/api/learning-paths/${createdSlug}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });

    test('404 – Non-existent slug', async () => {
        const res = await request(app)
            .delete('/api/learning-paths/nonexistent-slug')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('200 – Admin deletes learning path', async () => {
        if (!createdSlug) return;
        const res = await request(app)
            .delete(`/api/learning-paths/${createdSlug}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        createdSlug = null;
    });
});
