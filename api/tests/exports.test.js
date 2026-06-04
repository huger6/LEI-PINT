'use strict';

jest.mock('../src/config/db', () => ({
    sequelize: {
        query: jest.fn()
    }
}));

jest.mock('../src/utils/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

const { sequelize } = require('../src/config/db');
const exportsController = require('../src/controllers/exports.controller');

const createRes = () => {
    const res = {};
    res.statusCode = 200;
    res.headers = {};
    res.status = jest.fn((code) => {
        res.statusCode = code;
        return res;
    });
    res.setHeader = jest.fn((key, value) => {
        res.headers[key] = value;
        return res;
    });
    res.send = jest.fn((body) => {
        res.body = body;
        return res;
    });
    res.json = jest.fn((body) => {
        res.body = body;
        return res;
    });
    return res;
};

describe('exports controller', () => {
    beforeEach(() => {
        sequelize.query.mockReset();
    });

    test('exports consultants as CSV by default', async () => {
        sequelize.query.mockResolvedValue([
            { user_guid: 'u-1', full_name: 'Ana Silva', total_points: 120 }
        ]);

        const res = createRes();
        await exportsController.exportConsultants({ query: {} }, res);

        expect(res.status).not.toHaveBeenCalled();
        expect(res.headers['Content-Type']).toContain('text/csv');
        expect(res.body).toContain('"user_guid","full_name","total_points"');
        expect(res.body).toContain('u-1');
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('exports application logs as XLSX when requested', async () => {
        sequelize.query.mockResolvedValue([
            {
                application_validation_log_id: 7,
                application_id: 42,
                validator_function: 'validateApplication',
                validator_action: 'accept',
                comments: 'ok',
                created_at: new Date('2026-05-22T10:00:00Z'),
                user_id: 9
            }
        ]);

        const res = createRes();
        await exportsController.exportApplicationLogs({ query: { format: 'xlsx' } }, res);

        expect(res.headers['Content-Type']).toContain('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('exports applications as CSV with state filter', async () => {
        sequelize.query.mockResolvedValue([
            {
                application_id: 3,
                application_guid: '11111111-1111-1111-1111-111111111111',
                application_state: 'Submitted',
                opened_at: new Date('2026-05-20T09:00:00Z'),
                submitted_at: new Date('2026-05-21T09:00:00Z'),
                closed_at: null,
                consultant_notes: null,
                user_guid: 'u-2',
                full_name: 'Joao Costa',
                email_address: 'joao@test.invalid',
                badge_title: 'Node.js Basics',
                badge_slug: 'node-basics'
            }
        ]);

        const res = createRes();
        await exportsController.exportApplications({
            query: { state: 'Submitted' },
            user: { sub: 9, role: 'Administrator' }
        }, res);

        expect(res.headers['Content-Type']).toContain('text/csv');
        expect(res.body).toContain('"application_state"');
        expect(res.body).toContain('Submitted');
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('exports badges as CSV with search filter', async () => {
        sequelize.query.mockResolvedValue([
            {
                badge_id: 8,
                badge_title: 'Node.js Essentials',
                badge_slug: 'node-essentials',
                badge_type: 'Technical',
                badge_points: 25,
                is_active: true,
                service_line_title: 'Engineering',
                area_title: 'Platform',
                created_at: new Date('2026-05-10T10:00:00Z'),
                updated_at: new Date('2026-05-11T10:00:00Z')
            }
        ]);

        const res = createRes();
        await exportsController.exportBadges({ query: { q: 'node', active: 'true' } }, res);

        expect(res.headers['Content-Type']).toContain('text/csv');
        expect(res.body).toContain('"badge_title"');
        expect(res.body).toContain('Node.js Essentials');
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('exports points history as PDF when requested', async () => {
        sequelize.query.mockResolvedValue([
            {
                points_history_id: 11,
                user_id: 22,
                full_name: 'Ana Silva',
                points_delta: 15,
                justification: 'Completed badge requirement',
                created_at: new Date('2026-05-22T11:00:00Z')
            }
        ]);

        const res = createRes();
        await exportsController.exportPointsHistory({ query: { format: 'pdf' } }, res);

        expect(res.headers['Content-Type']).toBe('application/pdf');
        expect(Buffer.isBuffer(res.body)).toBe(true);
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('rejects invalid export date ranges', async () => {
        const res = createRes();
        await exportsController.exportConsultants({ query: { from: '2026-05-22', to: '2026-01-01' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.code).toBe('VALIDATION_DATA_ERROR');
        expect(sequelize.query).not.toHaveBeenCalled();
    });
});
