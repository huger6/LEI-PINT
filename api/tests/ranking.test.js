'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { models } = require('../src/config/db');
const { createAdminUser, createConsultantUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `rk.${tag}.${S}@test.invalid`;
const uname = (tag) => `rk_${tag}_${S}`.slice(0, 50);

let adminUser, adminToken;
let consultantUser, consultantToken;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const adminSession = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = adminSession.token;

    consultantUser = await createConsultantUser({ username: uname('cons'), email_address: email('cons') });
    const consSession = await loginAs(app, email('cons'), TEST_PASSWORD);
    consultantToken = consSession.token;
});

afterAll(async () => {
    await deleteUser(consultantUser.user_id);
    await deleteUser(adminUser.user_id);
});

describe('GET /api/ranking', () => {
    test('200 – Authenticated user gets ranking', async () => {
        const res = await request(app).get('/api/ranking').set(authHeader(consultantToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('200 – Admin gets ranking', async () => {
        const res = await request(app).get('/api/ranking').set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('200 – With pagination params', async () => {
        const res = await request(app)
            .get('/api/ranking?page=1&limit=5')
            .set(authHeader(consultantToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/ranking');
        expect(res.status).toBe(401);
    });
});

/*
 * Ranking shows points EARNED (positive deltas only) while every other surface
 * shows the consultant's REAL balance (net of points spent on rewards / lost).
 * Earned = 200 + 100 = 300; spent = 50; net balance = 250.
 */
describe('Ranking points = earned only; balance elsewhere = net', () => {
    const EARNED = 300;
    const SPENT = 50;
    const NET = EARNED - SPENT; // 250
    const RANK_LIMIT = 50;

    let pointsUser, pointsUserGuid, pointsToken;

    beforeAll(async () => {
        pointsUser = await createConsultantUser({ username: uname('pts'), email_address: email('pts') });
        pointsUserGuid = (await models.users.findByPk(pointsUser.user_id, { attributes: ['user_guid'] })).user_guid;

        // Two badge awards (positive) and one reward redemption (negative).
        await models.points_history.bulkCreate([
            { user_id: pointsUser.user_id, points_delta: 200, justification: 'Badge awarded: test A' },
            { user_id: pointsUser.user_id, points_delta: 100, justification: 'Badge awarded: test B' },
            { user_id: pointsUser.user_id, points_delta: -SPENT, justification: 'Resgate de recompensa: test reward' }
        ]);

        const session = await loginAs(app, email('pts'), TEST_PASSWORD);
        pointsToken = session.token;
    });

    afterAll(async () => {
        await models.points_history.destroy({ where: { user_id: pointsUser.user_id } });
        await deleteUser(pointsUser.user_id);
    });

    test('consultant-stats reports the NET balance (points spent are deducted)', async () => {
        const res = await request(app)
            .get('/api/gamification/consultant-stats')
            .set(authHeader(pointsToken));
        expect(res.status).toBe(200);
        expect(Number(res.body.data.totalPoints)).toBe(NET);
    });

    test('ranking row reports EARNED points (points spent are ignored)', async () => {
        const posRes = await request(app)
            .get(`/api/ranking/my-position?limit=${RANK_LIMIT}`)
            .set(authHeader(pointsToken));
        expect(posRes.status).toBe(200);
        const page = posRes.body.data.page;

        const rankRes = await request(app)
            .get(`/api/ranking?limit=${RANK_LIMIT}&page=${page}`)
            .set(authHeader(pointsToken));
        expect(rankRes.status).toBe(200);

        const row = rankRes.body.data.find((r) => r.user_guid === pointsUserGuid);
        expect(row).toBeDefined();
        expect(Number(row.total_points)).toBe(EARNED);
    });
});
