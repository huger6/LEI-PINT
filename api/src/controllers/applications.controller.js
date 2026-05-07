const { models, sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const validations = require('../validations/applications.validation');
const gamificationValidations = require('../validations/gamification.validation');
const { generateSignedUploadUrl } = require('../services/storage.service');
const gamificationService = require('../services/gamification.service');
const notificationsService = require('../services/notifications.service');


const getApplications = async (req, res) => {
    try {
        const userId = req.user.sub;
        const role = req.user.role;

        // Validate query params
        const { state, page, limit } = validations.getApplicationsQuerySchema.parse(req.query);
        const offset = (page - 1) * limit;

        const appWhereClause = {};

        if (state && state.length > 0) {
            appWhereClause.application_state = { [Op.in]: state };
        }

        const badgeInclude = {
            model: models.badges,
            as: 'badge',
            attributes: ['badge_id', 'badge_title', 'badge_slug', 'badge_img_url', 'service_line_id']
        };

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
            // SLL only sees applications within their SL
            badgeInclude.where = { service_line_id: sllInfo.service_line_id };

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
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_QUERY_PARAMS",
                errors: error.errors
            });
        }

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
                        { model: models.service_lines, as: 'service_line', attributes: ['service_line_name'] },
                        { model: models.areas, as: 'area', attributes: ['area_name'] }
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

        return res.status(200).json({
            success: true,
            data: application
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "APP_INVALID_APPLICATION_ID"
            });
        }

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
        const { badgeId, goalId } = validations.startApplicationSchema.parse(req.body);

        // Check if badge exists and is active
        const badge = await models.badges.findByPk(badgeId);
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
                badge_id: badgeId
            }
        });

        if (existingApp) {
            return res.status(409).json({
                success: false,
                code: "APP_ALREADY_EXISTS",
                data: { applicationId: existingApp.application_id, currentState: existingApp.application_state }
            });
        }

        // Create new application
        const newApp = await models.badge_applications.create({
            user_id: userId,
            badge_id: badgeId,
            goal_id: goalId || null
        });

        return res.status(201).json({
            success: true,
            code: "APP_STARTED",
            data: newApp
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.issues || error.errors
            });
        }
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
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

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
        const { applicationGuid } = validations.applicationGuidParamSchema.parse(req.params);
        const { requirementId, evidenceFileUrl, evidenceTitle, evidenceDescription, evidenceFileType } = validations.upsertEvidenceBodySchema.parse(req.body);

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

        return res.status(200).json({
            success: true,
            code: created ? "APP_EVIDENCE_ADDED" : "APP_EVIDENCE_UPDATED",
            data: evidence
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_INVALID_DATA",
                errors: error.errors
            });
        }

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

        // State -> Submitted
        await application.update({
            application_state: 'Submitted',
            submitted_at: new Date()
        });

        // Create notifications: applicant confirmation, SLLs and Talent Managers
        try {
            // Notify applicant
            await notificationsService.createNotification({
                userId: application.user_id,
                title: 'Candidatura submetida',
                body: `A sua candidatura ao badge "${application.badge.badge_title}" foi submetida.`,
                url: `/applications/${application.application_guid}`
            });

            // Notify Service Line Leaders for this badge (if any)
            if (application.badge && application.badge.service_line_id) {
                const slls = await models.service_line_leaders.findAll({ where: { service_line_id: application.badge.service_line_id } });
                for (const sll of slls) {
                    await notificationsService.createNotification({
                        userId: sll.user_id,
                        title: 'Nova candidatura',
                        body: `Foi submetida uma nova candidatura ao badge "${application.badge.badge_title}".`,
                        url: `/admin/applications/${application.application_guid}`
                    });
                }
            }

            // Notify Talent Managers
            const tms = await models.talent_managers.findAll();
            for (const tm of tms) {
                await notificationsService.createNotification({
                    userId: tm.user_id,
                    title: 'Nova candidatura submetida',
                    body: `Nova candidatura ao badge "${application.badge.badge_title}" disponível para revisão.`,
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
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: "APP_INVALID_IDENTIFIER",
                errors: error.errors
            });
        }

        logger.error('Error submitting application', { error });
        return res.status(500).json({
            success: false,
            code: "APP_SUBMIT_FAILED"
        });
    }
};

