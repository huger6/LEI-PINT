const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const validations = require('../validations/ranking.validation');

const getRanking = async (req, res) => {
    try {
        // Validations
        const validation = validations.rankingQuerySchema.parse(req.query);
        const { page, limit, learningPathId, serviceLineId, areaId } = validation;

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
                    u.user_id,
                    u.full_name,
                    u.username,
                    u.profile_img_url,
                    COALESCE(SUM(ph.points_delta), 0) AS total_points
                 FROM consultants c
                 INNER JOIN users u ON u.user_id = c.user_id
                 LEFT JOIN points_history ph ON ph.user_id = c.user_id
                 WHERE
                    (:areaId IS NULL OR EXISTS (
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
                 GROUP BY u.user_id, u.full_name, u.username, u.profile_img_url
                 ORDER BY total_points DESC, u.user_id ASC
                 LIMIT :limit OFFSET :offset`,
                {
                    replacements: filters,
                    type: QueryTypes.SELECT
                }
            );

            const countRows = await sequelize.query(
                `SELECT COUNT(*) AS total_count
                 FROM consultants c
                 WHERE
                    (:areaId IS NULL OR EXISTS (
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
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_QUERY_PARAMS",
                errors: error.errors
            });
        }

        logger.error('Error fetching consultant ranking', { error });
        return res.status(500).json({
            success: false,
            code: "LIST_FETCH_FAILED"
        });
    }
};

module.exports = {
    getRanking
};
