const { models, sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const validations = require('../validations/applications.validation');
const { generateSignedUploadUrl, generateSignedDownloadUrl } = require('../services/storage.service');
const gamificationService = require('../services/gamification.service');
const notificationsService = require('../services/notifications.service');
const { sendTopicUpdate } = require('../services/firebase.service');
const {
    sendApplicationSubmittedEmail,
    sendApplicationPendingSllReviewEmail,
    sendApplicationApprovedEmail,
    sendApplicationRejectedEmail
} = require('../services/email.service');

const FRONTEND_URL = process.env.FRONTEND_URL || '';

// Resolves a consultant's email address, display name, and language ISO code.
const getConsultantEmailData = async (userId) => {
    const user = await models.users.findByPk(userId, {
        attributes: ['email_address', 'full_name'],
        include: [{ model: models.languages, as: 'language', attributes: ['language_iso'] }]
    });
    if (!user) return null;
    return {
        email: user.email_address,
        name: user.full_name,
        lang: user.language?.language_iso || 'en-GB'
    };
};

const getApplications = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        // Validate query params
        const { state, page, limit, areaId, badgeId, consultantGuid, dateFrom, dateTo } = validations.getApplicationsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const appWhereClause = {};

        if (state && state.length > 0) {
            appWhereClause.application_state = { [Op.in]: state };
        }

        if (badgeId) appWhereClause.badge_id = badgeId;

        // Leadership can scope the list to a single consultant (e.g. the
        // per-consultant badge history). Resolve the public guid to its user_id.
        if (consultantGuid && role !== 'Consultant') {
            const consultantUser = await models.users.findOne({
                where: { user_guid: consultantGuid },
                attributes: ['user_id']
            });
            // No match → force an empty result rather than leaking the full list.
            appWhereClause.user_id = consultantUser ? consultantUser.user_id : -1;
        }

        if (dateFrom || dateTo) {
            appWhereClause.submitted_at = {};
            if (dateFrom) appWhereClause.submitted_at[Op.gte] = dateFrom;
            if (dateTo) appWhereClause.submitted_at[Op.lte] = dateTo;
        }

        const badgeWhere = {};
        if (areaId) badgeWhere.area_id = areaId;

        const badgeInclude = {
            model: models.badges,
            as: 'badge',
            attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url', 'service_line_id'],
            include: [
                { model: models.service_lines, as: 'service_line', attributes: ['service_line_name'] },
                { model: models.areas, as: 'area', attributes: ['area_name'] },
                {
                    model: models.progression_stages,
                    as: 'progression_stage',
                    attributes: ['stage_title', 'stage_sequence'],
                    include: [{ model: models.stage_codes, as: 'stage_code', attributes: ['stage_code'] }]
                }
            ]
        };
        if (Object.keys(badgeWhere).length > 0) badgeInclude.where = badgeWhere;

        // --- Filter by role ---
        if (role === 'Consultant') {
            // Consultant only sees their own applications
            appWhereClause.user_id = userId;

        } else if (role === 'Service Line Leader') {
            // SLL needs to know his SL
            const sllInfo = await models.service_line_leaders.findByPk(userId);
            if (!sllInfo) {
                return res.status(403).json({
                    success: false,
                    code: "APP_SLL_NOT_CONFIGURED"
                });
            }
            // SLL only sees applications within their SL (merge with any area filter)
            badgeInclude.where = { ...(badgeInclude.where || {}), service_line_id: sllInfo.service_line_id };

        } else if (role === 'Talent Manager' || role === 'Administrator') {
            // TM/Admin see everything, but TM doesn't see apps in 'Open' state by default
            if (!state) {
                appWhereClause.application_state = { [Op.ne]: 'Open' };
            }
        }

        // Query
        const { count, rows } = await models.badge_applications.findAndCountAll({
            where: appWhereClause,
            include: [
                badgeInclude,
                {
                    model: models.consultants, // consultant info
                    as: 'user',
                    include: [{
                        model: models.users,
                        as: 'user',
                        attributes: ['full_name', 'email_address', 'profile_img_url']
                    }]
                }
            ],
            order: [['submitted_at', 'DESC NULLS LAST'], ['opened_at', 'DESC']],
            limit,
            offset
        });

        return res.status(200).json({
            success: true,
            data: rows,
            pagination: {
                total: count,
                page,
                limit,
                totalPages: Math.ceil(count / limit)
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_QUERY_PARAMS');

        logger.error('Error fetching applications', { error });
        return res.status(500).json({
            success: false,
            code: "APP_FETCH_LIST_FAILED"
        });
    }
};

const getApplicationById = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [
                {
                    model: models.badges,
                    as: 'badge',
                    include: [
                        { model: models.learning_paths, as: 'learning_path', attributes: ['path_title'] },
                        { model: models.service_lines, as: 'service_line', attributes: ['service_line_name'] },
                        { model: models.areas, as: 'area', attributes: ['area_name'] },
                        {
                            model: models.progression_stages,
                            as: 'progression_stage',
                            attributes: ['stage_title', 'stage_sequence'],
                            include: [{ model: models.stage_codes, as: 'stage_code', attributes: ['stage_code'] }]
                        },
                        {
                            model: models.badge_requirements,
                            as: 'badge_requirements',
                            where: { is_active: true },
                            required: false
                        }
                    ]
                },
                {
                    model: models.consultants,
                    as: 'user',
                    include: [{ model: models.users, as: 'user', attributes: ['full_name', 'email_address', 'profile_img_url'] }]
                },
                {
                    model: models.requirements_evidences,
                    as: 'requirements_evidences',
                    include: [{ model: models.badge_requirements, as: 'requirement', attributes: ['requirement_title'] }]
                },
                {
                    // Validation logs
                    model: models.application_validation_logs,
                    as: 'application_validation_logs',
                    include: [{ model: models.users, as: 'user', attributes: ['full_name', 'user_role'] }]
                },
                {
                    model: models.awarded_badges,
                    as: 'awarded_badges'
                },
                {
                    model: models.certificates,
                    as: 'certificate'
                }
            ]
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                code: "APP_NOT_FOUND"
            });
        }

        if (role === 'Consultant' && application.user_id !== userId) {
            return res.status(403).json({
                success: false,
                code: "APP_ACCESS_DENIED_OWN"
            });
        }

        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(userId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                return res.status(403).json({
                    success: false,
                    code: "APP_ACCESS_DENIED_SL"
                });
            }
        }

        // Enrich with the consultant's total points and global ranking position.
        // Access to this application is already RBAC-gated above, so exposing the
        // applicant's gamification stats here is safe and avoids extra client calls.
        const data = application.toJSON();
        try {
            const stats = await gamificationService.getConsultantPointsAndRank(application.user_id);
            data.consultant_total_points = stats.totalPoints;
            data.consultant_ranking_position = stats.rankingPosition;
        } catch (statsError) {
            logger.warn('Failed to compute consultant points/rank for application detail', { error: statsError });
            data.consultant_total_points = null;
            data.consultant_ranking_position = null;
        }

        return res.status(200).json({
            success: true,
            data
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'APP_INVALID_APPLICATION_ID');

        logger.error('Error fetching application details', { error });
        return res.status(500).json({
            success: false,
            code: "APP_FETCH_DETAIL_FAILED"
        });
    }
};

