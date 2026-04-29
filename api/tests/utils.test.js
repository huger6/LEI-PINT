'use strict';

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const uname = (tag) => `ut_${tag}_${S}`.slice(0, 50);
const email = (tag) => `utils.${tag}.${S}@test.invalid`;

let adminUser, adminToken;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const session = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = session.token;
});

afterAll(async () => {
    await deleteUser(adminUser.user_id);
});

describe('GET /api/utils/check/username', () => {
    test('200 – Available username', async () => {
        const res = await request(app).get(`/api/utils/check/username?value=available_${S}`);
        expect(res.status).toBe(200);
    });

    test('200 – Taken username', async () => {
        const res = await request(app).get(`/api/utils/check/username?value=${uname('adm')}`);
        expect(res.status).toBe(200);
        expect(res.body.data?.available).toBe(false);
    });
});

describe('GET /api/utils/check/email', () => {
    test('200 – Available email', async () => {
        const res = await request(app).get(`/api/utils/check/email?value=avail_${S}@test.invalid`);
        expect(res.status).toBe(200);
    });

    test('200 – Taken email', async () => {
        const res = await request(app).get(`/api/utils/check/email?value=${email('adm')}`);
        expect(res.status).toBe(200);
        expect(res.body.data?.available).toBe(false);
    });
});

describe('GET /api/utils/check/slug/area', () => {
    test('200 – Available area slug', async () => {
        const res = await request(app).get(`/api/utils/check/slug/area?value=area-avail-${S}`);
        expect(res.status).toBe(200);
    });
});

describe('GET /api/utils/check/slug/service-line', () => {
    test('200 – Available service-line slug', async () => {
        const res = await request(app).get(`/api/utils/check/slug/service-line?value=sl-avail-${S}`);
        expect(res.status).toBe(200);
    });
});

describe('GET /api/utils/check/slug/learning-path', () => {
    test('200 – Available learning-path slug', async () => {
        const res = await request(app).get(`/api/utils/check/slug/learning-path?value=lp-avail-${S}`);
        expect(res.status).toBe(200);
    });
});

describe('GET /api/utils/check/slug/badge', () => {
    test('200 – Available badge slug', async () => {
        const res = await request(app).get(`/api/utils/check/slug/badge?value=badge-avail-${S}`);
        expect(res.status).toBe(200);
    });
});

describe('POST /api/utils/check/biography', () => {
    test('200 – Valid biography', async () => {
        const res = await request(app)
            .post('/api/utils/check/biography')
            .send({ biography: 'This is a perfectly valid biography about the user.' });
        expect(res.status).toBe(200);
        expect(res.body.data?.available).toBe(true);
    });

    test('200 – Biography too long returns available: false', async () => {
        const res = await request(app)
            .post('/api/utils/check/biography')
            .send({ biography: 'word '.repeat(600) });
        expect(res.status).toBe(200);
        expect(res.body.data?.available).toBe(false);
    });
});
