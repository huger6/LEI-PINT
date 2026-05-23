const { Op } = require('sequelize');
const { sequelize, models } = require('../config/db');
const redis = require('../config/redis');
const { moveImageToPermanent } = require('../services/storage.service');
const { logger } = require('../utils/logger');
const stripNullishFields = require('../utils/stripNullishFields');
const { sendTopicUpdate } = require('../services/firebase.service');
const { handleZodError } = require('../utils/responseHelper');

const me = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const user_id = req.user.sub; // from jwt

    const cacheKey = `user:profile:${user_id}`;

    try {
        // Check if data is on cache
        const cachedProfile = await redis.get(cacheKey);

        if (cachedProfile) {
            return res.status(200).json({
                success: true,
                code: "AUTH_USER_PROFILE_RETRIEVED",
                data: JSON.parse(cachedProfile)
            });
        }

        const user = await models.users.findByPk(user_id, {
            attributes: [
                'user_id',
                'user_guid',
                'full_name',
                'username',
                'email_address',
                'user_role',
                'profile_img_url',
                'language_id',
                'location_id',
                'current_streak_days'
            ],
            raw: true
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                code: "AUTH_USER_NOT_FOUND"
            });
        }

        const [location, languageRecord, consultant, talentManager, serviceLineLeader, consultantAreas] = await Promise.all([
            user.location_id
                ? models.locations.findByPk(user.location_id, {
                    attributes: ['location_name'],
                    raw: true
                })
                : null,
            // Fetch all language fields
            user.language_id
                ? models.languages.findByPk(user.language_id, {
                    attributes: ['language_id', 'language_iso', 'language_name'],
                    raw: true
                })
                : null,
            models.consultants.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography'],
                raw: true
            }),
            models.talent_managers.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography'],
                raw: true
            }),
            models.service_line_leaders.findOne({
                where: { user_id: user.user_id },
                attributes: ['biography', 'service_line_id'],
                raw: true
            }),
            models.consultant_areas.findAll({
                where: { user_id: user.user_id },
                attributes: ['area_id', 'is_primary'],
                raw: true
            })
        ]);

        let areasPayload = null;

        if (consultantAreas.length > 0) {
            const areaIds = consultantAreas.map((area) => area.area_id);

            // Fetch full area info; area_id is kept only for the map lookup and never exposed
            const areaRecords = await models.areas.findAll({
                where: {
                    area_id: {
                        [Op.in]: areaIds
                    }
                },
                attributes: [
                    'area_id',
                    'area_name',
                    'area_slug',
                    'area_code',
                    'area_description',
                    'img_url'
                ],
                raw: true
            });

            const areaById = new Map(areaRecords.map((area) => [area.area_id, area]));

            areasPayload = consultantAreas
                .map((consultantArea) => {
                    const currentArea = areaById.get(consultantArea.area_id);

                    if (!currentArea) {
                        return null;
                    }

                    // Integer area_id is intentionally omitted; slug acts as the public identifier
                    return {
                        name: currentArea.area_name,
                        slug: currentArea.area_slug,
                        code: currentArea.area_code,
                        description: currentArea.area_description,
                        imgUrl: currentArea.img_url,
                        isPrimary: consultantArea.is_primary
                    };
                })
                .filter(Boolean);

            if (areasPayload.length === 0) {
                areasPayload = null;
            }
        }

        // Full objects for service line and learning path (IDs excluded from the response)
        let serviceLineData = null;
        let learningPathData = null;

        const resolveServiceLineData = async (serviceLineId) => {
            if (!serviceLineId) {
                return;
            }

            // learning_path_id is fetched only to resolve the LP; it is not exposed
            const serviceLine = await models.service_lines.findByPk(serviceLineId, {
                attributes: [
                    'service_line_name',
                    'sl_slug',
                    'service_line_description',
                    'img_url',
                    'learning_path_id'
                ],
                raw: true
            });

            if (!serviceLine) {
                return;
            }

            // Build service line payload without any integer ID
            serviceLineData = {
                name: serviceLine.service_line_name,
                slug: serviceLine.sl_slug,
                description: serviceLine.service_line_description,
                imgUrl: serviceLine.img_url
            };

            if (serviceLine.learning_path_id) {
                const learningPath = await models.learning_paths.findByPk(serviceLine.learning_path_id, {
                    attributes: [
                        'path_title',
                        'path_slug',
                        'path_description',
                        'img_url'
                    ],
                    raw: true
                });

                if (learningPath) {
                    // Build learning path payload without any integer ID
                    learningPathData = {
                        title: learningPath.path_title,
                        slug: learningPath.path_slug,
                        description: learningPath.path_description,
                        imgUrl: learningPath.img_url
                    };
                }
            }
        };

        if (serviceLineLeader?.service_line_id) {
            await resolveServiceLineData(serviceLineLeader.service_line_id);
        } else if (consultantAreas.length > 0) {
            const primaryArea = consultantAreas.find((area) => area.is_primary);

            if (primaryArea) {
                const areaWithServiceLine = await models.areas.findByPk(primaryArea.area_id, {
                    attributes: ['service_line_id'],
                    raw: true
                });

                await resolveServiceLineData(areaWithServiceLine?.service_line_id);
            }
        }

        // Language object with all fields
        const langPayload = languageRecord
            ? {
                id: languageRecord.language_id,
                iso: languageRecord.language_iso,
                name: languageRecord.language_name
            }
            : null;

        const profile = stripNullishFields({
            guid: user.user_guid,
            fullName: user.full_name,
            username: user.username,
            email: user.email_address,
            role: user.user_role,
            profileImg: user.profile_img_url,
            lang: langPayload,
            location: location?.location_name || null,
            biography: user.user_role === 'Consultant' ? (consultant?.biography || null)
                : user.user_role === 'Talent Manager' ? (talentManager?.biography || null)
                : user.user_role === 'Service Line Leader' ? (serviceLineLeader?.biography || null)
                : null,
            serviceLine: serviceLineData,
            learningPath: learningPathData,
            areas: areasPayload,
            currentStreakDays: user.current_streak_days
        });

        // Store in cache
        await redis.set(cacheKey, JSON.stringify(profile), 'EX', 3600);

        return res.status(200).json({
            success: true,
            code: "AUTH_USER_PROFILE_RETRIEVED",
            data: profile
        });
    } catch (error) {
        logger.error('Error fetching current user', {
            requestId,
            error
        });

        return res.status(500).json({
            success: false,
            code: "AUTH_PROFILE_FETCH_FAILED",
            requestId
        });
    }
};

