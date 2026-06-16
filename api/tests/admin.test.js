'use strict';

jest.mock('../src/services/email.service', () => ({
    sendConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendResetPasswordEmail: jest.fn().mockResolvedValue({ success: true })
}));

const request = require('supertest');
const { app } = require('../src/app');
const { createAdminUser, createConsultantUser, createTalentManagerUser, deleteUser, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `admin.${tag}.${S}@test.invalid`;
const uname = (tag) => `adm_${tag}_${S}`.slice(0, 50);

// Valid UUID shape that does not map to any row — exercises the 404 path now
// that user routes accept only the public GUID (never the numeric PK).
const GHOST_GUID = '11111111-1111-4111-8111-111111111111';

let adminUser, adminToken;
let regularUser, regularToken;
let createdUserId;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('main'), email_address: email('main') });
    const adminSession = await loginAs(app, email('main'), TEST_PASSWORD);
    adminToken = adminSession.token;

    regularUser = await createTalentManagerUser({ username: uname('reg'), email_address: email('reg') });
    const regSession = await loginAs(app, email('reg'), TEST_PASSWORD);
    regularToken = regSession.token;
});

afterAll(async () => {
    if (createdUserId) await deleteUser(createdUserId).catch(() => {});
    await deleteUser(regularUser.user_id);
    await deleteUser(adminUser.user_id);
});

// ─────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────
describe('GET /api/admin/users', () => {
    test('200 – Admin can list all users', async () => {
        const res = await request(app).get('/api/admin/users').set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/admin/users');
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot list users', async () => {
        const res = await request(app).get('/api/admin/users').set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// POST /api/admin/users
// ─────────────────────────────────────────────
describe('POST /api/admin/users', () => {
    test('201 – Admin creates a Talent Manager', async () => {
        const res = await request(app)
            .post('/api/admin/users')
            .set(authHeader(adminToken))
            .send({
                full_name: 'Created TM',
                username: uname('created'),
                email_address: email('created'),
                password: TEST_PASSWORD,
                user_role: 'Talent Manager'
            });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        createdUserId = res.body.data?.user_id;
    });

    test('400 – Missing required fields', async () => {
        const res = await request(app)
            .post('/api/admin/users')
            .set(authHeader(adminToken))
            .send({ full_name: 'Incomplete' });
        expect(res.status).toBe(400);
    });

    test('409 – Duplicate username/email', async () => {
        const res = await request(app)
            .post('/api/admin/users')
            .set(authHeader(adminToken))
            .send({
                full_name: 'Duplicate',
                username: uname('main'), // already taken
                email_address: email('dup'),
                password: TEST_PASSWORD,
                user_role: 'Talent Manager'
            });
        expect(res.status).toBe(409);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/admin/users').send({});
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot create users', async () => {
        const res = await request(app)
            .post('/api/admin/users')
            .set(authHeader(regularToken))
            .send({
                full_name: 'Sneaky',
                username: uname('sneaky'),
                email_address: email('sneaky'),
                password: TEST_PASSWORD,
                user_role: 'Talent Manager'
            });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// PUT /api/admin/users/:userId
// ─────────────────────────────────────────────
describe('PUT /api/admin/users/:userId', () => {
    test('200 – Admin updates a user', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${regularUser.user_guid}`)
            .set(authHeader(adminToken))
            .send({ full_name: 'Updated Name' });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('400 – Empty body (no fields)', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${regularUser.user_guid}`)
            .set(authHeader(adminToken))
            .send({});
        expect(res.status).toBe(400);
    });

    test('404 – Non-existent user', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${GHOST_GUID}`)
            .set(authHeader(adminToken))
            .send({ full_name: 'Ghost' });
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${regularUser.user_guid}`)
            .send({ full_name: 'X' });
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot update', async () => {
        const res = await request(app)
            .put(`/api/admin/users/${regularUser.user_guid}`)
            .set(authHeader(regularToken))
            .send({ full_name: 'Sneaky Update' });
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// DELETE /api/admin/users/:userId
// ─────────────────────────────────────────────
describe('DELETE /api/admin/users/:userId', () => {
    let targetUser;

    beforeAll(async () => {
        targetUser = await createConsultantUser({ username: uname('del'), email_address: email('del') });
    });

    afterAll(async () => {
        await deleteUser(targetUser.user_id).catch(() => {});
    });

    test('200 – Admin deactivates user', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${targetUser.user_guid}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('400 – Already inactive user', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${targetUser.user_guid}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(400);
    });

    test('400 – Admin cannot deactivate themselves', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${adminUser.user_guid}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(400);
    });

    test('404 – Non-existent user', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${GHOST_GUID}`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        const res = await request(app).delete(`/api/admin/users/${targetUser.user_guid}`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot deactivate', async () => {
        const res = await request(app)
            .delete(`/api/admin/users/${targetUser.user_guid}`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});

// ─────────────────────────────────────────────
// POST /api/admin/users/:userId/reset-password
// ─────────────────────────────────────────────
describe('POST /api/admin/users/:userId/reset-password', () => {
    test('200 – Admin resets user password', async () => {
        const res = await request(app)
            .post(`/api/admin/users/${regularUser.user_guid}/reset-password`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('404 – Non-existent user', async () => {
        const res = await request(app)
            .post(`/api/admin/users/${GHOST_GUID}/reset-password`)
            .set(authHeader(adminToken));
        expect(res.status).toBe(404);
    });

    test('401 – No token', async () => {
        const res = await request(app)
            .post(`/api/admin/users/${regularUser.user_guid}/reset-password`);
        expect(res.status).toBe(401);
    });

    test('403 – Regular user cannot reset passwords', async () => {
        const res = await request(app)
            .post(`/api/admin/users/${regularUser.user_guid}/reset-password`)
            .set(authHeader(regularToken));
        expect(res.status).toBe(403);
    });
});
