'use strict';

const request = require('supertest');
const { app } = require('../src/app');
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