const startApplication = async (req, res) => {
    try {
        const userId = req.user.sub; // From JWT
        const { badgeSlug } = validations.startApplicationSchema.parse(req.body);

        // Check if badge exists and is active (resolved by public slug, never PK)
        const badge = await models.badges.findOne({ where: { badge_slug: badgeSlug } });
        if (!badge || !badge.is_active) {
            return res.status(404).json({
                success: false,
                code: "APP_BADGE_NOT_FOUND"
            });
        }

        // Block if user already opened this application
        const existingApp = await models.badge_applications.findOne({
            where: {
                user_id: userId,
                badge_id: badge.badge_id
            }
        });

        if (existingApp) {
            return res.status(409).json({
                success: false,
                code: "APP_ALREADY_EXISTS",
                data: { applicationGuid: existingApp.application_guid, currentState: existingApp.application_state }
            });
        }

        // Create new application
        const newApp = await models.badge_applications.create({
            user_id: userId,
            badge_id: badge.badge_id
        });

        await sendTopicUpdate("new_data", 15);

        return res.status(201).json({
            success: true,
            code: "APP_STARTED",
            data: {
                application_guid: newApp.application_guid,
                application_state: newApp.application_state
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error starting application', { error });
        return res.status(500).json({
            success: false,
            code: "APP_START_FAILED"
        });
    }
};

const getUploadUrl = async (req, res) => {
    try {
        const userId = req.user.sub;
        const userGuid = req.user.guid;

        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { requirementId, fileName } = validations.getUploadUrlBodySchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid, user_id: userId }
        });

        if (!application || application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                code: "APP_UPLOAD_DENIED"
            });
        }

        const fileExtension = fileName.split('.').pop().toLowerCase();

        if (!validations.ALLOWED_EVIDENCE_EXTENSIONS.has(fileExtension)) {
            return res.status(400).json({
                success: false,
                code: "APP_UPLOAD_INVALID_FILE_TYPE"
            });
        }

        const safeFileName = `${Date.now()}_req${requirementId}.${fileExtension}`;
        const storagePath = `${userGuid}/application_${applicationGuid}/${safeFileName}`;

        const { uploadUrl, finalFileUrl } = await generateSignedUploadUrl('private-assets', storagePath);

        return res.status(200).json({
            success: true,
            data: {
                uploadUrl, // Link PUT that expires in 5 min
                finalFileUrl // Perm link to send on the next POST /evidences
            }
        })

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error generating upload URL in controller', { error });
        return res.status(500).json({
            success: false,
            code: "APP_UPLOAD_URL_FAILED"
        });
    }
};

