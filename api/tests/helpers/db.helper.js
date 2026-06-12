'use strict';

const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { models } = require('../../src/config/db');

const TEST_PASSWORD = 'Test@12345';

async function createTestUser({ full_name, username, email_address, user_role = 'Consultant', force_password_change = false }) {
    const password_hash = await bcrypt.hash(TEST_PASSWORD, 10);
    return models.users.create({
        full_name,
        username,
        email_address,
        password_hash,
        user_role,
        is_active: true,
        email_confirmed: true,
        force_password_change,
        language_id: 1
    });
}

async function createAdminUser({ username, email_address, full_name = 'Test Admin' }) {
    const user = await createTestUser({ full_name, username, email_address, user_role: 'Administrator' });
    await models.administrators.create({ user_id: user.user_id, is_super_admin: false });
    return user;
}

async function createConsultantUser({ username, email_address, full_name = 'Test Consultant' }) {
    const user = await createTestUser({ full_name, username, email_address, user_role: 'Consultant' });
    await models.consultants.create({ user_id: user.user_id });
    return user;
}

async function createTalentManagerUser({ username, email_address, full_name = 'Test TM' }) {
    const user = await createTestUser({ full_name, username, email_address, user_role: 'Talent Manager' });
    await models.talent_managers.create({ user_id: user.user_id });
    return user;
}

async function deleteUser(userId) {
    // Null out administrator FK references (created_by/updated_by) before deleting
    const byThisAdmin = { [Op.or]: [{ created_by: userId }, { updated_by: userId }] };
    const nullByAdmin = { created_by: null, updated_by: null };
    await Promise.all([
        models.learning_paths.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.service_lines.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.areas.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.progression_stages.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.badges.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.stage_codes.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.badge_requirements.update(nullByAdmin, { where: byThisAdmin }).catch(() => {}),
        models.users.update({ approved_by: null }, { where: { approved_by: userId } }).catch(() => {}),
    ]);

    await models.consultant_areas.destroy({ where: { user_id: userId } });
    await models.consultants.destroy({ where: { user_id: userId } });
    await models.talent_managers.destroy({ where: { user_id: userId } });
    await models.service_line_leaders.destroy({ where: { user_id: userId } });
    await models.administrators.destroy({ where: { user_id: userId } });
    await models.user_account_tokens.destroy({ where: { user_id: userId } });
    await models.user_refresh_tokens.destroy({ where: { user_id: userId } });
    await models.users.destroy({ where: { user_id: userId } });
}

async function deleteUserByEmail(email_address) {
    const user = await models.users.findOne({ where: { email_address }, attributes: ['user_id'] });
    if (user) await deleteUser(user.user_id);
}

module.exports = {
    TEST_PASSWORD,
    createTestUser,
    createAdminUser,
    createConsultantUser,
    createTalentManagerUser,
    deleteUser,
    deleteUserByEmail
};

