'use strict';

jest.mock('../src/services/email.service', () => ({
    sendConfirmationEmail: jest.fn().mockResolvedValue({ success: true }),
    sendResetPasswordEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Disable all rate limiters so test requests are never throttled
jest.mock('express-rate-limit', () => () => (_req, _res, next) => next());

const request = require('supertest');
const { app } = require('../src/app');
const { models } = require('../src/config/db');
const { sendConfirmationEmail, sendResetPasswordEmail } = require('../src/services/email.service');
const { createAdminUser, deleteUser, deleteUserByEmail, TEST_PASSWORD } = require('./helpers/db.helper');
const { loginAs, authHeader } = require('./helpers/auth.helper');

const S = Date.now().toString(36);
const email = (tag) => `auth.${tag}.${S}@test.invalid`;
const uname = (tag) => `au_${tag}_${S}`.slice(0, 50);

let adminUser, adminToken;

beforeAll(async () => {
    adminUser = await createAdminUser({ username: uname('adm'), email_address: email('adm') });
    const session = await loginAs(app, email('adm'), TEST_PASSWORD);
    adminToken = session.token;
});

afterAll(async () => {
    await deleteUserByEmail(email('adm'));
    // Clean up any users created by register tests
    for (const tag of ['reg_c', 'reg_tm', 'dup', 'me', 'chpw', 'fpc', 'confirmme']) {
        await deleteUserByEmail(email(tag));
    }
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
describe('POST /api/auth/register', () => {
    test('201 – Talent Manager registration', async () => {
        sendConfirmationEmail.mockResolvedValueOnce({ success: true });
        const res = await request(app).post('/api/auth/register').send({
            full_name: 'Test TM',
            username: uname('reg_tm'),
            email_address: email('reg_tm'),
            password: TEST_PASSWORD,
            user_role: 'Talent Manager'
        });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('400 – Administrator role is forbidden on register', async () => {
        const res = await request(app).post('/api/auth/register').send({
            full_name: 'Bad Admin',
            username: uname('badadm'),
            email_address: email('badadm'),
            password: TEST_PASSWORD,
            user_role: 'Administrator'
        });
        expect(res.status).toBe(400);
    });

    test('400 – Missing required fields', async () => {
        const res = await request(app).post('/api/auth/register').send({
            full_name: 'No Email',
            username: uname('noem'),
            password: TEST_PASSWORD,
            user_role: 'Talent Manager'
        });
        expect(res.status).toBe(400);
    });

    test('400 – Weak password', async () => {
        const res = await request(app).post('/api/auth/register').send({
            full_name: 'Weak Pass',
            username: uname('weak'),
            email_address: email('weak'),
            password: 'short',
            user_role: 'Talent Manager'
        });
        expect(res.status).toBe(400);
    });

    test('409 – Duplicate email', async () => {
        sendConfirmationEmail.mockResolvedValue({ success: true });
        const res = await request(app).post('/api/auth/register').send({
            full_name: 'Dup User',
            username: uname('dup2'),
            email_address: email('adm'), // email already taken by adminUser
            password: TEST_PASSWORD,
            user_role: 'Talent Manager'
        });
        expect(res.status).toBe(409);
    });

    test('400 – Already logged in (annonymousUsersOnly)', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .set(authHeader(adminToken))
            .send({
                full_name: 'Logged In',
                username: uname('loggedin'),
                email_address: email('loggedin'),
                password: TEST_PASSWORD,
                user_role: 'Talent Manager'
            });
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
describe('POST /api/auth/login', () => {
    test('200 – Login with email', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: email('adm'),
            password: TEST_PASSWORD
        });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    test('200 – Login with username', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: uname('adm'),
            password: TEST_PASSWORD
        });
        expect(res.status).toBe(200);
        expect(res.body.data.token).toBeDefined();
    });

    test('400 – Wrong password', async () => {
        const res = await request(app).post('/api/auth/login').send({
            identifier: email('adm'),
            password: 'WrongPass@1'
        });
        expect([400, 401]).toContain(res.status);
    });

    test('400 – Missing identifier', async () => {
        const res = await request(app).post('/api/auth/login').send({ password: TEST_PASSWORD });
        expect(res.status).toBe(400);
    });

    test('400 – Unconfirmed email', async () => {
        // Create user with email_confirmed=false (default)
        const { createTestUser } = require('./helpers/db.helper');
        const unconfirmed = await createTestUser({
            full_name: 'Unconfirmed',
            username: uname('unconf'),
            email_address: email('unconf'),
            force_password_change: false
        });
        await models.users.update({ email_confirmed: false }, { where: { user_id: unconfirmed.user_id } });

        const res = await request(app).post('/api/auth/login').send({
            identifier: email('unconf'),
            password: TEST_PASSWORD
        });
        expect(res.status).toBe(403);
        await deleteUser(unconfirmed.user_id);
    });
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────
describe('GET /api/auth/me', () => {
    test('200 – Returns current user profile', async () => {
        const res = await request(app).get('/api/auth/me').set(authHeader(adminToken));
        expect(res.status).toBe(200);
        expect(res.body.data).toBeDefined();
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/auth/verify-session
// ─────────────────────────────────────────────
describe('GET /api/auth/verify-session', () => {
    test('200 – Valid session', async () => {
        const res = await request(app).get('/api/auth/verify-session').set(authHeader(adminToken));
        expect(res.status).toBe(200);
    });

    test('401 – No token', async () => {
        const res = await request(app).get('/api/auth/verify-session');
        expect(res.status).toBe(401);
    });

    test('401 – Invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/verify-session')
            .set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// GET /api/auth/confirm-email
// ─────────────────────────────────────────────
describe('GET /api/auth/confirm-email', () => {
    test('200 – Valid confirmation token confirms account', async () => {
        sendConfirmationEmail.mockClear();
        sendConfirmationEmail.mockResolvedValueOnce({ success: true });

        await request(app).post('/api/auth/register').send({
            full_name: 'To Confirm',
            username: uname('confirmme'),
            email_address: email('confirmme'),
            password: TEST_PASSWORD,
            user_role: 'Talent Manager'
        });

        // The raw token is the 3rd arg passed to the mocked sendConfirmationEmail
        const rawToken = sendConfirmationEmail.mock.calls[0][2];

        const res = await request(app).get(`/api/auth/confirm-email?token=${rawToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('400 – Invalid / missing token', async () => {
        const res = await request(app).get('/api/auth/confirm-email?token=badtoken');
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/resend-confirmation
// ─────────────────────────────────────────────
describe('POST /api/auth/resend-confirmation', () => {
    test('200 – Always returns 200 for security (unknown email)', async () => {
        const res = await request(app)
            .post('/api/auth/resend-confirmation')
            .send({ email: 'nobody@nowhere.invalid' });
        expect(res.status).toBe(200);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
    test('200 – Always returns 200 (existing email)', async () => {
        sendResetPasswordEmail.mockResolvedValueOnce({ success: true });
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: email('adm') });
        expect(res.status).toBe(200);
    });

    test('200 – Always returns 200 (non-existing email)', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'nobody@nowhere.invalid' });
        expect(res.status).toBe(200);
    });

    test('400 – Invalid email format', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .send({ email: 'not-an-email' });
        expect(res.status).toBe(400);
    });

    test('400 – Logged-in user blocked (annonymousUsersOnly)', async () => {
        const res = await request(app)
            .post('/api/auth/forgot-password')
            .set(authHeader(adminToken))
            .send({ email: email('adm') });
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────
// GET /api/auth/validate-reset-token/:token
// ─────────────────────────────────────────────
describe('GET /api/auth/validate-reset-token/:token', () => {
    test('400 – Non-existent token', async () => {
        const res = await request(app).get('/api/auth/validate-reset-token/nonexistenttoken');
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/reset-password
// ─────────────────────────────────────────────
describe('POST /api/auth/reset-password', () => {
    test('400 – Invalid token', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({
            token: 'invalidtoken',
            newPassword: TEST_PASSWORD
        });
        expect(res.status).toBe(400);
    });

    test('400 – Weak new password', async () => {
        const res = await request(app).post('/api/auth/reset-password').send({
            token: 'anytoken',
            newPassword: 'weak'
        });
        expect(res.status).toBe(400);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/change-password
// ─────────────────────────────────────────────
describe('POST /api/auth/change-password', () => {
    let chpwUser, chpwToken;

    beforeAll(async () => {
        chpwUser = await createAdminUser({ username: uname('chpw'), email_address: email('chpw') });
        const session = await loginAs(app, email('chpw'), TEST_PASSWORD);
        chpwToken = session.token;
    });

    afterAll(async () => {
        await deleteUser(chpwUser.user_id);
    });

    test('200 – Successfully changes password', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .set(authHeader(chpwToken))
            .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass@9876' });
        expect(res.status).toBe(200);
    });

    test('400 – Current password incorrect', async () => {
        const freshUser = await createAdminUser({ username: uname('chpw2'), email_address: email('chpw2') });
        const session = await loginAs(app, email('chpw2'), TEST_PASSWORD);
        const res = await request(app)
            .post('/api/auth/change-password')
            .set(authHeader(session.token))
            .send({ currentPassword: 'WrongPass@1', newPassword: 'NewPass@9876' });
        expect(res.status).toBe(400);
        await deleteUser(freshUser.user_id);
    });

    test('401 – No token', async () => {
        const res = await request(app)
            .post('/api/auth/change-password')
            .send({ currentPassword: TEST_PASSWORD, newPassword: 'NewPass@9876' });
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
    test('200 – Logout clears session', async () => {
        const freshUser = await createAdminUser({ username: uname('logout'), email_address: email('logout') });
        const session = await loginAs(app, email('logout'), TEST_PASSWORD);
        const res = await request(app)
            .post('/api/auth/logout')
            .set(authHeader(session.token))
            .set('Cookie', session.cookie);
        expect(res.status).toBe(200);
        await deleteUser(freshUser.user_id);
    });

    test('401 – No token', async () => {
        const res = await request(app).post('/api/auth/logout');
        expect(res.status).toBe(401);
    });
});

// ─────────────────────────────────────────────
// POST /api/auth/refresh
// ─────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
    test('401 – No refresh cookie', async () => {
        const res = await request(app).post('/api/auth/refresh');
        expect(res.status).toBe(401);
    });
});
