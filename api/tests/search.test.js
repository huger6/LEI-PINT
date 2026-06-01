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
const searchController = require('../src/controllers/search.controller');

const createRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = jest.fn((code) => {
        res.statusCode = code;
        return res;
    });
    res.json = jest.fn((body) => {
        res.body = body;
        return res;
    });
    return res;
};

describe('search controller', () => {
    beforeEach(() => {
        sequelize.query.mockReset();
    });

    test('searches multiple entities with pagination', async () => {
        sequelize.query.mockResolvedValue([
            {
                entity_type: 'user',
                entity_id: 10,
                title: 'Ana Silva',
                subtitle: 'ana.silva',
                image_url: null,
                meta: 'Consultant',
                is_active: true,
                created_at: new Date('2026-05-20T10:00:00Z'),
                updated_at: new Date('2026-05-21T10:00:00Z'),
                relevance: 0.8,
                total_items: 7
            },
            {
                entity_type: 'learning_path',
                entity_id: 31,
                title: 'Node.js Path',
                subtitle: 'nodejs-path',
                image_url: null,
                meta: 'Backend track',
                is_active: true,
                created_at: new Date('2026-05-17T10:00:00Z'),
                updated_at: new Date('2026-05-18T10:00:00Z'),
                relevance: 0.68,
                total_items: 7
            },
            {
                entity_type: 'service_line',
                entity_id: 41,
                title: 'Platform Engineering',
                subtitle: 'platform-engineering',
                image_url: null,
                meta: 'Core services',
                is_active: true,
                created_at: new Date('2026-05-16T10:00:00Z'),
                updated_at: new Date('2026-05-17T10:00:00Z'),
                relevance: 0.67,
                total_items: 7
            },
            {
                entity_type: 'area',
                entity_id: 51,
                title: 'Cloud',
                subtitle: 'cloud',
                image_url: null,
                meta: 'Infra area',
                is_active: true,
                created_at: new Date('2026-05-15T10:00:00Z'),
                updated_at: new Date('2026-05-16T10:00:00Z'),
                relevance: 0.66,
                total_items: 7
            },
            {
                entity_type: 'badge',
                entity_id: 22,
                title: 'Node.js Essentials',
                subtitle: 'node-essentials',
                image_url: null,
                meta: 'Technical',
                is_active: true,
                created_at: new Date('2026-05-18T10:00:00Z'),
                updated_at: new Date('2026-05-19T10:00:00Z'),
                relevance: 0.65,
                parent_area_id: 51,
                parent_area_title: 'Cloud',
                parent_area_slug: 'cloud',
                parent_service_line_id: 41,
                parent_service_line_title: 'Platform Engineering',
                parent_service_line_slug: 'platform-engineering',
                parent_learning_path_id: 31,
                parent_learning_path_title: 'Node.js Path',
                parent_learning_path_slug: 'nodejs-path',
                parent_stage_id: 81,
                parent_stage_title: 'Stage 1',
                parent_stage_code: 'A1',
                total_items: 7
            },
            {
                entity_type: 'skill',
                entity_id: 61,
                title: 'Node.js',
                subtitle: 'node-badge',
                image_url: null,
                meta: 'Backend skill',
                is_active: true,
                created_at: new Date('2026-05-14T10:00:00Z'),
                updated_at: new Date('2026-05-15T10:00:00Z'),
                relevance: 0.64,
                parent_badge_id: 22,
                parent_badge_title: 'Node.js Essentials',
                parent_badge_slug: 'node-essentials',
                parent_area_id: null,
                parent_area_title: null,
                parent_area_slug: null,
                parent_service_line_id: null,
                parent_service_line_title: null,
                parent_service_line_slug: null,
                parent_learning_path_id: null,
                parent_learning_path_title: null,
                parent_learning_path_slug: null,
                parent_stage_id: null,
                parent_stage_title: null,
                parent_stage_code: null,
                total_items: 7
            },
            {
                entity_type: 'language',
                entity_id: 71,
                title: 'Node-ish',
                subtitle: 'node-ish',
                image_url: null,
                meta: 'N/A',
                is_active: true,
                created_at: null,
                updated_at: null,
                relevance: 0.63,
                total_items: 7
            }
        ]);

        const res = createRes();
        await searchController.search({ query: { q: 'ana', page: '1', limit: '10' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(7);
        expect(res.body.data[0].entity_type).toBe('user');
        expect(res.body.data[4].parent_area.area_name).toBe('Cloud');
        expect(res.body.data[4].parent_service_line.service_line_name).toBe('Platform Engineering');
        expect(res.body.data[4].parent_learning_path.path_title).toBe('Node.js Path');
        expect(res.body.data[4].parent_stage.stage_code).toBe('A1');
        expect(res.body.data[5].parent_badge.badge_slug).toBe('node-essentials');
        expect(res.body.pagination.totalItems).toBe(7);
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });

    test('rejects empty search terms', async () => {
        const res = createRes();
        await searchController.search({ query: { q: '   ' } }, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.body.code).toBe('VALIDATION_DATA_ERROR');
        expect(sequelize.query).not.toHaveBeenCalled();
    });

    test('filters results by entity type', async () => {
        sequelize.query.mockResolvedValue([
            {
                entity_type: 'badge',
                entity_id: 22,
                title: 'Node.js Essentials',
                subtitle: 'node-essentials',
                image_url: null,
                meta: 'Technical',
                is_active: true,
                created_at: new Date('2026-05-18T10:00:00Z'),
                updated_at: new Date('2026-05-19T10:00:00Z'),
                relevance: 0.65,
                parent_area_id: 51,
                parent_area_title: 'Cloud',
                parent_area_slug: 'cloud',
                parent_service_line_id: 41,
                parent_service_line_title: 'Platform Engineering',
                parent_service_line_slug: 'platform-engineering',
                parent_learning_path_id: 31,
                parent_learning_path_title: 'Node.js Path',
                parent_learning_path_slug: 'nodejs-path',
                parent_stage_id: 81,
                parent_stage_title: 'Stage 1',
                parent_stage_code: 'A1',
                total_items: 1
            }
        ]);

        const res = createRes();
        await searchController.search({ query: { q: 'node', entityTypes: 'badge' } }, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].entity_type).toBe('badge');
        expect(res.body.pagination.totalItems).toBe(1);
        expect(sequelize.query).toHaveBeenCalledTimes(1);
    });
});