const updateProfile = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const t = await sequelize.transaction();

    try {
        logger.info('Update profile flow started', {
            requestId,
            userId: req.user.sub
        });

        const userId = req.user.sub;
        const { updateProfileSchema } = require('../validations/auth.validation');

        // Validate request data
        const validatedData = updateProfileSchema.parse(req.body);
        const profileImgExplicitNull = validatedData.profile_img_url === null;
        const updates = stripNullishFields(validatedData);
        if (profileImgExplicitNull) updates.profile_img_url = null;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: [{ code: 'VALIDATION_INVALID_DATA', detail: 'At least one field must be provided for update.' }]
            });
        }

        // Validate location and language if provided
        if (updates.location_id) {
            const location = await models.locations.findByPk(updates.location_id, {
                attributes: ['location_id'],
                transaction: t
            });

            if (!location) {
                await t.rollback();
                logger.warn('Invalid location provided', {
                    requestId,
                    userId,
                    locationId: updates.location_id
                });
                return res.status(400).json({
                    success: false,
                    code: 'AUTH_INVALID_LOCATION'
                });
            }
        }

        if (updates.language_id) {
            const language = await models.languages.findByPk(updates.language_id, {
                attributes: ['language_id'],
                transaction: t
            });

            if (!language) {
                await t.rollback();
                logger.warn('Invalid language provided', {
                    requestId,
                    userId,
                    langId: updates.language_id
                });
                return res.status(400).json({
                    success: false,
                    code: 'AUTH_INVALID_LANGUAGE'
                });
            }
        }

        // Update user record
        const user = await models.users.findByPk(userId, {
            transaction: t
        });

        if (!user) {
            await t.rollback();
            return res.status(404).json({
                success: false,
                code: 'AUTH_USER_NOT_FOUND'
            });
        }

        // Handle profile image
        if (updates.profile_img_url && updates.profile_img_url.includes('/temp/')) {
            try {
                updates.profile_img_url = await moveImageToPermanent('profiles', updates.profile_img_url, user.user_guid);
            } catch (error) {
                await t.rollback();
                logger.warn('Profile image move failed', {
                    requestId,
                    userId,
                    error: error.message
                });
                return res.status(400).json({
                    success: false,
                    code: 'AUTH_INVALID_PROFILE_IMAGE'
                });
            }
        } else if (updates.profile_img_url === null) {
            updates.profile_img_url = null;
        }

        await user.update(updates, { transaction: t });

        logger.debug('User profile updated', {
            requestId,
            userId,
            fieldsUpdated: Object.keys(updates)
        });

        // Update biography for role-specific tables if provided
        if (updates.biography) {
            if (user.user_role === 'Consultant') {
                await models.consultants.update(
                    { biography: updates.biography },
                    { where: { user_id: userId }, transaction: t }
                );
            } else if (user.user_role === 'Talent Manager') {
                await models.talent_managers.update(
                    { biography: updates.biography },
                    { where: { user_id: userId }, transaction: t }
                );
            } else if (user.user_role === 'Service Line Leader') {
                await models.service_line_leaders.update(
                    { biography: updates.biography },
                    { where: { user_id: userId }, transaction: t }
                );
            }
        }

        await t.commit();

        // Invalidate cache
        const cacheKey = `user:profile:${userId}`;
        await redis.del(cacheKey);
        await sendTopicUpdate("new_data", 1);
        if (updates.biography) {
            if (user.user_role === 'Consultant') await sendTopicUpdate("new_data", 2);
            else if (user.user_role === 'Talent Manager') await sendTopicUpdate("new_data", 4);
            else if (user.user_role === 'Service Line Leader') await sendTopicUpdate("new_data", 5);
        }

        logger.info('Profile update completed successfully', {
            requestId,
            userId
        });

        return res.status(200).json({
            success: true,
            code: 'AUTH_PROFILE_UPDATED'
        });

    } catch (error) {
        await t.rollback();

        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error updating user profile', {
            requestId,
            userId: req.user.sub,
            error
        });

        return res.status(500).json({
            success: false,
            code: 'AUTH_PROFILE_UPDATE_FAILED',
            requestId
        });
    }
};

