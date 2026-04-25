'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `bg.${tag}.${S}@test.invalid`;
const uname = (tag) => `bg_${tag}_${S}`.slice(0, 50);
const STAGE_CODE = `BG${S}`.slice(0, 20);

let adminUser, adminToken;
let regularUser, regularToken;
let lpSlug, slSlug, areaSlug;
let progressionStageId;
let badgeSlug;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createConsultantUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;

    // Build LP → SL → Area → Level hierarchy
    const lpRes = await request(app).post('/api/learning-paths').set(authHeader(adminToken))
        .send({ pathTitle: `BG LP ${S}`, pathSlug: `bg-lp-${S}` });
    lpSlug = lpRes.body.data?.pathSlug ?? lpRes.body.data?.path_slug ?? `bg-lp-${S}`;

    const lpListRes = await request(app).get('/api/learning-paths').set(authHeader(adminToken));
    const lpData = lpListRes.body.data?.rows ?? lpListRes.body.data ?? [];
    const lp = Array.isArray(lpData) ? lpData.find(p => p.path_slug === lpSlug || p.pathSlug === lpSlug) : null;
    const lpId = lp?.learning_path_id ?? lp?.id;

    if (lpId) {
        const slRes = await request(app).post('/api/service-lines').set(authHeader(adminToken))
            .send({ serviceLineName: `BG SL ${S}`, slSlug: `bg-sl-${S}`, learningPathId: lpId });
        slSlug = slRes.body.data?.slSlug ?? slRes.body.data?.sl_slug ?? `bg-sl-${S}`;
        const slId = slRes.body.data?.service_line_id ?? slRes.body.data?.id;

        if (slId) {
            const arRes = await request(app).post('/api/areas').set(authHeader(adminToken))
                .send({ areaName: `BG Area ${S}`, areaSlug: `bg-area-${S}`, serviceLineId: slId });
            areaSlug = arRes.body.data?.areaSlug ?? arRes.body.data?.area_slug ?? `bg-area-${S}`;
            const areaId = arRes.body.data?.area_id ?? arRes.body.data?.id;

            if (areaId) {
                const lvRes = await request(app).post('/api/levels').set(authHeader(adminToken))
                    .send({ areaId, stageCode: STAGE_CODE, stageTitle: `BG Level ${S}` });
                progressionStageId = lvRes.body.data?.progression_stage_id;
            }
        }
    }
});

afterAll(async () => {
    if (badgeSlug) {
        await request(app).delete(`/api/badges/${badgeSlug}`).set(authHeader(adminToken)).catch(() => {});
    }
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
// GET /api/badges
// ─────────────────────────────────────────────
describe('GET /api/badges', () => {
    test('200 – Authenticated user can list badges', async () => {
        const res = await request(app).get('/api/badges').set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/badges');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// POST /api/badges
// ─────────────────────────────────────────────
describe('POST /api/badges', () => {
    test('201 – Admin creates a badge', async () => {
        if (!progressionStageId) { console.warn('No progressionStageId – skipping badge creation'); return; }
        const res = await request(app)
            .post('/api/badges')
            .set(authHeader(adminToken))
            .send({
                badgeTitle: `Test Badge ${S}`,
                badgeSlug: `badge-test-${S}`,
                badgeType: 'Certification',
                badgePoints: 100,
                progressionStageId
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        badgeSlug = res.body.data?.badgeSlug ?? res.body.data?.badge_slug ?? `badge-test-${S}`;
    });

    test('400 – Missing badgeTitle', async () => {
        const res = await request(app)
            .post('/api/badges')
            .set(authHeader(adminToken))
            .send({ badgeType: 'Certification' });
        expect(res.status).toBe(400);
    });

    test('400 – Missing badgeType', async () => {
        const res = await request(app)
            .post('/api/badges')
            .set(authHeader(adminToken))
            .send({ badgeTitle: 'No Type Badge' });
        expect(res.status).toBe(400);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/badges').send({ badgeTitle: 'No Auth', badgeType: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create badge', async () => {
        const res = await request(app)
            .post('/api/badges')
            .set(authHeader(regularToken))
            .send({ badgeTitle: 'Sneaky Badge', badgeType: 'X' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// GET /api/badges/:badgeSlug
// ─────────────────────────────────────────────
describe('GET /api/badges/:badgeSlug', () => {
    test('200 – Returns badge by slug', async () => {
        if (!badgeSlug) return;
        const res = await request(app).get(`/api/badges/${badgeSlug}`).set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent badge', async () => {
        const res = await request(app)
            .get('/api/badges/badge-does-not-exist-xyz')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!badgeSlug) return;
        const res = await request(app).get(`/api/badges/${badgeSlug}`);
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/badges/check-slug
// ─────────────────────────────────────────────
describe('GET /api/badges/check-slug', () => {
    test('200 – Admin checks available slug', async () => {
        const res = await request(app)
            .get(`/api/badges/check-slug?slug=badge-avail-${S}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/badges/check-slug?slug=any');
        expect(res.status).toBe(401);
    });

    test('403 – Regular user blocked', async () => {
        const res = await request(app)
            .get('/api/badges/check-slug?slug=any')
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// PUT /api/badges/:badgeSlug
// ─────────────────────────────────────────────
describe('PUT /api/badges/:badgeSlug', () => {
    test('200 – Admin updates badge', async () => {
        if (!badgeSlug) return;
        const res = await request(app)
            .put(`/api/badges/${badgeSlug}`)
            .set(authHeader(adminToken))
            .send({ badgeDescription: 'Updated description.' });
        expect(res.status).toBe(200);
    });

    test('404 – Non-existent badge', async () => {
        const res = await request(app)
            .put('/api/badges/nonexistent-badge')
            .set(authHeader(adminToken))
            .send({ badgeDescription: 'Ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        if (!badgeSlug) return;
        const res = await request(app).put(`/api/badges/${badgeSlug}`).send({ badgeDescription: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        if (!badgeSlug) return;
        const res = await request(app)
            .put(`/api/badges/${badgeSlug}`)
            .set(authHeader(regularToken))
            .send({ badgeDescription: 'Sneaky' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/badges/:badgeSlug
// ─────────────────────────────────────────────
describe('DELETE /api/badges/:badgeSlug', () => {
    test('401 – No token', async () => {
        if (!badgeSlug) return;
        const res = await request(app).delete(`/api/badges/${badgeSlug}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot delete', async () => {
        if (!badgeSlug) return;
        const res = await request(app)
            .delete(`/api/badges/${badgeSlug}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });

    test('404 – Non-existent badge', async () => {
        const res = await request(app)
            .delete('/api/badges/nonexistent-badge')
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('200 – Admin deletes badge', async () => {
        if (!badgeSlug) return;
        const res = await request(app)
            .delete(`/api/badges/${badgeSlug}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        badgeSlug = null;
    });
});
