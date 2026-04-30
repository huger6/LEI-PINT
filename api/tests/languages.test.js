'use strict';

const request = require('supertest');
const { app } = require('../src/app');

describe('GET /api/languages', () => {
    test('200 – Returns list of languages', async () => {
        const res = await request(app).get('/api/languages');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
