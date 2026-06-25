const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const validations = require('../validations/ranking.validation');
const { handleZodError } = require('../utils/responseHelper');
const statsService = require('../services/statistics.service');

/*──────────────────────────────────────────────────────────────
  A Service Line Leader may only see the ranking of consultants
  within their own Service Line, so we ignore any client-supplied
  serviceLineId and force their registered SL server-side. An SLL
  with no SL configured gets an impossible id (empty leaderboard).
  Consultants / Talent Managers / Administrators keep the requested
  (possibly null/global) scope.
──────────────────────────────────────────────────────────────*/
const scopeServiceLineId = async (req, requested) => {
    if (req.user.role !== 'Service Line Leader') return requested ?? null;
    const slId = await statsService.resolveServiceLineForUser(req.user.sub, 'Service Line Leader');
    return slId ?? -1;
};

const getRanking = async (req, res) => {
    try {
        // Validations
        const validation = validations.rankingQuerySchema.parse(req.query);
        const { page, limit, learningPathId, areaId } = validation;
        const serviceLineId = await scopeServiceLineId(req, validation.serviceLineId);

        let results;
        try {
            [results] = await sequelize.query(
                `SELECT * FROM get_ranking(:page, :limit, :learningPathId, :serviceLineId, :areaId)`,
                {
                    replacements: {
                        page,
                        limit,
                        learningPathId: learningPathId ?? null,
                        serviceLineId: serviceLineId ?? null,
                        areaId: areaId ?? null
                    }
                }
            );
        } catch (error) {
            logger.warn('Stored function get_ranking unavailable; using SQL fallback ranking query', {
                error: error.message
            });

            const filters = {
                learningPathId: learningPathId ?? null,
                serviceLineId: serviceLineId ?? null,
                areaId: areaId ?? null,
                limit,
                offset: (page - 1) * limit
            };

            const fallbackRows = await sequelize.query(
                `SELECT
                    u.user_guid,
                    u.full_name,
                    u.username,
                    u.profile_img_url,
                    COALESCE(SUM(ph.points_delta), 0) AS total_points,
                    (
                        SELECT COUNT(ab.awarded_badges_id)
                        FROM awarded_badges ab
                        JOIN badge_applications ba ON ab.application_id = ba.application_id
                        WHERE ab.user_id = c.user_id
                    ) AS total_badges,
                    (
                        SELECT a.area_name
                        FROM consultant_areas ca
                        JOIN areas a ON a.area_id = ca.area_id
                        WHERE ca.user_id = c.user_id AND ca.is_primary = TRUE
                        LIMIT 1
                    ) AS primary_area_name
                 FROM consultants c
                 INNER JOIN users u ON u.user_id = c.user_id
                 LEFT JOIN points_history ph ON ph.user_id = c.user_id
                 WHERE u.is_active = TRUE
                    AND (:areaId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        WHERE ca.user_id = c.user_id
                          AND ca.area_id = :areaId
                    ))
                    AND (:serviceLineId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        INNER JOIN areas a ON a.area_id = ca.area_id
                        WHERE ca.user_id = c.user_id
                          AND a.service_line_id = :serviceLineId
                    ))
                    AND (:learningPathId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        INNER JOIN areas a ON a.area_id = ca.area_id
                        INNER JOIN service_lines sl ON sl.service_line_id = a.service_line_id
                        WHERE ca.user_id = c.user_id
                          AND sl.learning_path_id = :learningPathId
                    ))
                 GROUP BY u.user_guid, u.full_name, u.username, u.profile_img_url, c.user_id
                 ORDER BY total_points DESC, u.user_guid ASC
                 LIMIT :limit OFFSET :offset`,
                {
                    replacements: filters,
                    type: QueryTypes.SELECT
                }
            );

            const countRows = await sequelize.query(
                `SELECT COUNT(*) AS total_count
                 FROM consultants c
                 INNER JOIN users u ON u.user_id = c.user_id
                 WHERE u.is_active = TRUE
                    AND (:areaId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        WHERE ca.user_id = c.user_id
                          AND ca.area_id = :areaId
                    ))
                    AND (:serviceLineId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        INNER JOIN areas a ON a.area_id = ca.area_id
                        WHERE ca.user_id = c.user_id
                          AND a.service_line_id = :serviceLineId
                    ))
                    AND (:learningPathId IS NULL OR EXISTS (
                        SELECT 1
                        FROM consultant_areas ca
                        INNER JOIN areas a ON a.area_id = ca.area_id
                        INNER JOIN service_lines sl ON sl.service_line_id = a.service_line_id
                        WHERE ca.user_id = c.user_id
                          AND sl.learning_path_id = :learningPathId
                    ))`,
                {
                    replacements: filters,
                    type: QueryTypes.SELECT
                }
            );

            const totalCount = Number(countRows[0]?.total_count || 0);
            results = fallbackRows.map((row) => ({
                ...row,
                total_count: totalCount
            }));
        }

        const count = results.length > 0 ? parseInt(results[0].total_count, 10) : 0;
        const totalPages = Math.ceil(count / limit);

        // Block non existing pages
        if (page > totalPages && count > 0) {
            return res.status(404).json({
                success: false,
                code: "PAGINATION_PAGE_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            data: results,
            pagination: {
                totalItems: count,
                totalPages: totalPages,
                currentPage: page,
                limit: limit
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');

        logger.error('Error fetching consultant ranking', { error });
        return res.status(500).json({
            success: false,
            code: "LIST_FETCH_FAILED"
        });
    }
};

const getMyPosition = async (req, res) => {
    try {
        const validation = validations.myPositionQuerySchema.parse(req.query);
        const { limit, learningPathId, areaId } = validation;
        const serviceLineId = await scopeServiceLineId(req, validation.serviceLineId);
        const userId = req.user.sub;

        const filters = {
            learningPathId: learningPathId ?? null,
            serviceLineId: serviceLineId ?? null,
            areaId: areaId ?? null,
            userId
        };

        const rows = await sequelize.query(
            `WITH computed AS (
                SELECT
                    u.user_id,
                    COALESCE((
                        SELECT SUM(ph.points_delta)
                        FROM points_history ph
                        LEFT JOIN badge_requirements br ON ph.requirement_id = br.requirement_id
                        LEFT JOIN badges b ON (ph.badge_id = b.badge_id OR br.badge_id = b.badge_id)
                        WHERE ph.user_id = u.user_id
                          AND (:learningPathId IS NULL OR b.learning_path_id = :learningPathId)
                          AND (:serviceLineId  IS NULL OR b.service_line_id  = :serviceLineId)
                          AND (:areaId          IS NULL OR b.area_id          = :areaId)
                    ), 0) AS total_points,
                    (
                        SELECT COUNT(ab.awarded_badges_id)
                        FROM awarded_badges ab
                        JOIN badge_applications ba ON ab.application_id = ba.application_id
                        JOIN badges b ON ba.badge_id = b.badge_id
                        WHERE ab.user_id = u.user_id
                          AND (:learningPathId IS NULL OR b.learning_path_id = :learningPathId)
                          AND (:serviceLineId  IS NULL OR b.service_line_id  = :serviceLineId)
                          AND (:areaId          IS NULL OR b.area_id          = :areaId)
                    ) AS total_badges,
                    u.full_name
                FROM users u
                WHERE u.user_role = 'Consultant'
                  AND u.is_active = TRUE
            ),
            ranked AS (
                SELECT
                    user_id,
                    ROW_NUMBER() OVER (
                        ORDER BY total_points DESC, total_badges DESC, full_name ASC
                    ) AS position
                FROM computed
            )
            SELECT position FROM ranked WHERE user_id = :userId`,
            {
                replacements: filters,
                type: QueryTypes.SELECT
            }
        );

        if (!rows.length) {
            return res.status(404).json({
                success: false,
                code: "RANKING_USER_NOT_FOUND"
            });
        }

        const position = Number(rows[0].position);
        const page = Math.ceil(position / limit);

        return res.status(200).json({
            success: true,
            data: { position, page }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');

        logger.error('Error fetching user ranking position', { error });
        return res.status(500).json({
            success: false,
            code: "RANKING_POSITION_FETCH_FAILED"
        });
    }
};

module.exports = {
    getRanking,
    getMyPosition
};
