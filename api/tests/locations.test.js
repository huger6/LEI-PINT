'use strict';

const request = require('supertest');
const { app } = require('../src/app');

describe('GET /api/locations', () => {
    test('200 – Returns list of locations', async () => {
        const res = await request(app).get('/api/locations');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
