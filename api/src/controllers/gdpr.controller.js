const { models } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const { sendTopicUpdate } = require('../services/firebase.service');
const { consentBodySchema, policyIdParam, createPolicyBody, updatePolicyBody, newPolicyVersionBody, policyTypeParam } = require('../validations/gdpr.validation');

// ─── User-facing endpoints ──────────────────────────────────────────────────

const getActivePolicies = async (req, res) => {
    try {
        const policies = await models.gdpr_policies.findAll({
            where: { is_active: true },
            attributes: ['policy_id', 'policy_type', 'version', 'policy_text', 'is_mandatory', 'created_at'],
            order: [['policy_type', 'ASC'], ['created_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: policies });
    } catch (error) {
        logger.error('Error fetching active GDPR policies', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICIES_FETCH_FAILED' });
    }
};

const getPolicyById = async (req, res) => {
    try {
        let validated;
        try { validated = policyIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const policy = await models.gdpr_policies.findByPk(validated.id, {
            attributes: ['policy_id', 'policy_type', 'version', 'policy_text', 'is_mandatory', 'is_active', 'created_at', 'updated_at']
        });

        if (!policy) {
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        return res.status(200).json({ success: true, data: policy });
    } catch (error) {
        logger.error('Error fetching GDPR policy', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_FETCH_FAILED' });
    }
};

const recordConsent = async (req, res) => {
    try {
        let validated;
        try { validated = consentBodySchema.parse(req.body); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const userId = req.user.sub;

        const policy = await models.gdpr_policies.findOne({
            where: { policy_id: validated.policy_id, is_active: true }
        });

        if (!policy) {
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        const consent = await models.gdpr_consent_history.create({
            user_id: userId,
            policy_id: validated.policy_id,
            action: validated.action,
            ip_address: req.ip || req.headers['x-forwarded-for'] || null,
            user_agent: req.headers['user-agent'] || null
        });

        // Update consultant gdpr_accepted flag
        if (validated.action === 'ACCEPTED') {
            await models.consultants.update({ gdpr_accepted: true }, { where: { user_id: userId } });
        } else if (validated.action === 'REVOKED') {
            const mandatoryPolicies = await models.gdpr_policies.findAll({
                where: { is_mandatory: true, is_active: true },
                attributes: ['policy_id']
            });

            let allAccepted = true;
            for (const p of mandatoryPolicies) {
                const lastConsent = await models.gdpr_consent_history.findOne({
                    where: { user_id: userId, policy_id: p.policy_id },
                    order: [['consented_at', 'DESC']]
                });
                if (!lastConsent || lastConsent.action !== 'ACCEPTED') {
                    allAccepted = false;
                    break;
                }
            }

            await models.consultants.update({ gdpr_accepted: allAccepted }, { where: { user_id: userId } });
        }

        return res.status(201).json({ success: true, code: 'GDPR_CONSENT_RECORDED', data: { consent_id: consent.consent_id } });
    } catch (error) {
        logger.error('Error recording GDPR consent', { error });
        return res.status(500).json({ success: false, code: 'GDPR_CONSENT_FAILED' });
    }
};

const getConsentHistory = async (req, res) => {
    try {
        const userId = req.user.sub;

        const history = await models.gdpr_consent_history.findAll({
            where: { user_id: userId },
            include: [{ model: models.gdpr_policies, as: 'policy', attributes: ['policy_type', 'version'] }],
            order: [['consented_at', 'DESC']]
        });

        return res.status(200).json({ success: true, data: history });
    } catch (error) {
        logger.error('Error fetching consent history', { error });
        return res.status(500).json({ success: false, code: 'GDPR_CONSENT_HISTORY_FAILED' });
    }
};

const requestDataExport = async (req, res) => {
    try {
        const userId = req.user.sub;

        const consultant = await models.consultants.findOne({
            where: { user_id: userId },
            include: [
                { model: models.users, as: 'user', attributes: { exclude: ['password_hash'] } },
                { model: models.awarded_badges, as: 'awarded_badges' },
                { model: models.points_history, as: 'points_history' }
            ]
        });

        if (!consultant) {
            return res.status(404).json({ success: false, code: 'USER_NOT_FOUND' });
        }

        const consentHistory = await models.gdpr_consent_history.findAll({
            where: { user_id: userId },
            order: [['consented_at', 'DESC']]
        });

        const exportData = {
            exported_at: new Date().toISOString(),
            user: consultant.user,
            consultant_profile: {
                user_id: consultant.user_id,
                gdpr_accepted: consultant.gdpr_accepted
            },
            awarded_badges: consultant.awarded_badges || [],
            points_history: consultant.points_history || [],
            consent_history: consentHistory
        };

        return res.status(200).json({ success: true, data: exportData });
    } catch (error) {
        logger.error('Error exporting user data', { error });
        return res.status(500).json({ success: false, code: 'GDPR_DATA_EXPORT_FAILED' });
    }
};

const requestAccountDeletion = async (req, res) => {
    try {
        const userId = req.user.sub;

        const consultant = await models.consultants.findOne({ where: { user_id: userId } });
        if (!consultant) {
            return res.status(404).json({ success: false, code: 'USER_NOT_FOUND' });
        }

        // Soft-delete: deactivate and anonymize personal data
        await models.users.update(
            {
                full_name: `[Deleted User ${userId}]`,
                email_address: `deleted_${userId}@anonymized.local`,
                username: `deleted_${userId}`,
                phone_number: null,
                profile_img_url: null,
                is_active: false
            },
            { where: { user_id: userId } }
        );

        await models.consultants.update(
            { gdpr_accepted: false, is_active: false },
            { where: { user_id: userId } }
        );

        // Record revocation of all active policies
        const activePolicies = await models.gdpr_policies.findAll({
            where: { is_active: true },
            attributes: ['policy_id']
        });

        for (const policy of activePolicies) {
            await models.gdpr_consent_history.create({
                user_id: userId,
                policy_id: policy.policy_id,
                action: 'REVOKED',
                ip_address: req.ip || null,
                user_agent: req.headers['user-agent'] || null
            });
        }

        return res.status(200).json({ success: true, code: 'GDPR_ACCOUNT_DELETED' });
    } catch (error) {
        logger.error('Error processing account deletion', { error });
        return res.status(500).json({ success: false, code: 'GDPR_ACCOUNT_DELETION_FAILED' });
    }
};

const getLatestPolicy = async (req, res) => {
    try {
        let validated;
        try { validated = policyTypeParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const policy = await models.gdpr_policies.findOne({
            where: { policy_type: validated.type, is_active: true },
            attributes: ['policy_id', 'policy_type', 'version', 'policy_text', 'is_mandatory', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        if (!policy) {
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        return res.status(200).json({ success: true, data: policy });
    } catch (error) {
        logger.error('Error fetching latest GDPR policy', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_FETCH_FAILED' });
    }
};

// ─── Admin endpoints ────────────────────────────────────────────────────────

const adminCreatePolicy = async (req, res) => {
    try {
        let validated;
        try { validated = createPolicyBody.parse(req.body); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const adminId = req.user.sub;

        const policy = await models.gdpr_policies.create({
            ...validated,
            is_active: true,
            created_by: adminId,
            updated_by: adminId
        });

        await sendTopicUpdate("new_data", 22);
        return res.status(201).json({ success: true, data: policy });
    } catch (error) {
        logger.error('Error creating GDPR policy', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_CREATE_FAILED' });
    }
};

const adminUpdatePolicy = async (req, res) => {
    try {
        let paramValidated;
        try { paramValidated = policyIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        let bodyValidated;
        try { bodyValidated = updatePolicyBody.parse(req.body); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const policy = await models.gdpr_policies.findByPk(paramValidated.id);
        if (!policy) {
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        await policy.update({ ...bodyValidated, updated_by: req.user.sub });

        await sendTopicUpdate("new_data", 22);
        return res.status(200).json({ success: true, data: policy });
    } catch (error) {
        logger.error('Error updating GDPR policy', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_UPDATE_FAILED' });
    }
};

const adminDeactivatePolicy = async (req, res) => {
    try {
        let validated;
        try { validated = policyIdParam.parse(req.params); }
        catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const policy = await models.gdpr_policies.findByPk(validated.id);
        if (!policy) {
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        await policy.update({ is_active: false, updated_by: req.user.sub });

        await sendTopicUpdate("new_data", 22);
        return res.status(200).json({ success: true, code: 'GDPR_POLICY_DEACTIVATED' });
    } catch (error) {
        logger.error('Error deactivating GDPR policy', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_DEACTIVATE_FAILED' });
    }
};

const adminNewPolicyVersion = async (req, res) => {
    const transaction = await models.gdpr_policies.sequelize.transaction();
    try {
        let paramValidated;
        try { paramValidated = policyIdParam.parse(req.params); }
        catch (error) {
            await transaction.rollback();
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        let bodyValidated;
        try { bodyValidated = newPolicyVersionBody.parse(req.body); }
        catch (error) {
            await transaction.rollback();
            if (error.name === 'ZodError') return handleZodError(res, error);
            throw error;
        }

        const oldPolicy = await models.gdpr_policies.findByPk(paramValidated.id, { transaction });
        if (!oldPolicy) {
            await transaction.rollback();
            return res.status(404).json({ success: false, code: 'GDPR_POLICY_NOT_FOUND' });
        }

        if (!oldPolicy.is_active) {
            await transaction.rollback();
            return res.status(400).json({ success: false, code: 'GDPR_POLICY_ALREADY_INACTIVE' });
        }

        const adminId = req.user.sub;

        await oldPolicy.update({ is_active: false, updated_by: adminId }, { transaction });

        const newPolicy = await models.gdpr_policies.create({
            policy_type: oldPolicy.policy_type,
            version: bodyValidated.version,
            policy_text: bodyValidated.policy_text,
            is_mandatory: bodyValidated.is_mandatory !== undefined ? bodyValidated.is_mandatory : oldPolicy.is_mandatory,
            is_active: true,
            created_by: adminId,
            updated_by: adminId
        }, { transaction });

        await transaction.commit();

        await sendTopicUpdate("new_data", 22);
        return res.status(201).json({ success: true, data: newPolicy });
    } catch (error) {
        await transaction.rollback();
        logger.error('Error creating new GDPR policy version', { error });
        return res.status(500).json({ success: false, code: 'GDPR_POLICY_VERSION_FAILED' });
    }
};

module.exports = {
    getActivePolicies,
    getPolicyById,
    getLatestPolicy,
    recordConsent,
    getConsentHistory,
    requestDataExport,
    requestAccountDeletion,
    adminCreatePolicy,
    adminUpdatePolicy,
    adminDeactivatePolicy,
    adminNewPolicyVersion
};
