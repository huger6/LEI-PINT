const { models } = require('../config/db');
const { literal, Op } = require('sequelize');
const { invalidateCacheByPrefix } = require('../utils/listHelper');
const redis = require('../config/redis');
const { handleCachedCountRequest } = require('../utils/countHelper');
const { logger } = require('../utils/logger');
const validations = require('../validations/structure.validation');
const { handleZodError } = require('../utils/responseHelper');
const { generateUniqueSlug } = require('../utils/slugHelper');
const { moveStructureImageToPermanent } = require('../services/storage.service');
const { sendTopicUpdate } = require('../services/firebase.service');

// GET /api/badges
// OR
// GET /api/learning-paths/:pathSlug/service-lines/:slSlug/areas/:areaSlug/levels/:stageCode/badges
const getBadges = async (req, res) => {
    try {
        const { pathSlug, slSlug, areaSlug, stageCode } = req.params;
        let baseWhere = {};
        const isAdmin = req.user?.role === 'Administrator';

        const {
            page,
            limit,
            search,
            minPoints,
            maxPoints,
            badgeClass,
            stageCodes,
            expiringOnly,
            areaId,
            serviceLineId,
            learningPathId,
            progressionStageId
        } = validations.getBadgesQuerySchema.parse(req.query);

        const offset = (page - 1) * limit;

        // If called through level
        if (stageCode) {
            const isNumeric = /^\d+$/.test(stageCode);
            const stageIncludeBlock = [
                {
                    model: models.stage_codes,
                    as: 'stage_code',
                    ...(isNumeric ? {} : { where: { stage_code: stageCode } })
                }
            ];

            const levelWhere = isNumeric ? { progression_stage_id: parseInt(stageCode, 10) } : {};

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
                where: levelWhere,
                include: stageIncludeBlock,
                attributes: ['progression_stage_id']
            });

            if (!level) {
                return res.status(404).json({
                    success: false,
                    code: "BADGE_PARENT_LEVEL_NOT_FOUND"
                });
            }

            baseWhere = { progression_stage_id: level.progression_stage_id };

        } else if (areaSlug) {
            // Area specific badges (no level mentioned)
            const area = await models.areas.findOne({
                where: { area_slug: areaSlug },
                attributes: ['area_id']
            });

            if (area) baseWhere = { area_id: area.area_id };
        } else if (slSlug) {
            const sl = await models.service_lines.findOne({
                where: { sl_slug: slSlug },
                attributes: ['service_line_id']
            });

            if (sl) baseWhere = { service_line_id: sl.service_line_id };
        }

        const where = {
            ...baseWhere,
            ...(isAdmin ? {} : { is_active: true })
        };

        if (areaId !== undefined) where.area_id = areaId;
        if (serviceLineId !== undefined) where.service_line_id = serviceLineId;
        if (learningPathId !== undefined) where.learning_path_id = learningPathId;
        if (progressionStageId !== undefined) where.progression_stage_id = progressionStageId;

        if (minPoints !== undefined || maxPoints !== undefined) {
            where.badge_points = {};
            if (minPoints !== undefined) where.badge_points[Op.gte] = minPoints;
            if (maxPoints !== undefined) where.badge_points[Op.lte] = maxPoints;
        }

        if (expiringOnly) {
            where.expiration_duration_days = {
                [Op.ne]: null,
                [Op.gt]: 0
            };
        }

        if (badgeClass === 'standard') {
            where.badge_type = { [Op.iLike]: 'Standard' };
        } else if (badgeClass === 'special') {
            where.badge_type = { [Op.iLike]: 'Special' };
        }

        if (search) {
            where[Op.or] = [
                { badge_title: { [Op.iLike]: `%${search}%` } },
                { badge_description: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const progressionStageInclude = {
            model: models.progression_stages,
            as: 'progression_stage',
            attributes: ['progression_stage_id', 'stage_title', 'stage_sequence'],
            include: [{
                model: models.stage_codes,
                as: 'stage_code',
                attributes: ['stage_code']
            }]
        };

        if (Array.isArray(stageCodes) && stageCodes.length > 0) {
            progressionStageInclude.required = true;
            progressionStageInclude.include[0].where = {
                stage_code: {
                    [Op.in]: stageCodes.map((code) => String(code).toUpperCase())
                }
            };
        }

        const include = [
            progressionStageInclude,
            {
                model: models.areas,
                as: 'area',
                attributes: ['area_id', 'area_name', 'area_slug']
            },
            {
                model: models.service_lines,
                as: 'service_line',
                attributes: ['service_line_id', 'service_line_name', 'sl_slug']
            },
            {
                model: models.learning_paths,
                as: 'learning_path',
                attributes: ['learning_path_id', 'path_title', 'path_slug']
            },
            {
                model: models.badge_requirements,
                as: 'badge_requirements',
                attributes: ['requirement_id', 'requirement_title', 'requirement_description'],
                where: { is_active: true },
                required: false
            }
        ];

        const excludedFields = isAdmin ? [] : ['is_active', 'created_by', 'updated_by'];

        const { rows, count } = await models.badges.findAndCountAll({
            where,
            include,
            limit,
            offset,
            order: [['badge_points', 'DESC'], ['badge_title', 'ASC']],
            distinct: true,
            attributes: {
                include: [
                    [literal(`(SELECT COUNT(DISTINCT ab.user_id) FROM awarded_badges ab JOIN badge_applications ba ON ba.application_id = ab.application_id WHERE ba.badge_id = "badges".badge_id)`), 'consultant_count'],
                ],
                exclude: excludedFields
            }
        });

        const totalPages = Math.ceil(count / limit);

        if (page > totalPages && count > 0) {
            return res.status(404).json({
                success: false,
                code: "PAGINATION_PAGE_NOT_FOUND"
            });
        }

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                totalItems: count,
                totalPages,
                currentPage: page
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error);

        logger.error('Error listing Badges', { error });
        return res.status(500).json({
            success: false,
            code: "BADGE_LIST_FAILED"
        });
    }
};

