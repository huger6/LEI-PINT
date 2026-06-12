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

const registerDeviceTokenBody = z.object({
    fcm_token: z.string().trim().min(1, 'VALIDATION_FCM_TOKEN_REQUIRED'),
    device_name: z.string().trim().max(128).optional(),
    platform: z.enum(['android', 'ios']).default('android')
});

const unregisterDeviceTokenBody = z.object({
    fcm_token: z.string().trim().min(1, 'VALIDATION_FCM_TOKEN_REQUIRED')
});

const updateGlobalPreferenceBody = z.object({
    send_push: z.boolean().optional(),
    send_email: z.boolean().optional(),
    is_enabled: z.boolean().optional()
}).refine(
    (data) => data.send_push !== undefined || data.send_email !== undefined || data.is_enabled !== undefined,
    { message: 'VALIDATION_UPDATE_AT_LEAST_ONE_FIELD_REQUIRED' }
);

const updateUserPreferenceBody = z.object({
    send_push: z.boolean().nullable().optional(),
    send_email: z.boolean().nullable().optional(),
    is_enabled: z.boolean().nullable().optional()
}).refine(
    (data) => data.send_push !== undefined || data.send_email !== undefined || data.is_enabled !== undefined,
    { message: 'VALIDATION_UPDATE_AT_LEAST_ONE_FIELD_REQUIRED' }
);

const preferenceIdParam = z.object({
    preferenceId: positiveIntIdRule
});

const definitionIdParam = z.object({
    definitionId: positiveIntIdRule
});

module.exports = {
    listNotificationsQuery,
    notificationIdParam,
    registerDeviceTokenBody,
    unregisterDeviceTokenBody,
    updateGlobalPreferenceBody,
    updateUserPreferenceBody,
    preferenceIdParam,
    definitionIdParam
};