const upsertEvidence = async (req, res) => {
    try {
        const userId = req.user.sub;
        const userGuid = req.user.guid;
        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { requirementId, evidenceFileUrl, evidenceTitle, evidenceDescription, evidenceFileType } = validations.upsertEvidenceBodySchema.parse(req.body);

        // Bind the evidence URL to a file the server actually issued for THIS
        // user + application (the signed-upload path), and re-check the
        // extension. Prevents pointing the record at an arbitrary object.
        const cleanUrl = evidenceFileUrl.split('?')[0];
        const expectedSegment = `/private-assets/${userGuid}/application_${applicationGuid}/`;
        const ext = cleanUrl.split('.').pop().toLowerCase();
        if (!cleanUrl.includes(expectedSegment) || !validations.ALLOWED_EVIDENCE_EXTENSIONS.has(ext)) {
            return res.status(400).json({ success: false, code: 'APP_EVIDENCE_URL_INVALID' });
        }

        // Check if application is open and belongs to this user
        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid, user_id: userId }
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                code: "APP_NOT_FOUND"
            });
        }

        // If it has been submitted, allow no changes
        if (application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                code: "APP_EVIDENCE_EDIT_DENIED"
            });
        }

        // Check if requirement belongs to this application's badge
        const requirement = await models.badge_requirements.findOne({
            where: { requirement_id: requirementId, badge_id: application.badge_id }
        });

        if (!requirement) {
            return res.status(400).json({
                success: false,
                code: "APP_REQUIREMENT_MISMATCH"
            });
        }

        // upsert
        const [evidence, created] = await models.requirements_evidences.upsert({
            application_id: application.application_id,
            requirement_id: requirementId,
            evidence_file_url: evidenceFileUrl,
            evidence_title: evidenceTitle,
            evidence_description: evidenceDescription,
            evidence_file_type: evidenceFileType,
            uploaded_at: new Date()
        }, {
            conflictFields: ['application_id', 'requirement_id']
        });

        await sendTopicUpdate("new_data", 16);

        return res.status(200).json({
            success: true,
            code: created ? "APP_EVIDENCE_ADDED" : "APP_EVIDENCE_UPDATED",
            data: evidence
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');

        logger.error('Error upserting evidence', { error });
        return res.status(500).json({
            success: false,
            code: "APP_UPSERT_EVIDENCE_FAILED"
        });
    }
};

