'use strict';

const { z } = require('zod');
const validate = require('../src/middlewares/validate.middleware');

const createRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn((body) => {
        res.body = body;
        return res;
    });
    return res;
};

describe('validate middleware', () => {
    test('returns structured 400 for invalid body', () => {
        const middleware = validate(z.object({ name: z.string().min(1) }));
        const req = { body: { name: '' } };
        const res = createRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.code).toBe('VALIDATION_DATA_ERROR');
        expect(res.body.errors).toHaveLength(1);
        expect(next).not.toHaveBeenCalled();
    });

    test('passes through valid body', () => {
        const middleware = validate(z.object({ name: z.string().min(1) }));
        const req = { body: { name: 'Ana' } };
        const res = createRes();
        const next = jest.fn();

        middleware(req, res, next);

        expect(req.body).toEqual({ name: 'Ana' });
        expect(next).toHaveBeenCalledTimes(1);
        expect(res.status).not.toHaveBeenCalled();
    });
});