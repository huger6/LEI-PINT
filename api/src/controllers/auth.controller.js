const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { QueryTypes } = require('sequelize');
const { sequelize, models } = require('../config/db');
const { registerSchema } = require('../validations/auth.validation');
const { sendConfirmationEmail } = require('../services/emailService');

const register = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        // Validate req
        const validatedData = registerSchema.parse(req.body);
        const { password, ...userData } = validatedData;

        // Admins are not allowed to register through here
        if (userData.user_role === 'Administrator') {
            return res.status(400).json({
                success: false,
                message: "Administrator is not a valid registration role."
            });
        }

        // Validate if username or email is already in use
        const [existingUser] = await sequelize.query(
            `SELECT user_id, email_address, username
            FROM users
            WHERE email_address=:email OR username=:username
            LIMIT 1`,
            {
                replacements: {
                    email: userData.email_address,
                    username: userData.username
                },
                type: QueryTypes.SELECT
            }
        );

        if (existingUser) {
            await t.rollback();
            return res.status(409).json({
                success: false,
                message: "Username or email is already in use."
            });
        }

        // Hash pw
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = await models.users.create({
            full_name: userData.full_name,
            username: userData.username,
            email_address: userData.email_address,
            password_hash: passwordHash,
            user_role: userData.user_role,
            phone_number: userData.phone_number,
            birthdate: userData.birthdate,
            profile_img_url: userData.profile_img_url,
            location_id: userData.location_id,
            preferred_lang_id: userData.preferred_lang_id,
            approved_by: null, // Needs to be approved by admin if TM or SLL
            is_active: true,
            email_confirmed: false,
            force_password_change: true
        }, { transaction: t });

        // Insert on specialized tables
        if (userData.user_role === 'Consultant') {
            await models.consultants.create({
                user_id: newUser.user_id,
                biography: userData.biography
            }, { transaction: t });

            await models.consultant_areas.bulkCreate(
                userData.areas.map((area) => ({
                    user_id: newUser.user_id,
                    area_id: area.area_id,
                    is_primary: area.is_primary
                })),
                { transaction: t }
            );
        }
        else if (userData.user_role === 'Talent Manager') {
            await models.talent_managers.create({
                user_id: newUser.user_id,
                biography: userData.biography
            }, { transaction: t });
        }
        else if (userData.user_role === 'Service Line Leader') {
            await models.service_line_leaders.create({
                user_id: newUser.user_id,
                service_line_id: userData.service_line_id,
                biography: userData.biography
            }, { transaction: t });
        }

        // Generate email confirmation token
        const tokenValue = crypto.randomBytes(32).toString('hex');
        await models.user_account_tokens.create({
            user_id: newUser.user_id,
            token_value: tokenValue,
            token_type: 'CONFIRMATION',
            expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000) // 8h
        }, { transaction: t });

        // Commit changes
        await t.commit();

        // Send confirmation email
        await sendConfirmationEmail(userData.email_address, userData.full_name, tokenValue, userData.preferred_lang_id);

        return res.status(201).json({
            success: true,
            message: "Registration completed successfully. Please, check your e-mail to confirm the account."
        })
    } catch(error) {
        // DB rollback
        if (t) await t.rollback();

        // Validation error
        if (error.name === 'ZodError') {
            return res.status(400).json({
                success: false,
                message: "Invalid data.",
                errors: error.errors.map(err => ({ field: err.path[0], message: err.message }))
            });
        }

        // Dups error (more of a failsafe as it is checked above as well)
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({
                success: false,
                message: "Username or e-mail is already in use. Please try again with different credentials."
            });
        }

        return res.status(500).json({
            succes: false,
            message: "Error processing user registration."
        });
    }
};

const confirmEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const [tokenRecord] = await sequelize.query(
            `SELECT *
            FROM user_account_tokens
            WHERE token_value=:token AND token_type='CONFIRMATION' AND is_used=false
            LIMIT 1`,
            {
                replacements: {
                    token: token,
                },
                type: QueryTypes.SELECT
            }
        );
    
        // Invalid token
        if (!tokenRecord) {
            return res.status(400).json({
                success: false,
                message: "Token is invalid or was already used."
            })
        }
        // Expired token
        else if (new Date() > tokenRecord.expires_at) {
            return res.status(410).json({
                success: false,
                message: "Token has expired."
            })
        }

        // Activate account
        await sequelize.transaction(async (t) => {
            await models.users.update(
                { email_confirmed: true },
                { where: {
                    user_id: tokenRecord.user_id
                }, transaction: t }
            );
            // Make sure token isn't used again
            await models.user_account_tokens.update(
                { is_used: true },
                {
                    where: { token_id: tokenRecord.token_id },
                    transaction: t
                }
            );
        });

        return res.status(200).json({
            success: true,
            message: "E-mail confirmed. You can now do your first login (remember you will need to change your password)"
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Error confirming account." 
        });
    }
};

module.exports = {
    register,
    confirmEmail
}