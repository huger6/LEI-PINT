'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `gm.${tag}.${S}@test.invalid`;
const uname = (tag) => `gm_${tag}_${S}`.slice(0, 50);

let consultantUser, consultantToken;

beforeAll(async () => {
    consultantUser = await createConsultantUser({ username: uname('cons'), email_address: email('cons') });
    const session = await loginAs(app, email('cons'), TEST_PASSWORD);
    consultantToken = session.token;
});

afterAll(async () => {
    await deleteUser(consultantUser.user_id);
});

describe('GET /api/gamification/consultant-stats', () => {
    test('200 – Returns consultant statistics', async () => {
        const res = await request(app)
            .get('/api/gamification/consultant-stats')
            .set(authHeader(consultantToken));

        expect(res.status).toBe(200);
        expect(res.body.code).toBe('GAMIFICATION_STATS_RETRIEVED');
        expect(res.body.data).toHaveProperty('totalPoints');
        expect(res.body.data).toHaveProperty('earnedBadges');
        expect(res.body.data).toHaveProperty('badgesInProgress');
        expect(res.body.data).toHaveProperty('rankingPosition');
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/gamification/consultant-stats');
        expect(res.status).toBe(401);
    });
});

describe('GET /api/gamification/earned-badges', () => {
    test('200 – Returns earned badges payload or empty list', async () => {
        const res = await request(app)
            .get('/api/gamification/earned-badges')
            .set(authHeader(consultantToken));

        expect(res.status).toBe(200);
        expect(['GAMIFICATION_EARNED_BADGES_RETRIEVED', 'GAMIFICATION_NO_ACHIEVEMENTS']).toContain(res.body.code);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/gamification/earned-badges');
        expect(res.status).toBe(401);
    });
});