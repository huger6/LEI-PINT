const { logger } = require('../utils/logger');

/**
 * Send a notification to Microsoft Teams as an Adaptive Card.
 * Use a Teams "Workflows" (Power Automate) webhook — "Post to a channel when a
 * webhook request is received" — NOT the deprecated Office 365 connector webhook,
 * which does not accept this { type:'message', attachments:[adaptive card] } payload.
 */
const sendTeamsNotification = async (webhookUrl, { title, body, badgeImageUrl, verificationUrl }) => {
    const card = {
        type: 'message',
        attachments: [{
            contentType: 'application/vnd.microsoft.card.adaptive',
            content: {
                $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
                type: 'AdaptiveCard',
                version: '1.4',
                body: [
                    {
                        type: 'ColumnSet',
                        columns: [
                            ...(badgeImageUrl ? [{
                                type: 'Column',
                                width: 'auto',
                                items: [{ type: 'Image', url: badgeImageUrl, size: 'Small' }]
                            }] : []),
                            {
                                type: 'Column',
                                width: 'stretch',
                                items: [
                                    { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', wrap: true },
                                    { type: 'TextBlock', text: body, wrap: true, spacing: 'Small' }
                                ]
                            }
                        ]
                    }
                ],
                actions: verificationUrl ? [
                    { type: 'Action.OpenUrl', title: 'View Badge', url: verificationUrl }
                ] : []
            }
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(card)
        });

        if (!response.ok) {
            // Capture the body so failures are diagnosable (e.g. a deprecated O365
            // connector URL rejecting the Adaptive Card — use a Teams Workflow instead).
            const detail = await response.text().catch(() => '');
            logger.warn('Teams webhook non-OK', { status: response.status, detail: detail.slice(0, 300) });
        }
        return response.ok;
    } catch (error) {
        logger.error('Failed to send Teams notification', { error: error.message });
        return false;
    }
};

/**
 * Send a notification to Slack via Incoming Webhook (Block Kit).
 */
const sendSlackNotification = async (webhookUrl, { title, body, badgeImageUrl, verificationUrl }) => {
    const blocks = [
        {
            type: 'section',
            text: { type: 'mrkdwn', text: `*${title}*\n${body}` },
            ...(badgeImageUrl ? { accessory: { type: 'image', image_url: badgeImageUrl, alt_text: 'Badge' } } : {})
        }
    ];

    if (verificationUrl) {
        blocks.push({
            type: 'actions',
            elements: [{
                type: 'button',
                text: { type: 'plain_text', text: 'View Badge' },
                url: verificationUrl,
                style: 'primary'
            }]
        });
    }

    const payload = { blocks, text: `${title} - ${body}` };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            logger.warn('Slack webhook non-OK', { status: response.status, detail: detail.slice(0, 300) });
        }
        return response.ok;
    } catch (error) {
        logger.error('Failed to send Slack notification', { error: error.message });
        return false;
    }
};

/**
 * Broadcast a notification to all active webhooks.
 * Fire-and-forget: does not block the caller or throw on individual failures.
 */
const broadcastToWebhooks = async (models, { title, body, badgeImageUrl, verificationUrl }) => {
    try {
        const webhooks = await models.integration_webhooks.findAll({
            where: { is_active: true }
        });

        if (!webhooks.length) return;

        const payload = { title, body, badgeImageUrl, verificationUrl };

        const promises = webhooks.map((wh) => {
            if (wh.platform === 'teams') return sendTeamsNotification(wh.webhook_url, payload);
            if (wh.platform === 'slack') return sendSlackNotification(wh.webhook_url, payload);
            return Promise.resolve(false);
        });

        Promise.allSettled(promises).then((results) => {
            const failed = results.filter(r => r.status === 'rejected' || r.value === false).length;
            if (failed > 0) {
                logger.warn(`Integration webhooks: ${failed}/${results.length} failed`);
            }
        });
    } catch (error) {
        logger.error('Error broadcasting to webhooks', { error: error.message });
    }
};

module.exports = {
    sendTeamsNotification,
    sendSlackNotification,
    broadcastToWebhooks
};
