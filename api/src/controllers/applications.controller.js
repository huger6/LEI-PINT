const { models, sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const validations = require('../validations/applications.validation');
const gamificationValidations = require('../validations/gamification.validation');
const { generateSignedUploadUrl } = require('../services/storage.service');
const gamificationService = require('../services/gamification.service');


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
                    message: "SLL profile not configured properly."
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
                message: "Invalid query parameters.",
                errors: error.errors
            });
        }

        logger.error('Error fetching applications', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Application not found."
            });
        }

        if (role === 'Consultant' && application.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: "Access denied. You can only view your own applications."
            });
        }

        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(userId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied. This application does not belong to your Service Line."
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
                message: "Invalid application ID."
            });
        }

        logger.error('Error fetching application details', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Badge not found or inactive."
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
                message: `You already have an active application in state '${existingApp.application_state}'.`,
                data: { applicationId: existingApp.application_id }
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
            message: "Application started successfully.",
            data: newApp
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data.',
                errors: error.issues || error.errors
            });
        }
        logger.error('Error starting application', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "You can only upload evidences for your own 'Open applications'."
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
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error generating upload URL in controller', { error });
        return res.status(500).json({
            success: false,
            message: "Error generating upload link."
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
                message: "Application not found."
            });
        }

        // If it has been submitted, allow no changes
        if (application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                message: "You can only edit evidences in an 'Open' application."
            });
        }

        // Check if requirement belongs to this application's badge
        const requirement = await models.badge_requirements.findOne({
            where: { requirement_id: requirementId, badge_id: application.badge_id }
        });

        if (!requirement) {
            return res.status(400).json({
                success: false,
                message: "Requirement does not belong to this badge."
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
            message: created ? "Evidence added successfully." : "Evidence updated successfully.",
            data: evidence
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors
            });
        }

        logger.error('Error upserting evidence', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
                message: "Application not found."
            });
        }

        if (application.application_state !== 'Open') {
            return res.status(403).json({
                success: false,
                message: `Application is/was already ${application.application_state}.`
            });
        }

        // Do we have all evidence necessary
        const totalRequirements = application.badge.badge_requirements.length;
        const submittedEvidences = application.requirements_evidences.length;

        if (submittedEvidences < totalRequirements) {
            return res.status(400).json({
                success: false,
                message: "Missing evidences. You must submit an evidence for every requirement before submitting the application.",
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

        return res.status(200).json({
            success: true,
            message: "Application submitted successfully! It is now pending validation.",
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
                message: "Invalid application identifier.",
                errors: error.errors
            });
        }

        logger.error('Error submitting application', { error });
        return res.status(500).json({
            success: false,
            message: "Internal server error."
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
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const { applicationGuid } = gamificationValidations.applicationGuidParamSchema.parse(req.params);
        const { action, reviewerNotes } = gamificationValidations.reviewApplicationSchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }]
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        // SLL may only review applications within their own Service Line
        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(reviewerId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. This application does not belong to your Service Line.'
                });
            }
        }

        // Validate state machine transitions
        const state = application.application_state;
        if (action === 'review' && state !== 'Submitted') {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot request review for an application in state '${state}'. Expected 'Submitted'.`
            });
        }
        if ((action === 'accept' || action === 'reject') && !['Submitted', 'In validation'].includes(state)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Cannot ${action} an application in state '${state}'.`
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

        return res.status(200).json({
            success: true,
            message: `Application ${newState.toLowerCase()} successfully.`,
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
                message: 'Invalid data.',
                errors: error.errors
            });
        }
        logger.error('Error validating application', { error });
        return res.status(500).json({ success: false, message: 'Internal server error.' });
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
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const { applicationGuid, evidenceId } = gamificationValidations.evidenceIdParamSchema.parse(req.params);
        const { approved, reviewNotes } = gamificationValidations.reviewEvidenceSchema.parse(req.body);

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [{ model: models.badges, as: 'badge' }]
        });

        if (!application) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        if (!['Submitted', 'In validation'].includes(application.application_state)) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Evidence can only be reviewed on applications in 'Submitted' or 'In validation' state.`
            });
        }

        // SLL may only review evidences for badges in their own Service Line
        if (role === 'Service Line Leader') {
            const sllInfo = await models.service_line_leaders.findByPk(reviewerId);
            if (!sllInfo || application.badge.service_line_id !== sllInfo.service_line_id) {
                await transaction.rollback();
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. This application does not belong to your Service Line.'
                });
            }
        }

        const evidence = await models.requirements_evidences.findOne({
            where: { evidence_id: evidenceId, application_id: application.application_id }
        });

        if (!evidence) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Evidence not found.' });
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
            message: `Evidence ${approved ? 'approved' : 'rejected'} successfully.`,
            data: { evidenceId, approved, reviewField }
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data.',
                errors: error.errors
            });
        }
        logger.error('Error reviewing evidence', { error });
        return res.status(500).json({ success: false, message: 'Internal server error.' });
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