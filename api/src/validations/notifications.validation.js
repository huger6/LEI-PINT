const { z } = require('zod');
const { positiveIntIdRule } = require('./shared-rules');

const VALID_NOTIFICATION_TYPES = ['HOME', 'BADGES', 'APPLICATIONS', 'ACHIEVEMENTS', 'POINTS', 'OBJECTIVES', 'EVOLUTION', 'ANNOUNCEMENTS', 'SYSTEM'];

const listNotificationsQuery = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    type: z.enum(VALID_NOTIFICATION_TYPES).optional(),
    is_read: z.preprocess(
        (val) => (val === 'true' ? true : val === 'false' ? false : val),
        z.boolean()
    ).optional()
});

const notificationIdParam = z.object({
    notificationId: positiveIntIdRule
});

module.exports = {
    listNotificationsQuery,
    notificationIdParam
};
