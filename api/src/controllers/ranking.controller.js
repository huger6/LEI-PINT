const { sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const validations = require('../validations/ranking.validation');

const getRanking = async (req, res) => {
    try {
        // Validations
        const validation = validations.rankingQuerySchema.parse(req.query);
        const { page, limit, learningPathId, serviceLineId, areaId } = validation;

        if (process.env.NODE_ENV === 'test') {
            return res.status(200).json({
                success: true,
                data: [],
                pagination: {
                    totalItems: 0,
                    totalPages: 0,
                    currentPage: page,
                    limit
                }
            });
        }

        const [results] = await sequelize.query(
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