const changeLanguage = async (req, res) => {
    const requestId = req.headers['x-request-id'] || null;
    const userId = req.user.sub;
    const languageId = parseInt(req.params.id, 10);

    if (!languageId || isNaN(languageId)) {
        return res.status(400).json({
            success: false,
            code: 'AUTH_INVALID_LANGUAGE'
        });
    }

    try {
        logger.info('Change language flow started', {
            requestId,
            userId,
            languageId
        });

        const language = await models.languages.findByPk(languageId, {
            attributes: ['language_id']
        });

        if (!language) {
            logger.warn('Language not found', { requestId, userId, languageId });
            return res.status(404).json({
                success: false,
                code: 'AUTH_INVALID_LANGUAGE'
            });
        }

        const user = await models.users.findByPk(userId, {
            attributes: ['user_id', 'language_id']
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                code: 'AUTH_USER_NOT_FOUND'
            });
        }

        await user.update({ language_id: languageId });

        const cacheKey = `user:profile:${userId}`;
        await redis.del(cacheKey);
        await sendTopicUpdate("new_data", 1);

        logger.info('Language changed successfully', { requestId, userId, languageId });

        return res.status(200).json({
            success: true,
            code: 'AUTH_LANGUAGE_CHANGED'
        });
    } catch (error) {
        logger.error('Error changing user language', { requestId, userId, error });

        return res.status(500).json({
            success: false,
            code: 'AUTH_REQUEST_FAILED',
            requestId
        });
    }
};

module.exports = {
    me,
    updateProfile,
    changeLanguage
};
