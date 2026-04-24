const { models, sequelize } = require('../config/db');
const { Op } = require('sequelize');
const { logger } = require('../utils/logger');
const validations = require('../validations/applications.validation');
const { generateSignedUploadUrl } = require('../services/storageService');


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

module.exports = {
    getApplications,
    getApplicationById,
    startApplication,
    getUploadUrl,
    upsertEvidence,
    submitApplication
};