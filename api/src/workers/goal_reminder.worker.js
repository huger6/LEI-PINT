const cron = require('node-cron');
const { QueryTypes } = require('sequelize');
const { models } = require('../models');
const { createNotification, resolvePreferences } = require('../services/notifications.service');
const emailService = require('../services/email.service');
const { logger } = require('../utils/logger');

const GOAL_REMINDER_SCHEDULE = '0 * * * *';
const AUTO_REMINDER_DAYS_BEFORE = 7;
const sequelize = models.goals.sequelize;
const APP_URL = (process.env.APP_URL || '').replace(/\/$/, '');
const OBJECTIVE_DUE_DEFINITION_ID = 6;

// Send the objective reminder email when the recipient has it enabled.
const maybeEmailObjectiveReminder = async (goal) => {
    if (!goal.email_address) return;
    const prefs = await resolvePreferences(OBJECTIVE_DUE_DEFINITION_ID, goal.user_id);
    if (!prefs.is_enabled || !prefs.send_email) return;
    await emailService.sendObjectiveReminderEmail(goal.email_address, {
        name: goal.full_name,
        title: goal.event_title,
        objectivesUrl: `${APP_URL}/objectives`,
        lang: goal.language_iso
    });
};

let isRunning = false;

const manualRemindersQuery = `
    SELECT
        g.goal_id,
        g.user_id,
        g.event_title,
        g.event_end_date,
        g.reminder_at,
        b.badge_title,
        b.badge_slug,
        u.email_address,
        u.full_name,
        ln.language_iso
    FROM goals g
    LEFT JOIN badges b ON b.badge_id = g.badge_id
    INNER JOIN users u ON u.user_id = g.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
    LEFT JOIN languages ln ON ln.language_id = u.language_id
    WHERE g.reminder_at IS NOT NULL
      AND g.reminder_at <= NOW()
      AND g.reminder_sent = FALSE
`;

const autoRemindersQuery = `
    SELECT
        g.goal_id,
        g.user_id,
        g.event_title,
        g.event_end_date,
        b.badge_title,
        b.badge_slug,
        u.email_address,
        u.full_name,
        ln.language_iso,
        EXTRACT(DAY FROM g.event_end_date - NOW())::int AS days_remaining
    FROM goals g
    LEFT JOIN badges b ON b.badge_id = g.badge_id
    INNER JOIN users u ON u.user_id = g.user_id AND u.user_role = 'Consultant' AND u.is_active = TRUE
    LEFT JOIN languages ln ON ln.language_id = u.language_id
    WHERE g.event_end_date IS NOT NULL
      AND g.event_end_date > NOW()
      AND g.event_end_date <= NOW() + INTERVAL '${AUTO_REMINDER_DAYS_BEFORE} days'
      AND g.auto_reminder_sent = FALSE
`;

const processGoalReminders = async () => {
    if (isRunning) {
        logger.warn('Goal reminder worker skipped because the previous run is still active');
        return;
    }

    isRunning = true;

    try {
        const manualReminders = await sequelize.query(manualRemindersQuery, { type: QueryTypes.SELECT });

        for (const goal of manualReminders) {
            try {
                await createNotification({
                    userId: goal.user_id,
                    definitionId: 6,
                    notificationType: 'OBJECTIVES',
                    title: 'NOTIF_GOAL_REMINDER_TITLE',
                    body: 'NOTIF_GOAL_REMINDER_BODY',
                    meta: {
                        goalTitle: goal.event_title,
                        badgeTitle: goal.badge_title || null
                    },
                    url: '/objectives'
                });

                await maybeEmailObjectiveReminder(goal);

                await models.goals.update(
                    { reminder_sent: true },
                    { where: { goal_id: goal.goal_id } }
                );
            } catch (err) {
                logger.error('Failed to send goal reminder', {
                    error: err,
                    goalId: goal.goal_id
                });
            }
        }

        const autoReminders = await sequelize.query(autoRemindersQuery, { type: QueryTypes.SELECT });

        for (const goal of autoReminders) {
            try {
                await createNotification({
                    userId: goal.user_id,
                    definitionId: 6,
                    notificationType: 'OBJECTIVES',
                    title: 'NOTIF_GOAL_DEADLINE_APPROACHING_TITLE',
                    body: 'NOTIF_GOAL_DEADLINE_APPROACHING_BODY',
                    meta: {
                        goalTitle: goal.event_title,
                        badgeTitle: goal.badge_title || null,
                        daysRemaining: goal.days_remaining
                    },
                    url: '/objectives'
                });

                await maybeEmailObjectiveReminder(goal);

                await models.goals.update(
                    { auto_reminder_sent: true },
                    { where: { goal_id: goal.goal_id } }
                );
            } catch (err) {
                logger.error('Failed to send auto goal reminder', {
                    error: err,
                    goalId: goal.goal_id
                });
            }
        }

        const totalAlerts = manualReminders.length + autoReminders.length;
        if (totalAlerts > 0) {
            logger.info('Goal reminder worker completed', {
                manualReminders: manualReminders.length,
                autoReminders: autoReminders.length
            });
        }
    } catch (error) {
        logger.error('Goal reminder worker failed', { error });
    } finally {
        isRunning = false;
    }
};

const task = cron.schedule(GOAL_REMINDER_SCHEDULE, processGoalReminders);

module.exports = {
    task,
    processGoalReminders
};