const submitApplication = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { consultantNotes } = validations.submitApplicationSchema.parse(req.body);

        // Get application info
        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid, user_id: userId },
            include: [
                { model: models.requirements_evidences, as: 'requirements_evidences' },
                {
                    model: models.badges,
                    as: 'badge',
                    include: [
                        {
                            model: models.badge_requirements,
                            as: 'badge_requirements',
                            where: { is_active: true },
                            required: false
                        }
                    ]
                }
            ]
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                code: "APP_NOT_FOUND"
            });
        }

        if (application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                code: "APP_ACTION_INVALID_STATE",
                data: { currentState: application.application_state }
            });
        }

        // Do we have all evidence necessary
        const totalRequirements = application.badge.badge_requirements.length;
        const submittedEvidences = application.requirements_evidences.length;

        if (submittedEvidences < totalRequirements) {
            return res.status(400).json({
                success: false,
                code: "APP_MISSING_EVIDENCES",
                data: {
                    required: totalRequirements,
                    submitted: submittedEvidences
                }
            });
        }

        // Audit log (before state update so the DB trigger dedup skips)
        await models.application_validation_logs.create({
            application_id: application.application_id,
            user_id: userId,
            validator_function: 'Consultant',
            validator_action: 'Open -> Submitted',
            validations_comments: null
        });

        // State -> Submitted
        await application.update({
            application_state: 'Submitted',
            submitted_at: new Date(),
            consultant_notes: consultantNotes ?? null
        });

        await sendTopicUpdate("new_data", 15);

        // Create notifications and send email to consultant
        try {
            const badgeMeta = { badgeTitle: application.badge.badge_title };
            const appUrl = `${FRONTEND_URL}/applications/${application.application_guid}`;

            await notificationsService.createNotification({
                userId: application.user_id,
                definitionId: 3,
                notificationType: 'APPLICATIONS',
                title: 'NOTIF_APP_SUBMITTED_TITLE',
                body: 'NOTIF_APP_SUBMITTED_BODY',
                meta: badgeMeta,
                url: `/applications/${application.application_guid}`
            });

            const submittedPrefs = await notificationsService.resolvePreferences(3, application.user_id);
            if (submittedPrefs.is_enabled && submittedPrefs.send_email) {
                const consultantData = await getConsultantEmailData(application.user_id);
                if (consultantData) {
                    await sendApplicationSubmittedEmail(
                        consultantData.email,
                        consultantData.name,
                        application.badge.badge_title,
                        appUrl,
                        consultantData.lang
                    );
                }
            }

            if (application.badge && application.badge.service_line_id) {
                const slls = await models.service_line_leaders.findAll({
                    where: { service_line_id: application.badge.service_line_id },
                    include: [{ model: models.users, as: 'user', attributes: [], where: { user_role: 'Service Line Leader' } }]
                });
                for (const sll of slls) {
                    await notificationsService.createNotification({
                        userId: sll.user_id,
                        definitionId: 3,
                        notificationType: 'APPLICATIONS',
                        title: 'NOTIF_APP_NEW_APPLICATION_TITLE',
                        body: 'NOTIF_APP_NEW_APPLICATION_BODY',
                        meta: badgeMeta,
                        url: `/admin/applications/${application.application_guid}`
                    });
                }
            }

            const tms = await models.talent_managers.findAll({
                include: [{ model: models.users, as: 'user', attributes: [], where: { user_role: 'Talent Manager' } }]
            });
            for (const tm of tms) {
                await notificationsService.createNotification({
                    userId: tm.user_id,
                    definitionId: 3,
                    notificationType: 'APPLICATIONS',
                    title: 'NOTIF_APP_NEW_APPLICATION_TITLE',
                    body: 'NOTIF_APP_NEW_APPLICATION_BODY',
                    meta: badgeMeta,
                    url: `/admin/applications/${application.application_guid}`
                });
            }
        } catch (notifErr) {
            logger.error('Failed to create notifications on submitApplication', { error: notifErr });
        }

        return res.status(200).json({
            success: true,
            code: "APP_SUBMITTED",
            data: {
                applicationGuid: application.application_guid,
                state: application.application_state,
                submittedAt: application.submitted_at
            }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'APP_INVALID_IDENTIFIER');

        logger.error('Error submitting application', { error });
        return res.status(500).json({
            success: false,
            code: "APP_SUBMIT_FAILED"
        });
    }
};