/*──────────────────────────────────────────────────────────────
  PUT /api/applications/:applicationGuid/validate
  Moves an application through the review state machine:
    review  → Submitted      → In validation
    accept  → Submitted|InV  → Accepted  (creates awarded_badge,
                                           awards all points)
    reject  → Submitted|InV  → Rejected

  Roles: Talent Manager, Service Line Leader, Administrator.
  SLL can only act on badges within their own Service Line.
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

        const { applicationGuid } = gamificationValidations.applicationGuidParamSchema.parse(req.params);
        const { action, reviewerNotes } = gamificationValidations.reviewApplicationSchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }]
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'APP_NOT_FOUND' });
        }

        // SLL may only review applications within their own Service Line
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

        // Validate state machine transitions
        const state = application.application_state;
        if (action === 'review' && state !== 'Submitted') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                code: 'APP_REVIEW_INVALID_STATE',
                data: { currentState: state }
            });
        }
        if ((action === 'accept' || action === 'reject') && !['Submitted', 'In validation'].includes(state)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                code: 'APP_ACTION_INVALID_STATE',
                data: { currentState: state }
            });
        }

        let newState;
        let awardedBadge = null;

        if (action === 'review') {
            newState = 'In validation';
        } else if (action === 'reject') {
            newState = 'Rejected';
        } else {
            // accept
            newState = 'Accepted';

            const badge = application.badge;
            const expirationAt = badge.expiration_duration_days
                ? new Date(Date.now() + badge.expiration_duration_days * 24 * 60 * 60 * 1000)
                : null;

            awardedBadge = await models.awarded_badges.create({
                application_id: application.application_id,
                user_id: application.user_id,
                awarded_at: new Date(),
                expiration_at: expirationAt,
                points_snapshot: badge.badge_points,
                public_verification_link: require('crypto').randomUUID(),
                is_published: false,
                is_featured: false
            }, { transaction });
        }

        await application.update({
            application_state: newState,
            reviewer_notes: reviewerNotes ?? application.reviewer_notes,
            ...(newState === 'Accepted' || newState === 'Rejected'
                ? { closed_at: new Date() }
                : {}),
            ...(awardedBadge ? { awarded_badges_id: awardedBadge.awarded_badges_id } : {})
        }, { transaction });

        // Audit log
        const actionLabel = { review: 'Request Review', accept: 'Accept', reject: 'Reject' }[action];
        await models.application_validation_logs.create({
            application_id: application.application_id,
            user_id: reviewerId,
            validator_function: role,
            validator_action: actionLabel,
            validations_comments: reviewerNotes ?? null
        }, { transaction });

        // Award points on acceptance
        if (newState === 'Accepted') {
            await gamificationService.awardBadgeCompletionPoints(
                application.user_id,
                application.badge_id,
                transaction
            );
        }

        await transaction.commit();

        // Notifications after successful state change
        try {
            // Notify applicant about state change
            if (['In validation', 'Accepted', 'Rejected'].includes(newState)) {
                let title;
                let body;
                if (newState === 'In validation') {
                    title = 'Candidatura em validação';
                    body = `A sua candidatura ao badge "${application.badge.badge_title}" está a ser validada.`;
                } else if (newState === 'Accepted') {
                    title = 'Candidatura aceite';
                    body = `A sua candidatura ao badge "${application.badge.badge_title}" foi aceite.`;
                } else {
                    title = 'Candidatura rejeitada';
                    body = `A sua candidatura ao badge "${application.badge.badge_title}" foi rejeitada.`;
                }

                await notificationsService.createNotification({
                    userId: application.user_id,
                    title,
                    body,
                    url: `/applications/${application.application_guid}`
                });
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
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.errors
            });
        }
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

        if (!['Talent Manager', 'Service Line Leader'].includes(role)) {
            await transaction.rollback();
            return res.status(403).json({ success: false, code: 'APP_ACCESS_DENIED' });
        }

        const { applicationGuid, evidenceId } = gamificationValidations.evidenceIdParamSchema.parse(req.params);
        const { approved, reviewNotes } = gamificationValidations.reviewEvidenceSchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }]
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'APP_NOT_FOUND' });
        }

        if (!['Submitted', 'In validation'].includes(application.application_state)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                code: 'APP_EVIDENCE_REVIEW_INVALID_STATE'
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

        const reviewField = role === 'Talent Manager' ? 'tm_reviewed' : 'sll_reviewed';
        await evidence.update({ [reviewField]: approved }, { transaction });

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

        return res.status(200).json({
            success: true,
            code: 'APP_EVIDENCE_REVIEWED',
            data: { evidenceId, approved, reviewField }
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                code: 'VALIDATION_INVALID_DATA',
                errors: error.errors
            });
        }
        logger.error('Error reviewing evidence', { error });
        return res.status(500).json({ success: false, code: 'APP_EVIDENCE_REVIEW_FAILED' });
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
    reviewEvidence
};
