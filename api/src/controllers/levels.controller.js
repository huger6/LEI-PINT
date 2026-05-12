const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');

// GET /api/levels
// OR 
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels
const getLevels = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug } = req.params;
        let cachePrefix = 'levels:list:all';

        if (areaSlug) {
            const includeBlock = [];

            if (slSlug) {
                const slInclude = {
                    model: models.service_lines,
                    as: 'service_line',
                    where: { sl_slug: slSlug },
                    attributes: []
                };

                if (pathSlug) {
                    slInclude.include = [{
                        model: models.learning_paths,
                        as: 'learning_path',
                        where: { path_slug: pathSlug },
                        attributes: []
                    }];
                }
                includeBlock.push(slInclude);
            }

            // Get area ID
            const area = await models.areas.findOne({
                where: { area_slug: areaSlug },
                include: includeBlock,
                attributes: ['area_id']
            });

            if (!area) {
                return res.status(404).json({
                    success: false,
                    message: "Parent Area not found."
                });
            }

            req.query.area_id = area.area_id;
            cachePrefix = `levels:list:area:${areaSlug}`;
        }

        return handleListRequest({
            req, res,
            schema: validations.getLevelsQuerySchema,
            modelName: 'progression_stages',
            cachePrefix: cachePrefix,
            order: [['stage_sequence', 'ASC']]
        });

    } catch (error) {
        logger.error('Error listing Levels', { error });
        return res.status(500).json({
            success: false,
            message: "Error listing Levels."
        });
    }
};

// GET /api/levels/:stageCode
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode
const getLevelByCode = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        // JOIN stage_codes to filter
        const includeBlock = [
            {
                model: models.stage_codes,
                as: 'stage_code',
                where: { stage_code: stageCode }
            }
        ];

        // /api/levels/:stageCode
        if (!areaSlug) {
            return handleListRequest({
                req, res,
                schema: validations.getLevelsQuerySchema,
                modelName: 'progression_stages',
                cachePrefix: `levels:list:code:${stageCode}`,
                include: includeBlock,
                order: [['stage_sequence', 'ASC']]
            });
        }

        // /api/.../areas/.../levels/:stageCode
        const areaInclude = {
            model: models.areas,
            as: 'area',
            where: { area_slug: areaSlug },
            attributes: []
        };

        if (slSlug) {
            const slInclude = {
                model: models.service_lines,
                as: 'service_line',
                where: { sl_slug: slSlug },
                attributes: []
            };

            if (pathSlug) {
                slInclude.include = [{
                    model: models.learning_paths,
                    as: 'learning_path',
                    where: { path_slug: pathSlug },
                    attributes: []
                }];
            }
            areaInclude.include = [slInclude];
        }
        includeBlock.push(areaInclude);

        const excludeFields = isAdmin ? [] : ["created_by", "updated_by"];

        const level = await models.progression_stages.findOne({
            include: includeBlock,
            attributes: { exclude: excludeFields }
        });

        if (!level) {
            return res.status(404).json({
                success: false,
                message: "Level not found or does not belong to this hierarchy."
            });
        }

        return res.status(200).json({
            success: true,
            data: level
        });

    } catch (error) {
        logger.error('Error fetching Level', { error });
        return res.status(500).json({
            success: false,
            message: "Error fetching Level."
        });
    }
};

module.exports = {
    getLevels,
    getLevelByCode
}