/*──────────────────────────────────────────────────────────────
  PUT /api/applications/:applicationGuid/validate
  Sequential two-stage review: TM reviews first, then SLL.

  Talent Manager (acts on Submitted):
    review → In validation   (approves, forwards to SLL)
    reject → Rejected

  Service Line Leader (acts on In validation):
    accept → Accepted        (final approval, awards badge)
    reject → Rejected

  Administrator: full flexibility across all valid states.
──────────────────────────────────────────────────────────────*/
const validateApplication = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const reviewerId = req.user.sub;
        const role = req.user.role;

        if (!['Talent Manager', 'Service Line Leader', 'Administrator'].includes(role)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED' });
        }

        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { action, reviewerNotes } = validations.reviewApplicationSchema.parse(req.body);

        // Lock the application row FOR UPDATE inside the transaction. Reviewers are
        // global (every TM sees every Submitted application), so two TMs can act on
        // the same one at once. The lock serialises them: the second reviewer blocks
        // until the first commits, then re-reads the (now-changed) state and fails
        // the state-machine guard below — no silent double validation.
        // `of` keeps the lock on badge_applications only (FOR UPDATE can't apply to
        // the nullable side of the badges outer join).
        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }],
            transaction,
            lock: { level: transaction.LOCK.UPDATE, of: models.badge_applications }
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'APP_NOT_FOUND' });
        }

        const state = application.application_state;

        // SLL may only review applications within their own Service Line
        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(reviewerId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                await transaction.rollback();
                return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED_SL' });
            }
        }

        // Enforce sequential review state machine
        let newState;

        if (role === 'Talent Manager') {
            // TM only acts on Submitted applications
            if (state !== 'Submitted') {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 'APP_ACTION_INVALID_STATE', data: { currentState: state } });
            }
            // TM cannot directly accept (must forward to SLL via 'review')
            if (action === 'accept') {
                await transaction.rollback();
                return res.status(403).json({ success: false, code: 'APP_TM_CANNOT_ACCEPT' });
            }
            // 'send_back' returns the application to the consultant for correction (Open)
            newState = action === 'review' ? 'In validation' : (action === 'send_back' ? 'Open' : 'Rejected');

        } else if (role === 'Service Line Leader') {
            // SLL only acts on In validation applications (after TM approval)
            if (state !== 'In validation') {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 'APP_ACTION_INVALID_STATE', data: { currentState: state } });
            }
            // SLL cannot use the 'review' action (no third stage)
            if (action === 'review') {
                await transaction.rollback();
                return res.status(403).json({ success: false, code: 'APP_SLL_CANNOT_REVIEW' });
            }
            // 'send_back' returns the application to the consultant for correction (Open)
            newState = action === 'accept' ? 'Accepted' : (action === 'send_back' ? 'Open' : 'Rejected');

        } else {
            // Administrator: full flexibility
            if (action === 'review' && state !== 'Submitted') {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 'APP_REVIEW_INVALID_STATE', data: { currentState: state } });
            }
            if ((action === 'accept' || action === 'reject' || action === 'send_back') && !['Submitted', 'In validation'].includes(state)) {
                await transaction.rollback();
                return res.status(400).json({ success: false, code: 'APP_ACTION_INVALID_STATE', data: { currentState: state } });
            }
            newState = action === 'review'
                ? 'In validation'
                : (action === 'accept' ? 'Accepted' : (action === 'send_back' ? 'Open' : 'Rejected'));
        }

        // Create awarded_badge record when application is accepted
        // expiration_at is computed by the trg_set_badge_expiration database trigger
        let awardedBadge = null;
        if (newState === 'Accepted') {
            const badge = application.badge;

            awardedBadge = await models.awarded_badges.create({
                application_id: application.application_id,
                user_id: application.user_id,
                awarded_at: new Date(),
                points_snapshot: badge.badge_points,
                public_verification_link: require('crypto').randomUUID(),
                // Per the workflow, acceptance generates AND publishes the badge:
                // it becomes a public, verifiable credential immediately.
                is_published: true,
                is_featured: false
            }, { transaction });
        }

        // Audit log (before state update so the DB trigger dedup skips)
        const actionLabel = { review: 'Request Review', accept: 'Accept', reject: 'Reject', send_back: 'Send Back' }[action];
        await models.application_validation_logs.create({
            application_id: application.application_id,
            user_id: reviewerId,
            validator_function: role,
            validator_action: actionLabel,
            validations_comments: reviewerNotes ?? null
        }, { transaction });

        await application.update({
            application_state: newState,
            ...(newState === 'Accepted' || newState === 'Rejected' ? { closed_at: new Date() } : {})
        }, { transaction });

        if (newState === 'Accepted') {
            await gamificationService.awardBadgeCompletionPoints(application.user_id, application.badge_id, transaction);
        }

        await transaction.commit();
        await sendTopicUpdate("new_data", 15);
        await sendTopicUpdate("new_data", 18);
        if (newState === 'Accepted') await sendTopicUpdate("new_data", 17);

        // Post-commit notifications and emails
        try {
            const badgeMeta = {
                badgeTitle: application.badge.badge_title,
                badgeType: application.badge.badge_type
            };
            const appUrl = `${FRONTEND_URL}/applications/${application.application_guid}`;

            if (newState === 'Accepted') {
                const isSpecial = application.badge.badge_type === 'Special';
                await notificationsService.createNotification({
                    userId: application.user_id,
                    definitionId: 10,
                    notificationType: 'APPLICATIONS',
                    title: isSpecial ? 'NOTIF_APP_SPECIAL_BADGE_AWARDED_TITLE' : 'NOTIF_APP_BADGE_AWARDED_TITLE',
                    body: isSpecial ? 'NOTIF_APP_SPECIAL_BADGE_AWARDED_BODY' : 'NOTIF_APP_BADGE_AWARDED_BODY',
                    meta: badgeMeta,
                    url: `/applications/${application.application_guid}`
                });
            } else if (newState === 'Rejected') {
                await notificationsService.createNotification({
                    userId: application.user_id,
                    definitionId: 11,
                    notificationType: 'APPLICATIONS',
                    title: 'NOTIF_APP_REJECTED_TITLE',
                    body: 'NOTIF_APP_REJECTED_BODY',
                    meta: badgeMeta,
                    url: `/applications/${application.application_guid}`
                });
            } else if (newState === 'In validation') {
                await notificationsService.createNotification({
                    userId: application.user_id,
                    definitionId: 3,
                    notificationType: 'APPLICATIONS',
                    title: 'NOTIF_APP_IN_VALIDATION_TITLE',
                    body: 'NOTIF_APP_IN_VALIDATION_BODY',
                    meta: badgeMeta,
                    url: `/applications/${application.application_guid}`
                });
            } else if (newState === 'Open') {
                // Reviewer sent the application back to the consultant for correction
                await notificationsService.createNotification({
                    userId: application.user_id,
                    definitionId: 3,
                    notificationType: 'APPLICATIONS',
                    title: 'NOTIF_APP_RETURNED_TITLE',
                    body: 'NOTIF_APP_RETURNED_BODY',
                    meta: badgeMeta,
                    url: `/applications/${application.application_guid}`
                });
            }

            // Email the consultant on terminal state changes
            if (newState === 'Accepted' || newState === 'Rejected') {
                const emailDefId = newState === 'Accepted' ? 10 : 11;
                const emailPrefs = await notificationsService.resolvePreferences(emailDefId, application.user_id);
                if (emailPrefs.is_enabled && emailPrefs.send_email) {
                    const consultantData = await getConsultantEmailData(application.user_id);
                    if (consultantData) {
                        if (newState === 'Accepted') {
                            await sendApplicationApprovedEmail(
                                consultantData.email,
                                consultantData.name,
                                application.badge.badge_title,
                                appUrl,
                                consultantData.lang
                            );
                        } else {
                            await sendApplicationRejectedEmail(
                                consultantData.email,
                                consultantData.name,
                                application.badge.badge_title,
                                reviewerNotes || null,
                                appUrl,
                                consultantData.lang
                            );
                        }
                    }
                }
            }

            // When TM forwards to SLL, notify all SLLs for this badge's service line
            if (newState === 'In validation' && application.badge.service_line_id) {
                const slls = await models.service_line_leaders.findAll({
                    where: { service_line_id: application.badge.service_line_id }
                });
                // Applicant name for the SLL email body.
                const applicantData = await getConsultantEmailData(application.user_id);
                const applicantName = applicantData?.name || '';
                for (const sll of slls) {
                    await notificationsService.createNotification({
                        userId: sll.user_id,
                        definitionId: 3,
                        notificationType: 'APPLICATIONS',
                        title: 'NOTIF_APP_PENDING_SLL_REVIEW_TITLE',
                        body: 'NOTIF_APP_PENDING_SLL_REVIEW_BODY',
                        meta: badgeMeta,
                        url: `/admin/applications/${application.application_guid}`
                    });

                    // Email the SLL too (req: SLL receives application/validation emails),
                    // honouring their notification preferences.
                    const sllPrefs = await notificationsService.resolvePreferences(3, sll.user_id);
                    if (sllPrefs.is_enabled && sllPrefs.send_email) {
                        const sllData = await getConsultantEmailData(sll.user_id);
                        if (sllData) {
                            await sendApplicationPendingSllReviewEmail(
                                sllData.email,
                                sllData.name,
                                applicantName,
                                application.badge.badge_title,
                                appUrl,
                                sllData.lang
                            );
                        }
                    }
                }
            }
        } catch (notifErr) {
            logger.error('Failed to create notifications on validateApplication', { error: notifErr });
        }

        return res.status(200).json({
            success: true,
            code: 'APP_STATE_CHANGED',
            data: {
                applicationGuid: application.application_guid,
                state: newState,
                ...(awardedBadge ? {
                    awardedBadgeId: awardedBadge.awarded_badges_id,
                    publicVerificationLink: awardedBadge.public_verification_link
                } : {})
            }
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error validating application', { error });
        return res.status(500).json({ success: false, code: 'APP_VALIDATE_FAILED' });
    }
};

