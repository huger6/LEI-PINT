const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const validations = require('../validations/ranking.validation');

const getRanking = async (req, res) => {
    try {
        // Validations
        const validation = validations.rankingQuerySchema.parse(req.query);
        const { page, limit, learningPathId, serviceLineId, areaId } = validation;
        const offset = (page - 1) * limit;

        // Build query (SQL injection safe)
        let filterQuery = '';
        if (learningPathId) filterQuery += ` AND b.learning_path_id = ${sequelize.escape(learningPathId)}`;
        if (serviceLineId) filterQuery += ` AND b.service_line_id = ${sequelize.escape(serviceLineId)}`;
        if (areaId) filterQuery += ` AND b.area_id = ${sequelize.escape(areaId)}`;

        // Subquery 1: points
        const pointsSubquery = `(
            SELECT COALESCE(SUM(ph.points_delta), 0)
            FROM points_history ph
            LEFT JOIN badge_requirements br ON ph.requirement_id = br.requirement_id
            LEFT JOIN badges b ON (ph.badge_id = b.badge_id OR br.badge_id = b.badge_id)
            WHERE ph.user_id = "users"."user_id" ${filterQuery}
        )`;

        // Subquery 2: badges
        const badgesSubquery = `(
            SELECT COUNT(ab.awarded_badges_id)
            FROM awarded_badges ab
            JOIN badge_applications ba ON ab.application_id = ba.application_id
            JOIN badges b ON ba.badge_id = b.badge_id
            WHERE ab.user_id = "users"."user_id" ${filterQuery}
        )`;

        // Main query
        const { count, rows } = await models.users.findAndCountAll({
            where: {
                user_role: 'Consultant',
                is_active: true
            },
            attributes: [
                'user_id',
                'user_guid',
                'full_name',
                'profile_img_url',
                [sequelize.literal(pointsSubquery), 'total_points'],
                [sequelize.literal(badgesSubquery), 'total_badges']
            ],
            order: [
                [sequelize.literal('total_points'), 'DESC'],
                // Equal points gets decided by most badges
                [sequelize.literal('total_badges'), 'DESC'],
                // Equal badges gets decided by name
                ['full_name', 'ASC']
            ],
            limit,
            offset,
            subQuery: false
        });

        const totalPages = Math.ceil(count / limit);

        // Block non existing pages
        if (page > totalPages && count > 0) {
            return res.status(404).json({
                success: false,
                message: "Page not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: rows,
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
                message: "Invalid query parameters.",
                errors: error.errors
            });
        }

        logger.error('Error fetching consultant ranking', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
        });
    }
};

module.exports = {
    getRanking
};