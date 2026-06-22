const { QueryTypes } = require('sequelize');
const { models, sequelize } = require('../config/db');
const { logger } = require('../utils/logger');
const { handleZodError } = require('../utils/responseHelper');
const { publicBadgeLinkParam, publicCertificateParam } = require('../validations/public.validation');
const QRCode = require('qrcode');

// Escape DB/user-controlled values before interpolating into the public HTML
// pages, preventing stored XSS (e.g. a badge title or full name with markup).
const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const viewPublicBadge = async (req, res) => {
    try {
        let validated;
        try {
            validated = publicBadgeLinkParam.parse(req.params);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_PARAMS');
            throw error;
        }

        const { link } = validated;

        const awarded = await models.awarded_badges.findOne({
            where: { public_verification_link: link, is_published: true },
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
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });

        if (req.query.format === 'json' || req.get('accept') === 'application/json') {
            const payload = {
                awarded_at: awarded.awarded_at,
                expiration_at: awarded.expiration_at,
                is_published: awarded.is_published,
                public_verification_link: awarded.public_verification_link,
                badge: {
                    title: badge.badge_title,
                    description: badge.badge_description,
                    image: badge.badge_img_url,
                    points: badge.badge_points
                },
                user: {
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
                <title>Badge verification - ${escapeHtml(badge.badge_title || 'Badge')}</title>
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
                        <img class="badge-img" src="${escapeHtml(badge.badge_img_url || 'https://via.placeholder.com/140')}" alt="badge image" />
                        <div class="meta">
                            <h1>${escapeHtml(badge.badge_title || 'Badge')}</h1>
                            <p class="muted">Awarded to <strong>${escapeHtml(user.full_name || 'Unknown')}</strong></p>
                            <p class="muted">Awarded at: <strong>${escapeHtml(awarded.awarded_at ? new Date(awarded.awarded_at).toLocaleString() : '—')}</strong></p>
                            <p class="muted">Badge type: <strong>${escapeHtml(badge.badge_type || '—')}</strong> &nbsp; • &nbsp; Points: <strong>${escapeHtml(badge.badge_points || 0)}</strong></p>
                        </div>
                        <div>
                            <img class="qr" src="${qrDataUrl}" alt="QR code to verify badge" />
                        </div>
                    </div>

                    <hr />
                    <section>
                        <h3>About this badge</h3>
                        <p>${escapeHtml(badge.badge_description || 'No description provided.')}</p>
                    </section>

                    <section>
                        <h3>Verification</h3>
                        <p class="muted">You can verify this badge using the unique verification link:</p>
                        <p><a href="${escapeHtml(verifyUrl)}">${escapeHtml(verifyUrl)}</a></p>
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
        let validated;
        try {
            validated = publicCertificateParam.parse(req.params);
        } catch (error) {
            if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_PARAMS');
            throw error;
        }

        const { applicationGuid } = validated;

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
        const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 300, margin: 1 });

        if (req.query.format === 'json' || req.get('accept') === 'application/json') {
            return res.json({
                application_guid: applicationGuid,
                certificate: application.certificate || null,
                badge: { title: badge.badge_title, description: badge.badge_description, points: badge.badge_points },
                user: { full_name: user.full_name, user_guid: user.user_guid },
                verification_url: verifyUrl
            });
        }

        const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Certificate - ${escapeHtml(badge.badge_title || 'Certificate')}</title></head><body><div style="max-width:900px;margin:24px auto;padding:24px;border:1px solid #eee;border-radius:8px;font-family:Arial,Helvetica,sans-serif;color:#222"><h1>${escapeHtml(badge.badge_title || 'Certificate')}</h1><p>Awarded to <strong>${escapeHtml(user.full_name || 'Unknown')}</strong></p><p>Issued: ${escapeHtml(application.closed_at ? new Date(application.closed_at).toLocaleString() : '—')}</p><p><img src="${qrDataUrl}" alt="QR" style="width:160px"></p><p>Verify: <a href="${escapeHtml(verifyUrl)}">${escapeHtml(verifyUrl)}</a></p></div></body></html>`;

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(html);
    } catch (error) {
        logger.error('Error rendering public certificate page', { error });
        res.status(500).send('<h1>Internal server error</h1>');
    }
};

// ── Public badge catalog (JSON) — used by the public /softinsa microsite ──────
const PUBLIC_BADGE_INCLUDE = [
	{ model: models.areas, as: 'area', attributes: ['area_name', 'area_slug'] },
	{ model: models.service_lines, as: 'service_line', attributes: ['service_line_name', 'sl_slug'] },
	{ model: models.learning_paths, as: 'learning_path', attributes: ['path_title', 'path_slug'] },
	{
		model: models.progression_stages,
		as: 'progression_stage',
		attributes: ['stage_title', 'stage_sequence'],
		include: [{ model: models.stage_codes, as: 'stage_code', attributes: ['stage_code'] }],
	},
];

const serializeBadge = (b) => ({
	badge_slug: b.badge_slug,
	badge_title: b.badge_title,
	badge_description: b.badge_description,
	badge_img_url: b.badge_img_url,
	badge_points: b.badge_points,
	badge_type: b.badge_type,
	expiration_duration_days: b.expiration_duration_days,
	area: b.area ? { name: b.area.area_name, slug: b.area.area_slug } : null,
	service_line: b.service_line ? { name: b.service_line.service_line_name, slug: b.service_line.sl_slug } : null,
	learning_path: b.learning_path ? { title: b.learning_path.path_title, slug: b.learning_path.path_slug } : null,
	stage: b.progression_stage ? {
		title: b.progression_stage.stage_title,
		code: b.progression_stage.stage_code?.stage_code || null,
	} : null,
});

const listPublicBadges = async (req, res) => {
	try {
		const rows = await models.badges.findAll({
			where: { is_active: true },
			attributes: ['badge_id', 'badge_slug', 'badge_title', 'badge_description', 'badge_img_url', 'badge_points', 'badge_type', 'expiration_duration_days'],
			include: PUBLIC_BADGE_INCLUDE,
			order: [['badge_title', 'ASC']],
		});
		return res.status(200).json({ success: true, data: rows.map(serializeBadge) });
	} catch (error) {
		logger.error('Error listing public badges', { error });
		return res.status(500).json({ success: false, code: 'PUBLIC_BADGES_FAILED' });
	}
};

const getPublicBadgeBySlug = async (req, res) => {
	try {
		const badge = await models.badges.findOne({
			where: { badge_slug: req.params.slug, is_active: true },
			attributes: ['badge_id', 'badge_slug', 'badge_title', 'badge_description', 'badge_img_url', 'badge_points', 'badge_type', 'expiration_duration_days'],
			include: [
				...PUBLIC_BADGE_INCLUDE,
				{
					model: models.badge_requirements,
					as: 'badge_requirements',
					where: { is_active: true },
					required: false,
					attributes: ['requirement_title', 'requirement_description'],
				},
				{
					model: models.skills,
					as: 'skills',
					through: { attributes: [] },
					attributes: ['skill_name', 'skill_description'],
				},
			],
		});
		if (!badge) return res.status(404).json({ success: false, code: 'PUBLIC_BADGE_NOT_FOUND' });

		const data = serializeBadge(badge);
		data.requirements = (badge.badge_requirements || []).map((r) => ({
			title: r.requirement_title,
			description: r.requirement_description,
		}));
		data.skills = (badge.skills || []).map((s) => ({
			name: s.skill_name,
			description: s.skill_description,
		}));
		return res.status(200).json({ success: true, data });
	} catch (error) {
		logger.error('Error fetching public badge', { error });
		return res.status(500).json({ success: false, code: 'PUBLIC_BADGE_FAILED' });
	}
};

// GET /api/public/verify/:link — JSON credential verification for the SPA
// /verify/:link page. Returns a clean payload (no internal PKs) and the
// expiration status, so the public page can show a trustworthy result.
const verifyAwardedBadge = async (req, res) => {
	try {
		let validated;
		try {
			validated = publicBadgeLinkParam.parse(req.params);
		} catch (error) {
			if (error.name === 'ZodError') return handleZodError(res, error, 'VALIDATION_INVALID_PARAMS');
			throw error;
		}

		const awarded = await models.awarded_badges.findOne({
			where: { public_verification_link: validated.link, is_published: true },
			include: [
				{
					model: models.badge_applications, as: 'application',
					include: [{
						model: models.badges, as: 'badge',
						attributes: ['badge_slug', 'badge_title', 'badge_description', 'badge_img_url', 'badge_points', 'badge_type'],
					}],
				},
				{
					model: models.consultants, as: 'user',
					include: [{ model: models.users, as: 'user', attributes: ['full_name', 'user_guid'] }],
				},
			],
		});

		if (!awarded) {
			return res.status(404).json({ success: false, code: 'PUBLIC_BADGE_NOT_FOUND' });
		}

		const badge = awarded.application?.badge || {};
		const user = awarded.user?.user || {};
		const isExpired = awarded.expiration_at ? new Date(awarded.expiration_at) < new Date() : false;

		return res.status(200).json({
			success: true,
			data: {
				verification_link: awarded.public_verification_link,
				awarded_at: awarded.awarded_at,
				expiration_at: awarded.expiration_at,
				is_expired: isExpired,
				recipient: { full_name: user.full_name || null, user_guid: user.user_guid || null },
				badge: {
					slug: badge.badge_slug || null,
					title: badge.badge_title || null,
					description: badge.badge_description || null,
					image: badge.badge_img_url || null,
					points: badge.badge_points ?? null,
					type: badge.badge_type || null,
				},
			},
		});
	} catch (error) {
		logger.error('Error verifying awarded badge', { error });
		return res.status(500).json({ success: false, code: 'PUBLIC_VERIFY_FAILED' });
	}
};

// GET /api/public/consultants/:guid — public consultant profile for the
// microsite: name, avatar and published earned badges only (no sensitive data).
const getPublicConsultantProfile = async (req, res) => {
	try {
		const guid = String(req.params.guid || '').trim();
		if (!guid) return res.status(400).json({ success: false, code: 'VALIDATION_INVALID_PARAMS' });

		// Any active user has a public profile (consultants show earned badges;
		// other roles show identity only).
		const user = await models.users.findOne({
			where: { user_guid: guid, is_active: true },
			attributes: ['user_id', 'full_name', 'user_guid', 'profile_img_url', 'user_role']
		});
		if (!user) return res.status(404).json({ success: false, code: 'PUBLIC_PROFILE_NOT_FOUND' });

		const awardedAll = await models.awarded_badges.findAll({
			where: { user_id: user.user_id, is_published: true },
			attributes: ['awarded_at', 'expiration_at', 'points_snapshot', 'public_verification_link', 'is_featured'],
			include: [{
				model: models.badge_applications, as: 'application',
				attributes: ['application_id'],
				include: [{
					model: models.badges, as: 'badge',
					attributes: ['badge_slug', 'badge_title', 'badge_img_url', 'badge_points', 'badge_type']
				}]
			}],
			order: [['awarded_at', 'DESC']]
		});

		// The consultant curates their public gallery: if they featured any
		// badges, show only those; otherwise show all earned badges by default.
		const hasFeatured = awardedAll.some((a) => a.is_featured);
		const awarded = hasFeatured ? awardedAll.filter((a) => a.is_featured) : awardedAll;

		const badges = awarded.map((a) => {
			const b = a.application?.badge || {};
			return {
				slug: b.badge_slug || null,
				title: b.badge_title || null,
				image: b.badge_img_url || null,
				points: b.badge_points ?? null,
				type: b.badge_type || null,
				awarded_at: a.awarded_at,
				is_expired: a.expiration_at ? new Date(a.expiration_at) < new Date() : false,
				verification_link: a.public_verification_link || null
			};
		});

		// Totals reflect every earned badge; the gallery (badges) may be a curated subset.
		const totalPoints = awardedAll.reduce((sum, a) => sum + (a.points_snapshot || 0), 0);

		return res.status(200).json({
			success: true,
			data: {
				full_name: user.full_name,
				user_guid: user.user_guid,
				profile_img_url: user.profile_img_url || null,
				role: user.user_role,
				total_badges: awardedAll.length,
				total_points: totalPoints,
				badges
			}
		});
	} catch (error) {
		logger.error('Error fetching public consultant profile', { error });
		return res.status(500).json({ success: false, code: 'PUBLIC_PROFILE_FAILED' });
	}
};

// GET /api/public/profiles — a small showcase of profiles for the microsite:
// one Talent Manager, one Service Line Leader and two Consultants (preferring
// consultants who have earned badges so their profile isn't empty).
const getFeaturedProfiles = async (req, res) => {
	try {
		const attrs = ['full_name', 'user_guid', 'profile_img_url', 'user_role'];
		const pickOne = (role) => models.users.findOne({
			where: { user_role: role, is_active: true },
			attributes: attrs,
			order: [['user_id', 'ASC']]
		});

		const [tm, sll] = await Promise.all([pickOne('Talent Manager'), pickOne('Service Line Leader')]);

		// Two consultants that have at least one published earned badge.
		const consultants = await sequelize.query(
			`SELECT u.full_name, u.user_guid, u.profile_img_url, u.user_role
			 FROM users u
			 WHERE u.user_role = 'Consultant' AND u.is_active = true
			 ORDER BY (u.username = 'rita.soares') DESC,
			          (EXISTS (SELECT 1 FROM awarded_badges ab WHERE ab.user_id = u.user_id)) DESC,
			          u.full_name
			 LIMIT 2`,
			{ type: QueryTypes.SELECT }
		);

		const toCard = (u) => u && ({
			guid: u.user_guid,
			name: u.full_name,
			role: u.user_role,
			img: u.profile_img_url || null
		});

		const profiles = [toCard(tm), toCard(sll), ...consultants.map(toCard)].filter(Boolean);

		return res.status(200).json({ success: true, data: profiles });
	} catch (error) {
		logger.error('Error fetching featured profiles', { error });
		return res.status(500).json({ success: false, code: 'PUBLIC_PROFILES_FAILED' });
	}
};

module.exports = { viewPublicBadge, viewPublicCertificate, listPublicBadges, getPublicBadgeBySlug, verifyAwardedBadge, getPublicConsultantProfile, getFeaturedProfiles };

