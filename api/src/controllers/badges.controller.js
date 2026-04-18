const { models } = require('../config/db');
const { handleListRequest } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');

// GET /api/badges
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
const getBadges = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;
        let cachePrefix = 'badges:list:all';

        // If called through level
        if (stageCode) {
            const stageIncludeBlock = [
                {
                    model: models.stage_codes,
                    as: 'stage_code',
                    where: { stage_code: stageCode }
                }
            ];

            if (areaSlug) {
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
                stageIncludeBlock.push(areaInclude);
            }

            // Get level's ID
            const level = await models.progression_stages.findOne({
                include: stageIncludeBlock,
                attributes: ['progression_stage_id']
            });

            if (!level) {
                return res.status(404).json({
                    success: false,
                    message: "Parent Level not found or does not belong to this Area."
                });
            }

            // Inject ID for Zod to recognize
            req.query.progressionStageId = level.progression_stage_id;
            cachePrefix = `badges:list:level:${stageCode}:area:${areaSlug || 'all'}`;

        } else if (areaSlug) {
            // Area specific badges (no level mentioned)
            const area = await models.areas.findOne({
                where: { area_slug: areaSlug },
                attributes: ['area_id']
            });

            if (area) req.query.areaId = area.area_id;
            cachePrefix = `badges:list:area:${areaSlug}`;
        } else if (slSlug) {
            const sl = await models.service_lines.findOne({
                where: { sl_slug: slSlug },
                attributes: ['service_line_id']
            });

            if (sl) req.query.serviceLineId = sl.service_line_id;
            cachePrefix = `badges:list:sl:${slSlug}`;
        }

        return handleListRequest({
            req, res,
            schema: validations.getBadgesQuerySchema,
            modelName: 'badges',
            cachePrefix: cachePrefix,
            order: [['badge_points', 'DESC']]
        });

    } catch (error) {
        logger.error('Error listing Badges', { error });
        return res.status(500).json({
            success: false,
            message: "Error listing Badges."
        });
    }
};

// GET /api/badges/:badgeSlug
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges/:badgeSlug
const getBadgeBySlug = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug, stageCode, badgeSlug } = req.params;
        const isAdmin = req.user?.role === 'Administrator';

        const whereClause = {
            badge_slug: badgeSlug,
            ...(isAdmin ? {} : { is_active: true })
        };

        const includeBlock = [
            {
                model: models.requirements,
                as: 'requirements',
                attributes: { exclude: isAdmin ? [] : ["is_active", "created_by", "updated_by"] }
            }
        ];

        if (stageCode) {
            const levelInclude = {
                model: models.progression_stages,
                as: 'progression_stage',
                include: [
                    {
                        model: models.stage_codes,
                        as: 'stage_code',
                        where: { stage_code: stageCode }
                    }
                ]
            };

            if (areaSlug) {
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

                levelInclude.include.push(areaInclude);
            }

            includeBlock.push(levelInclude);
        } else if (areaSlug) {
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
        } else if (slSlug) {
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

        const excludeFields = isAdmin ? [] : ["is_active", "created_by", "updated_by"];

        const badge = await models.badges.findOne({
            where: whereClause,
            include: includeBlock,
            attributes: { exclude: excludeFields }
        });

        if (!badge) {
            return res.status(404).json({
                success: false,
                message: "Badge not found or does not belong to this hierarchy."
            });
        }

        return res.status(200).json({
            success: true,
            data: badge
        });

    } catch (error) {
        logger.error('Error fetching Badge', { error });
        return res.status(500).json({
            success: false,
            message: "Error fetching Badge."
        });
    }
};

module.exports = {
    getBadges,
    getBadgeBySlug
};