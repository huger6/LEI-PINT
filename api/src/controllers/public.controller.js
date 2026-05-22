const { models } = require('../config/db');
const { logger } = require('../utils/logger');

const viewPublicBadge = async (req, res) => {
    try {
        const { link } = req.params;

        const awarded = await models.awarded_badges.findOne({
            where: { public_verification_link: link },
            include: [
                { model: models.badge_applications, as: 'application', include: [{ model: models.badges, as: 'badge' }] },
                { model: models.consultants, as: 'user', include: [{ model: models.users, as: 'user', attributes: ['full_name', 'user_guid'] }] }
            ]
        });

        if (!awarded) {
            res.status(404).send('<h1>Badge not found</h1>');
            return;
        }

        const app = awarded.application || {};
        const badge = app.badge || {};
        const consultant = awarded.user || {};
        const user = consultant.user || {};

        const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl = `${appUrl.replace(/\/$/, '')}/public/badge/${encodeURIComponent(awarded.public_verification_link)}`;
        const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(verifyUrl)}`;

        if (req.query.format === 'json' || req.get('accept') === 'application/json') {
            const payload = {
                awarded_badges_id: awarded.awarded_badges_id,
                awarded_at: awarded.awarded_at,
                expiration_at: awarded.expiration_at,
                is_published: awarded.is_published,
                public_verification_link: awarded.public_verification_link,
                badge: {
                    badge_id: badge.badge_id,
                    title: badge.badge_title,
                    description: badge.badge_description,
                    image: badge.badge_img_url,
                    points: badge.badge_points
                },
                user: {
                    user_id: consultant.user_id,
                    full_name: user.full_name,
                    user_guid: user.user_guid
                },
                verification_url: verifyUrl
            };

            res.json(payload);
            return;
        }

        const html = `
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8" />
                <meta name="viewport" content="width=device-width,initial-scale=1" />
                <title>Badge verification - ${badge.badge_title || 'Badge'}</title>
                <style>
                    body { font-family: Arial, Helvetica, sans-serif; padding: 24px; color: #222 }
                    .card { max-width: 900px; margin: 0 auto; border: 1px solid #eee; padding: 24px; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.06) }
                    .header { display:flex; gap:16px; align-items:center }
                    .badge-img { width:140px; height:140px; object-fit:cover; border-radius:8px; border:1px solid #ddd }
                    .meta { flex:1 }
                    .qr { width:180px }
                    .muted { color:#666; font-size:0.95rem }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <img class="badge-img" src="${badge.badge_img_url || 'https://via.placeholder.com/140'}" alt="badge image" />
                        <div class="meta">
                            <h1>${badge.badge_title || 'Badge'}</h1>
                            <p class="muted">Awarded to <strong>${user.full_name || 'Unknown'}</strong></p>
                            <p class="muted">Awarded at: <strong>${awarded.awarded_at ? new Date(awarded.awarded_at).toLocaleString() : '—'}</strong></p>
                            <p class="muted">Badge type: <strong>${badge.badge_type || '—'}</strong> &nbsp; • &nbsp; Points: <strong>${badge.badge_points || 0}</strong></p>
                        </div>
                        <div>
                            <img class="qr" src="${qrUrl}" alt="QR code to verify badge" />
                        </div>
                    </div>

                    <hr />
                    <section>
                        <h3>About this badge</h3>
                        <p>${badge.badge_description || 'No description provided.'}</p>
                    </section>

                    <section>
                        <h3>Verification</h3>
                        <p class="muted">You can verify this badge using the unique verification link:</p>
                        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
                    </section>
                </div>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
    } catch (error) {
        logger.error('Error rendering public badge page', { error });
        res.status(500).send('<h1>Internal server error</h1>');
    }
};

const viewPublicCertificate = async (req, res) => {
    try {
        const { applicationGuid } = req.params;

        const application = await models.badge_applications.findOne({
            where: { application_guid: applicationGuid },
            include: [
                { model: models.badges, as: 'badge' },
                { model: models.consultants, as: 'user', include: [{ model: models.users, as: 'user', attributes: ['full_name', 'user_guid'] }] },
                { model: models.certificates, as: 'certificate' }
            ]
        });

        if (!application) {
            res.status(404).send('<h1>Certificate or application not found</h1>');
            return;
        }

        const badge = application.badge || {};
        const consultant = application.user || {};
        const user = consultant.user || {};

        const appUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`;
        const verifyUrl = `${appUrl.replace(/\/$/, '')}/public/certificate/${encodeURIComponent(applicationGuid)}`;
        const qrUrl = `https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(verifyUrl)}`;

        if (req.query.format === 'json' || req.get('accept') === 'application/json') {
            return res.json({
                application_guid: applicationGuid,
                certificate: application.certificate || null,
                badge: { title: badge.badge_title, description: badge.badge_description, points: badge.badge_points },
                user: { full_name: user.full_name, user_guid: user.user_guid },
                verification_url: verifyUrl
            });
        }

        const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate - ${badge.badge_title || 'Certificate'}</title></head><body><div style="max-width:900px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:8px;font-family:Arial,Helvetica,sans-serif;color:#222"><h1>${badge.badge_title || 'Certificate'}</h1><p>Awarded to <strong>${user.full_name || 'Unknown'}</strong></p><p>Issued: ${application.closed_at ? new Date(application.closed_at).toLocaleString() : '—'}</p><p><img src="${qrUrl}" alt="QR" style="width:160px"></p><p>Verify: <a href="${verifyUrl}">${verifyUrl}</a></p></div></body></html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        logger.error('Error rendering public certificate page', { error });
        res.status(500).send('<h1>Internal server error</h1>');
    }
};

module.exports = { viewPublicBadge, viewPublicCertificate };