/*──────────────────────────────────────────────────────────────
  PUT /api/applications/:applicationGuid/evidences/:evidenceId/review
  Marks a single evidence as reviewed by TM or SLL.
  When approved, awards the requirement points to the consultant
  (idempotent – never awards twice for the same requirement).

  Roles: Talent Manager (sets tm_reviewed), Service Line Leader
         (sets sll_reviewed).
──────────────────────────────────────────────────────────────*/
const reviewEvidence = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const reviewerId = req.user.sub;
        const role = req.user.role;
        const isAdmin = role === 'Administrator';

        if (!['Talent Manager', 'Service Line Leader', 'Administrator'].includes(role)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED' });
        }

        const { applicationGuid, evidenceId } = validations.evidenceIdParamSchema.parse(req.params);
        const { approved, reviewNotes } = validations.reviewEvidenceSchema.parse(req.body);

        // Lock the application row so concurrent reviewers process one application
        // serially (see validateApplication for the rationale).
        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }],
            transaction,
            lock: { level: transaction.LOCK.UPDATE, of: models.badge_applications }
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'APP_NOT_FOUND' });
        }

        // TM reviews while Submitted; SLL while In validation; the Administrator
        // (super-reviewer) may review in either actionable state.
        const allowedStates = isAdmin
            ? ['Submitted', 'In validation']
            : [role === 'Talent Manager' ? 'Submitted' : 'In validation'];
        if (!allowedStates.includes(application.application_state)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                code: 'APP_EVIDENCE_REVIEW_INVALID_STATE',
                data: { currentState: application.application_state }
            });
        }

        // SLL may only review evidences for badges in their own Service Line
        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(reviewerId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    code: 'APP_ACCESS_DENIED_SL'
                });
            }
        }

        const evidence = await models.requirements_evidences.findOne({
            where: { evidence_id: evidenceId, application_id: application.application_id }
        });

        if (!evidence) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'APP_EVIDENCE_NOT_FOUND' });
        }

        // The Administrator marks both reviewer flags; TM/SLL mark only their own.
        const reviewUpdate = isAdmin
            ? { tm_reviewed: approved, sll_reviewed: approved }
            : { [role === 'Talent Manager' ? 'tm_reviewed' : 'sll_reviewed']: approved };
        await evidence.update(reviewUpdate, { transaction });

        // Audit log
        await models.application_validation_logs.create({
            application_id: application.application_id,
            user_id: reviewerId,
            validator_function: role,
            validator_action: approved ? 'Approve Evidence' : 'Reject Evidence',
            validations_comments: reviewNotes ?? null
        }, { transaction });

        // Award requirement points when evidence is approved
        if (approved && evidence.requirement_id) {
            await gamificationService.awardRequirementPoints(
                application.user_id,
                evidence.requirement_id,
                transaction
            );
        }

        await transaction.commit();
        await sendTopicUpdate("new_data", 16);
        await sendTopicUpdate("new_data", 18);

        return res.status(200).json({
            success: true,
            code: 'APP_EVIDENCE_REVIEWED',
            data: { evidenceId, approved }
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error reviewing evidence', { error });
        return res.status(500).json({ success: false, code: 'APP_EVIDENCE_REVIEW_FAILED' });
    }
};

