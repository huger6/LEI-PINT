const { QueryTypes } = require('sequelize');

const { sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const { searchQuerySchema } = require('../validations/search.validation');
const { handleZodError } = require('../utils/responseHelper');

const buildEntityTypesFilter = (entityTypes) => {
    if (!Array.isArray(entityTypes) || entityTypes.length === 0) {
        return '';
    }

    const list = entityTypes.map((value) => `'${value}'`).join(', ');
    return ` WHERE entity_type IN (${list})`;
};

const buildSearchSql = (entityTypes) => `
    WITH search_results AS (
        SELECT
            'user'::text AS entity_type,
            u.user_id AS entity_id,
            u.full_name AS title,
            u.username AS subtitle,
            u.profile_img_url AS image_url,
            u.user_role AS meta,
            u.is_active,
            u.created_at,
            u.updated_at,
            similarity(u.full_name, :q) AS relevance
        FROM users u
        WHERE u.is_active = true
                    AND (u.full_name ILIKE :likeQuery OR u.username ILIKE :likeQuery OR u.email_address ILIKE :likeQuery)

        UNION ALL

        SELECT
            'badge'::text AS entity_type,
            b.badge_id AS entity_id,
            b.badge_title AS title,
            b.badge_slug AS subtitle,
            b.badge_img_url AS image_url,
            b.badge_type AS meta,
            b.is_active,
            b.created_at,
            b.updated_at,
                similarity(b.badge_title, :q) AS relevance,
                a.area_id AS parent_area_id,
                a.area_name AS parent_area_title,
                a.area_slug AS parent_area_slug,
                sl.service_line_id AS parent_service_line_id,
                sl.service_line_name AS parent_service_line_title,
                sl.sl_slug AS parent_service_line_slug,
                lp.learning_path_id AS parent_learning_path_id,
                lp.path_title AS parent_learning_path_title,
                lp.path_slug AS parent_learning_path_slug,
                ps.progression_stage_id AS parent_stage_id,
                ps.stage_title AS parent_stage_title,
                sc.stage_code AS parent_stage_code
        FROM badges b
            INNER JOIN areas a ON a.area_id = b.area_id
            INNER JOIN service_lines sl ON sl.service_line_id = b.service_line_id
            INNER JOIN learning_paths lp ON lp.learning_path_id = b.learning_path_id
            INNER JOIN progression_stages ps ON ps.progression_stage_id = b.progression_stage_id
            INNER JOIN stage_codes sc ON sc.stage_code_id = ps.stage_code_id
        WHERE b.is_active = true
                    AND (b.badge_title ILIKE :likeQuery OR b.badge_slug ILIKE :likeQuery OR b.badge_type ILIKE :likeQuery OR COALESCE(b.badge_description, '') ILIKE :likeQuery)

                UNION ALL

                SELECT
                        'learning_path'::text AS entity_type,
                        lp.learning_path_id AS entity_id,
                        lp.path_title AS title,
                        lp.path_slug AS subtitle,
                        lp.img_url AS image_url,
                        lp.path_description AS meta,
                        lp.is_active,
                        lp.created_at,
                        lp.updated_at,
                        similarity(lp.path_title, :q) AS relevance
                FROM learning_paths lp
                WHERE lp.is_active = true
                    AND (lp.path_title ILIKE :likeQuery OR lp.path_slug ILIKE :likeQuery OR COALESCE(lp.path_description, '') ILIKE :likeQuery)

                UNION ALL

                SELECT
                        'service_line'::text AS entity_type,
                        sl.service_line_id AS entity_id,
                        sl.service_line_name AS title,
                        sl.sl_slug AS subtitle,
                        sl.img_url AS image_url,
                        sl.service_line_description AS meta,
                        sl.is_active,
                        sl.created_at,
                        sl.updated_at,
                        similarity(sl.service_line_name, :q) AS relevance
                FROM service_lines sl
                WHERE sl.is_active = true
                    AND (sl.service_line_name ILIKE :likeQuery OR sl.sl_slug ILIKE :likeQuery OR COALESCE(sl.service_line_description, '') ILIKE :likeQuery)

                UNION ALL

                SELECT
                        'area'::text AS entity_type,
                        a.area_id AS entity_id,
                        a.area_name AS title,
                        a.area_slug AS subtitle,
                        a.img_url AS image_url,
                        a.area_description AS meta,
                        a.is_active,
                        a.created_at,
                        a.updated_at,
                        similarity(a.area_name, :q) AS relevance
                FROM areas a
                WHERE a.is_active = true
                    AND (a.area_name ILIKE :likeQuery OR a.area_slug ILIKE :likeQuery OR COALESCE(a.area_description, '') ILIKE :likeQuery)

                UNION ALL

                SELECT
                        'stage'::text AS entity_type,
                        ps.progression_stage_id AS entity_id,
                        ps.stage_title AS title,
                        sc.stage_code AS subtitle,
                        NULL::text AS image_url,
                        ps.stage_description AS meta,
                        ps.is_active,
                        ps.created_at,
                        ps.updated_at,
                        similarity(ps.stage_title, :q) AS relevance
                FROM progression_stages ps
                INNER JOIN stage_codes sc ON sc.stage_code_id = ps.stage_code_id
                WHERE ps.is_active = true
                    AND (ps.stage_title ILIKE :likeQuery OR sc.stage_code ILIKE :likeQuery OR COALESCE(ps.stage_description, '') ILIKE :likeQuery)

                UNION ALL

                SELECT
                        'skill'::text AS entity_type,
                        s.skills_id AS entity_id,
                        s.skill_name AS title,
                        COALESCE(b.badge_slug, '') AS subtitle,
                        b.badge_img_url AS image_url,
                        s.skill_description AS meta,
                        true AS is_active,
                        s.created_at,
                        s.updated_at,
                    similarity(s.skill_name, :q) AS relevance,
                    b.badge_id AS parent_badge_id,
                    b.badge_title AS parent_badge_title,
                    b.badge_slug AS parent_badge_slug
                FROM skills s
                LEFT JOIN badges b ON b.badge_id = s.badge_id
                WHERE s.skill_name ILIKE :likeQuery OR COALESCE(s.skill_description, '') ILIKE :likeQuery

                UNION ALL

                SELECT
                        'language'::text AS entity_type,
                        l.language_id AS entity_id,
                        l.language_name AS title,
                        l.language_iso AS subtitle,
                        NULL::text AS image_url,
                        l.language_iso AS meta,
                        true AS is_active,
                        NULL::timestamptz AS created_at,
                        NULL::timestamptz AS updated_at,
                        similarity(l.language_name, :q) AS relevance
                FROM languages l
                WHERE l.language_name ILIKE :likeQuery OR l.language_iso ILIKE :likeQuery

                UNION ALL

                SELECT
                        'location'::text AS entity_type,
                        loc.location_id AS entity_id,
                        loc.location_name AS title,
                        NULL::text AS subtitle,
                        NULL::text AS image_url,
                        NULL::text AS meta,
                        true AS is_active,
                        NULL::timestamptz AS created_at,
                        NULL::timestamptz AS updated_at,
                        similarity(loc.location_name, :q) AS relevance
                FROM locations loc
                WHERE loc.location_name ILIKE :likeQuery
    )
    SELECT
        entity_type,
        entity_id,
        title,
        subtitle,
        image_url,
        meta,
        is_active,
        created_at,
        updated_at,
        relevance,
        COUNT(*) OVER()::int AS total_items
    FROM search_results
    ${buildEntityTypesFilter(entityTypes)}
    ORDER BY relevance DESC, title ASC, entity_type ASC
    LIMIT :limit
    OFFSET :offset
`;

const search = async (req, res) => {
    try {
        const { q, entityTypes, page, limit } = searchQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;
        const rows = await sequelize.query(buildSearchSql(entityTypes), {
            replacements: {
                q,
                likeQuery: `%${q}%`,
                limit,
                offset
            },
            type: QueryTypes.SELECT
        });

        const totalItems = rows.length > 0 ? Number(rows[0].total_items) : 0;
        const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);

        return res.status(200).json({
            success: true,
            data: rows.map((row) => ({
                entity_type: row.entity_type,
                entity_id: row.entity_id,
                title: row.title,
                subtitle: row.subtitle,
                image_url: row.image_url,
                meta: row.meta,
                is_active: row.is_active,
                created_at: row.created_at,
                updated_at: row.updated_at,
                relevance: row.relevance,
                parent_area: row.parent_area_id ? {
                    area_id: row.parent_area_id,
                    area_name: row.parent_area_title,
                    area_slug: row.parent_area_slug
                } : null,
                parent_service_line: row.parent_service_line_id ? {
                    service_line_id: row.parent_service_line_id,
                    service_line_name: row.parent_service_line_title,
                    sl_slug: row.parent_service_line_slug
                } : null,
                parent_learning_path: row.parent_learning_path_id ? {
                    learning_path_id: row.parent_learning_path_id,
                    path_title: row.parent_learning_path_title,
                    path_slug: row.parent_learning_path_slug
                } : null,
                parent_stage: row.parent_stage_id ? {
                    progression_stage_id: row.parent_stage_id,
                    stage_title: row.parent_stage_title,
                    stage_code: row.parent_stage_code
                } : null,
                parent_badge: row.parent_badge_id ? {
                    badge_id: row.parent_badge_id,
                    badge_title: row.parent_badge_title,
                    badge_slug: row.parent_badge_slug
                } : null
            })),
            pagination: {
                totalItems,
                totalPages,
                currentPage: page,
                limit
            }
        });
    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_DATA_ERROR');

        logger.error('Error performing global search', { error });
        return res.status(500).json({ success: false, code: 'SEARCH_FAILED' });
    }
};

module.exports = {
    search
};