// GET /api/badges/count
const getBadgesCount = async (req, res) => {
    return handleCachedCountRequest({
        req,
        res,
        model: models.badges,
        cacheKey: 'badges:count:active',
        where: { is_active: true },
        failureCode: 'BADGE_COUNT_FAILED',
        logContext: 'badges'
    });
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
            },
            {
                model: models.skills,
                as: 'skills',
                attributes: ['skills_id', 'skill_name', 'skill_description']
            },
            {
                model: models.rewards,
                as: 'rewards',
                attributes: ['reward_id', 'special_title', 'special_portrait_svg']
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

        const badgeData = badge.toJSON();

        const userId = req.user?.sub;
        if (userId && !isAdmin) {
            const awardedBadge = await models.awarded_badges.findOne({
                where: { user_id: userId },
                include: [{
                    model: models.badge_applications,
                    as: 'application',
                    where: { badge_id: badge.badge_id },
                    attributes: []
                }],
                attributes: ['awarded_badges_id', 'awarded_at', 'expiration_at', 'public_verification_link'],
                order: [['awarded_at', 'DESC']]
            });

            if (awardedBadge) {
                badgeData.user_award = {
                    awarded_at: awardedBadge.awarded_at,
                    expiration_at: awardedBadge.expiration_at,
                    public_verification_link: awardedBadge.public_verification_link,
                };
            } else {
                badgeData.user_award = null;
            }
        }

        return res.status(200).json({
            success: true,
            data: badgeData
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
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

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
            badgeTitle,
            badgeSlug,
            badgeType,
            badgePoints,
            expirationDurationDays,
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

        const existingBadge = await models.badges.findOne({
            where: { progression_stage_id: progressionStageId }
        });
        if (existingBadge) {
            return res.status(409).json({
                success: false,
                code: "LEVEL_ALREADY_HAS_BADGE"
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
            badge_title: badgeTitle,
            badge_slug: finalUniqueSlug,
            badge_type: badgeType,
            badge_points: badgePoints,
            expiration_duration_days: expirationDurationDays ?? null,
            badge_description: badgeDescription || null,
            badge_img_url: finalImgUrl || null,
            created_by: userId,
            updated_by: userId
        });

        await invalidateCacheByPrefix('badges:list');
        await invalidateCacheByPrefix('badges:count');
        await invalidateCacheByPrefix('levels:list');
        await redis.del('levels:filter-stats');
        await sendTopicUpdate("new_data", 14);

        return res.status(201).json({
            success: true,
            code: "BADGE_CREATED",
            data: newBadge
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

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
            badgeTitle,
            badgeSlug: manualNewSlug,
            badgeType,
            badgePoints,
            expirationDurationDays,
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
            const existingBadge = await models.badges.findOne({
                where: { progression_stage_id: progressionStageId }
            });
            if (existingBadge) {
                return res.status(409).json({
                    success: false,
                    code: "LEVEL_ALREADY_HAS_BADGE"
                });
            }

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
            badge_title: badgeTitle !== undefined ? badgeTitle : badge.badge_title,
            badge_slug: finalNewSlug,
            badge_type: badgeType !== undefined ? badgeType : badge.badge_type,
            badge_points: badgePoints !== undefined ? badgePoints : badge.badge_points,
            expiration_duration_days: expirationDurationDays !== undefined ? expirationDurationDays : badge.expiration_duration_days,
            badge_description: badgeDescription !== undefined ? badgeDescription : badge.badge_description,
            badge_img_url: finalImgUrl,
            is_active: isActive !== undefined ? isActive : badge.is_active,
            updated_by: userId
        });

        await invalidateCacheByPrefix('badges:list');
        await invalidateCacheByPrefix('badges:count');
        await invalidateCacheByPrefix('levels:list');
        await redis.del('levels:filter-stats');
        await sendTopicUpdate("new_data", 14);

        return res.status(200).json({
            success: true,
            code: "BADGE_UPDATED",
            data: badge
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

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
            return res.status(400).json({ success: false, code: "BADGE_ALREADY_INACTIVE" });
        }

        const activeApplications = await models.badge_applications.count({
            where: { badge_id: badge.badge_id, application_state: ['Open', 'Submitted', 'In validation'] }
        });

        if (activeApplications > 0) {
            return res.status(409).json({
                success: false,
                code: "BADGE_HAS_DEPENDENCIES",
                data: { activeApplications }
            });
        }

        await badge.update({ is_active: false, updated_by: userId });

        await invalidateCacheByPrefix('badges:list');
        await invalidateCacheByPrefix('badges:count');
        await invalidateCacheByPrefix('levels:list');
        await redis.del('levels:filter-stats');
        await sendTopicUpdate("new_data", 14);

        return res.status(200).json({ success: true, code: "BADGE_DEACTIVATED" });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_URL_PARAM');

        logger.error('Error deleting Badge', { error });
        return res.status(500).json({
            success: false,
            code: "BADGE_DELETE_FAILED"
        });
    }
};

module.exports = {
    getBadges,
    getBadgesCount,
    getBadgeBySlug,
    checkSlugAvailability,
    createBadge,
    updateBadge,
    deleteBadge
};
