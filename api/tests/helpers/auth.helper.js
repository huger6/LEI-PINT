'use strict';

const request = require('supertest');

async function loginAs(app, identifier, password) {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier, password, remember: false });

    if (res.status !== 200) {
        throw new Error(`loginAs failed (${res.status}): ${JSON.stringify(res.body)}`);
    }

    return {
        token: res.body.data.token,
        cookie: res.headers['set-cookie'] || []
    };
}

function authHeader(token) {
    return { Authorization: `Bearer ${token}` };
}

module.exports = { loginAs, authHeader };
