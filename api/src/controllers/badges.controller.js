const { models } = require('../config/db');
const { handleListRequest, invalidateCacheByPrefix } = require('../utils/listHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');

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
                    code: "BADGE_PARENT_LEVEL_NOT_FOUND"
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
            code: "BADGE_LIST_FAILED"
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
                model: models.badge_requirements,
                as: 'badge_requirements',
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
                code: "BADGE_NOT_FOUND"
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
            code: "BADGE_FETCH_FAILED"
        });
    }
};

// Helper: locate progression_stage and walk up the hierarchy chain
const resolveStageFromHierarchy = async ({ stageCode, areaSlug, slSlug, pathSlug }) => {
    const includeBlock = [
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
            where: { area_slug: areaSlug }
        };

        if (slSlug) {
            const slInclude = {
                model: models.service_lines,
                as: 'service_line',
                where: { sl_slug: slSlug }
            };

            if (pathSlug) {
                slInclude.include = [{
                    model: models.learning_paths,
                    as: 'learning_path',
                    where: { path_slug: pathSlug }
                }];
            }
            areaInclude.include = [slInclude];
        }
        includeBlock.push(areaInclude);
    }

    return models.progression_stages.findOne({ include: includeBlock });
};

const checkSlugAvailability = async (req, res) => {
    try {
        const { slug } = validations.slugQuerySchema.parse(req.query);

        const badge = await models.badges.findOne({ where: { badge_slug: slug } });

        return res.status(200).json({
            success: true,
            code: badge ? "SLUG_IN_USE" : "SLUG_AVAILABLE",
            data: {
                isAvailable: !badge
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error checking Badge slug', { error });
        return res.status(500).json({
            success: false,
            code: "SLUG_CHECK_FAILED"
        });
    }
};

// POST /api/badges
// OR
// POST /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
const createBadge = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;

        const {
            progressionStageId: bodyStageId,
            goalId,
            badgeTitle,
            badgeSlug,
            badgeType,
            badgePoints,
            expirationDurationDays,
            estimatedTimeToAcquire,
            badgeDescription,
            badgeImgUrl
        } = validations.createBadgeBodySchema.parse(req.body);

        // Resolve progression_stage (and the full hierarchy chain it implies)
        let progressionStageId = bodyStageId;
        let resolvedStage = null;

        if (stageCode) {
            resolvedStage = await resolveStageFromHierarchy({ stageCode, areaSlug, slSlug, pathSlug });

            if (!resolvedStage) {
                return res.status(404).json({
                    success: false,
                    code: "BADGE_PARENT_LEVEL_NOT_FOUND"
                });
            }
            progressionStageId = resolvedStage.progression_stage_id;
        } else if (progressionStageId) {
            resolvedStage = await models.progression_stages.findOne({
                where: { progression_stage_id: progressionStageId },
                include: [{
                    model: models.areas,
                    as: 'area',
                    include: [{
                        model: models.service_lines,
                        as: 'service_line'
                    }]
                }]
            });

            if (!resolvedStage) {
                return res.status(404).json({
                    success: false,
                    code: "BADGE_STAGE_NOT_FOUND"
                });
            }
        }

        if (!resolvedStage) {
            return res.status(400).json({
                success: false,
                code: "BADGE_STAGE_ID_REQUIRED"
            });
        }

        const areaRow = resolvedStage.area;
        const slRow = areaRow?.service_line;
        if (!areaRow || !slRow) {
            return res.status(400).json({
                success: false,
                code: "BADGE_PARENT_HIERARCHY_MISSING"
            });
        }

        // Determine and ensure unique slug
        const textToSlugify = badgeSlug ? badgeSlug : badgeTitle;
        const finalUniqueSlug = await generateUniqueSlug(models.badges, 'badge_slug', textToSlugify);

        // Handle Image Upload
        let finalImgUrl = badgeImgUrl;
        if (badgeImgUrl && badgeImgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'badges',
                badgeImgUrl,
                finalUniqueSlug
            );
        }

        const newBadge = await models.badges.create({
            progression_stage_id: progressionStageId,
            area_id: areaRow.area_id,
            service_line_id: slRow.service_line_id,
            learning_path_id: slRow.learning_path_id,
            goal_id: goalId || null,
            badge_title: badgeTitle,
            badge_slug: finalUniqueSlug,
            badge_type: badgeType,
            badge_points: badgePoints,
            expiration_duration_days: expirationDurationDays ?? null,
            estimated_time_to_acquire: estimatedTimeToAcquire || null,
            badge_description: badgeDescription || null,
            badge_img_url: finalImgUrl || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('badges:list');

        return res.status(201).json({
            success: true,
            code: "BADGE_CREATED",
            data: newBadge
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error creating Badge', { error });
        return res.status(500).json({
            success: false,
            code: "BADGE_CREATE_FAILED"
        });
    }
};

// Helper: locate a badge by slug, optionally enforcing the hierarchy chain
const findBadgeInHierarchy = async ({ badgeSlug, stageCode, areaSlug, slSlug, pathSlug }) => {
    const includeBlock = [];

    if (stageCode) {
        const stageInclude = {
            model: models.progression_stages,
            as: 'progression_stage',
            include: [{
                model: models.stage_codes,
                as: 'stage_code',
                where: { stage_code: stageCode }
            }]
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
            stageInclude.include.push(areaInclude);
        }
        includeBlock.push(stageInclude);
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

    return models.badges.findOne({
        where: { badge_slug: badgeSlug },
        include: includeBlock
    });
};

// PUT /api/badges/:badgeSlug
// OR nested route equivalents
const updateBadge = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;

        const { badgeSlug: currentSlug } = validations.badgeSlugParamSchema.parse(req.params);

        const {
            progressionStageId,
            goalId,
            badgeTitle,
            badgeSlug: manualNewSlug,
            badgeType,
            badgePoints,
            expirationDurationDays,
            estimatedTimeToAcquire,
            badgeDescription,
            badgeImgUrl,
            isActive
        } = validations.updateBadgeBodySchema.parse(req.body);

        const badge = await findBadgeInHierarchy({
            badgeSlug: currentSlug,
            stageCode, areaSlug, slSlug, pathSlug
        });

        if (!badge) {
            return res.status(404).json({
                success: false,
                code: "BADGE_NOT_FOUND"
            });
        }

        let finalNewSlug = badge.badge_slug;
        if ((badgeTitle && badgeTitle !== badge.badge_title) || manualNewSlug) {
            const textToSlugify = manualNewSlug ? manualNewSlug : badgeTitle;
            finalNewSlug = await generateUniqueSlug(
                models.badges,
                'badge_slug',
                textToSlugify,
                badge.badge_id,
                'badge_id'
            );
        }

        let finalImgUrl = badgeImgUrl !== undefined ? badgeImgUrl : badge.badge_img_url;
        if (badgeImgUrl && badgeImgUrl.includes('/temp/')) {
            finalImgUrl = await moveStructureImageToPermanent(
                'badges',
                badgeImgUrl,
                finalNewSlug
            );
        }

        // If reassigning to a new progression stage, also resync the denormalized parent IDs
        let nextStageId = badge.progression_stage_id;
        let nextAreaId = badge.area_id;
        let nextSlId = badge.service_line_id;
        let nextLpId = badge.learning_path_id;

        if (progressionStageId !== undefined && progressionStageId !== badge.progression_stage_id) {
            const newStage = await models.progression_stages.findOne({
                where: { progression_stage_id: progressionStageId },
                include: [{
                    model: models.areas,
                    as: 'area',
                    include: [{
                        model: models.service_lines,
                        as: 'service_line'
                    }]
                }]
            });

            if (!newStage || !newStage.area || !newStage.area.service_line) {
                return res.status(404).json({
                    success: false,
                    code: "BADGE_TARGET_STAGE_NOT_FOUND"
                });
            }

            nextStageId = newStage.progression_stage_id;
            nextAreaId = newStage.area.area_id;
            nextSlId = newStage.area.service_line.service_line_id;
            nextLpId = newStage.area.service_line.learning_path_id;
        }

        await badge.update({
            progression_stage_id: nextStageId,
            area_id: nextAreaId,
            service_line_id: nextSlId,
            learning_path_id: nextLpId,
            goal_id: goalId !== undefined ? goalId : badge.goal_id,
            badge_title: badgeTitle !== undefined ? badgeTitle : badge.badge_title,
            badge_slug: finalNewSlug,
            badge_type: badgeType !== undefined ? badgeType : badge.badge_type,
            badge_points: badgePoints !== undefined ? badgePoints : badge.badge_points,
            expiration_duration_days: expirationDurationDays !== undefined ? expirationDurationDays : badge.expiration_duration_days,
            estimated_time_to_acquire: estimatedTimeToAcquire !== undefined ? estimatedTimeToAcquire : badge.estimated_time_to_acquire,
            badge_description: badgeDescription !== undefined ? badgeDescription : badge.badge_description,
            badge_img_url: finalImgUrl,
            is_active: isActive !== undefined ? isActive : badge.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('badges:list');

        return res.status(200).json({
            success: true,
            code: "BADGE_UPDATED",
            data: badge
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

        logger.error('Error updating Badge', { error });
        return res.status(500).json({
            success: false,
            code: "BADGE_UPDATE_FAILED"
        });
    }
};

// DELETE /api/badges/:badgeSlug
// OR nested route equivalents
const deleteBadge = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;

        const { badgeSlug } = validations.badgeSlugParamSchema.parse(req.params);

        const badge = await findBadgeInHierarchy({
            badgeSlug, stageCode, areaSlug, slSlug, pathSlug
        });

        if (!badge) {
            return res.status(404).json({
                success: false,
                code: "BADGE_NOT_FOUND"
            });
        }

        if (!badge.is_active) {
            return res.status(400).json({
                success: false,
                code: "BADGE_ALREADY_INACTIVE"
            });
        }

        await badge.update({
            is_active: false,
            updated_by: userId
        });

        await invalidateCacheByPrefix('badges:list');

        return res.status(200).json({
            success: true,
            code: "BADGE_DEACTIVATED"
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_URL_PARAM"
            });
        }

        logger.error('Error deleting Badge', { error });
        return res.status(500).json({
            success: false,
            code: "BADGE_DELETE_FAILED"
        });
    }
};

module.exports = {
    getBadges,
    getBadgeBySlug,
    checkSlugAvailability,
    createBadge,
    updateBadge,
    deleteBadge
};
