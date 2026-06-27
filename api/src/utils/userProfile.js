const { Op } = require('sequelize');
const { models } = require('../config/db');

/**
 * Build a user's in-platform profile payload by GUID.
 *
 * This is the single source of truth shared by the admin "view user" endpoint
 * and the authenticated in-platform profile endpoint (`GET /api/users/:guid`).
 *
 * @param {string} userGuid - the user's public GUID.
 * @param {object} [options]
 * @param {boolean} [options.includeSensitive=false] - when true, includes
 *   account/administrative fields (email, account flags, login timestamps).
 *   The public in-platform profile MUST be built with this set to false.
 * @returns {Promise<object|null>} the profile object, or null if no user matches.
 */
const buildUserProfileByGuid = async (userGuid, { includeSensitive = false } = {}) => {
    const user = await models.users.findOne({
        where: { user_guid: userGuid },
        attributes: [
            'user_id', 'user_guid', 'full_name', 'username',
            'email_address', 'user_role', 'profile_img_url',
            'language_id', 'location_id', 'current_streak_days',
            'is_active', 'email_confirmed', 'last_login_at',
            'last_online', 'created_at'
        ],
        raw: true
    });

    if (!user) return null;

    const [location, languageRecord, consultant, talentManager, serviceLineLeader, consultantAreas] = await Promise.all([
        user.location_id
            ? models.locations.findByPk(user.location_id, { attributes: ['location_id', 'location_name'], raw: true })
            : null,
        user.language_id
            ? models.languages.findByPk(user.language_id, { attributes: ['language_id', 'language_iso', 'language_name'], raw: true })
            : null,
        models.consultants.findOne({ where: { user_id: user.user_id }, attributes: ['biography', 'gdpr_accepted'], raw: true }),
        models.talent_managers.findOne({ where: { user_id: user.user_id }, attributes: ['biography'], raw: true }),
        models.service_line_leaders.findOne({ where: { user_id: user.user_id }, attributes: ['biography', 'service_line_id'], raw: true }),
        models.consultant_areas.findAll({ where: { user_id: user.user_id }, attributes: ['area_id', 'is_primary'], raw: true })
    ]);

    let areasPayload = null;
    if (consultantAreas.length > 0) {
        const areaIds = consultantAreas.map((a) => a.area_id);
        const areaRecords = await models.areas.findAll({
            where: { area_id: { [Op.in]: areaIds } },
            attributes: ['area_id', 'area_name', 'area_slug', 'area_description', 'img_url'],
            raw: true
        });
        const areaById = new Map(areaRecords.map((a) => [a.area_id, a]));
        areasPayload = consultantAreas
            .map((ca) => {
                const area = areaById.get(ca.area_id);
                if (!area) return null;
                return { areaId: area.area_id, name: area.area_name, slug: area.area_slug, description: area.area_description, imgUrl: area.img_url, isPrimary: ca.is_primary };
            })
            .filter(Boolean);
        if (areasPayload.length === 0) areasPayload = null;
    }

    let serviceLineData = null;
    let learningPathData = null;

    const resolveServiceLine = async (serviceLineId) => {
        if (!serviceLineId) return;
        const sl = await models.service_lines.findByPk(serviceLineId, {
            attributes: ['service_line_name', 'sl_slug', 'service_line_description', 'img_url', 'learning_path_id'],
            raw: true
        });
        if (!sl) return;
        serviceLineData = { serviceLineId: serviceLineId, name: sl.service_line_name, slug: sl.sl_slug, description: sl.service_line_description, imgUrl: sl.img_url };
        if (sl.learning_path_id) {
            const lp = await models.learning_paths.findByPk(sl.learning_path_id, {
                attributes: ['path_title', 'path_slug', 'path_description', 'img_url'],
                raw: true
            });
            if (lp) learningPathData = { title: lp.path_title, slug: lp.path_slug, description: lp.path_description, imgUrl: lp.img_url };
        }
    };

    if (serviceLineLeader?.service_line_id) {
        await resolveServiceLine(serviceLineLeader.service_line_id);
    } else if (consultantAreas.length > 0) {
        const primaryArea = consultantAreas.find((a) => a.is_primary);
        if (primaryArea) {
            const areaWithSl = await models.areas.findByPk(primaryArea.area_id, { attributes: ['service_line_id'], raw: true });
            await resolveServiceLine(areaWithSl?.service_line_id);
        }
    }

    const langPayload = languageRecord
        ? { id: languageRecord.language_id, iso: languageRecord.language_iso, name: languageRecord.language_name }
        : null;

    const profile = {
        guid: user.user_guid,
        fullName: user.full_name,
        username: user.username,
        role: user.user_role,
        profileImg: user.profile_img_url,
        lang: langPayload,
        location: location ? { location_id: location.location_id, name: location.location_name } : null,
        locationId: user.location_id,
        biography: user.user_role === 'Consultant' ? (consultant?.biography || null)
            : user.user_role === 'Talent Manager' ? (talentManager?.biography || null)
                : user.user_role === 'Service Line Leader' ? (serviceLineLeader?.biography || null)
                    : null,
        serviceLineId: serviceLineLeader?.service_line_id || null,
        serviceLine: serviceLineData,
        learningPath: learningPathData,
        areas: areasPayload,
        currentStreakDays: user.current_streak_days,
        createdAt: user.created_at
    };

    // Account/administrative fields are restricted to the admin view only.
    if (includeSensitive) {
        profile.email = user.email_address;
        profile.isActive = user.is_active;
        profile.emailConfirmed = user.email_confirmed;
        profile.gdprAccepted = consultant?.gdpr_accepted ?? null;
        profile.lastLogin = user.last_login_at;
        profile.lastOnline = user.last_online;
    }

    // Gamification counters for the profile stat cards (consultant targets only).
    // Same definitions used elsewhere: earned badges, submitted+ applications,
    // and the points_history total.
    if (user.user_role === 'Consultant') {
        const [badgesCount, applicationsCount, pointsSum] = await Promise.all([
            models.awarded_badges.count({ where: { user_id: user.user_id } }),
            models.badge_applications.count({
                where: {
                    user_id: user.user_id,
                    application_state: ['Submitted', 'In validation', 'Accepted', 'Rejected']
                }
            }),
            models.points_history.sum('points_delta', { where: { user_id: user.user_id } })
        ]);
        profile.badgesCount = badgesCount;
        profile.applicationsCount = applicationsCount;
        profile.totalPoints = pointsSum || 0;
    }

    return profile;
};

module.exports = { buildUserProfileByGuid };