const updateApplication = async (req, res) => {
    try {
        const userId = req.user.sub;
        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { consultantNotes } = validations.updateApplicationSchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid, user_id: userId }
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                code: "APP_NOT_FOUND"
            });
        }

        if (application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                code: "APP_EDIT_DENIED"
            });
        }

        await application.update({ consultant_notes: consultantNotes ?? null });

        return res.status(200).json({
            success: true,
            code: "APP_UPDATED",
            data: { consultantNotes: application.consultant_notes }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error updating application', { error });
        return res.status(500).json({
            success: false,
            code: "APP_UPDATE_FAILED"
        });
    }
};

const downloadEvidence = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        const { applicationGuid, evidenceId } = validations.evidenceIdParamSchema.parse(req.params);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge', attributes: ['service_line_id'] }]
        });

        if (!application) {
            return res.status(404).json({ success: false, code: 'APP_NOT_FOUND' });
        }

        if (role === 'Consultant' && application.user_id !== userId) {
            return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED_OWN' });
        }

        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(userId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED_SL' });
            }
        }

        const evidence = await models.requirements_evidences.findOne({
            where: { evidence_id: evidenceId, application_id: application.application_id }
        });

        if (!evidence || !evidence.evidence_file_url) {
            return res.status(404).json({ success: false, code: 'APP_EVIDENCE_NOT_FOUND' });
        }

        const fileUrl = evidence.evidence_file_url;
        const bucketName = 'private-assets';
        const pathMatch = fileUrl.match(/\/authenticated\/[^/]+\/(.+)$/);

        if (!pathMatch) {
            return res.status(400).json({ success: false, code: 'APP_EVIDENCE_URL_INVALID' });
        }

        const filePath = decodeURIComponent(pathMatch[1]);
        const signedUrl = await generateSignedDownloadUrl(bucketName, filePath, 600);

        return res.status(200).json({
            success: true,
            data: { downloadUrl: signedUrl }
        });

    } catch (error) {
        if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_DATA');
        logger.error('Error downloading evidence', { error });
        return res.status(500).json({ success: false, code: 'APP_DOWNLOAD_FAILED' });
    }
};

module.exports = {
    getApplications,
    getApplicationById,
    startApplication,
    getUploadUrl,
    upsertEvidence,
    submitApplication,
    validateApplication,
    reviewEvidence,
    updateApplication,
    downloadEvidence
};
