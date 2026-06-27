/**
 * Resolves a valid front-end origin for links embedded in e-mails / notifications.
 *
 * FRONTEND_URL is often unset or protocol-only (e.g. "http://"), and APP_URL points
 * at the API host — using either directly produced broken links like
 * "http:///objectives" or links to the API instead of the web app. We pick the first
 * candidate that parses to a real host, falling back to the e-mail front-end URLs'
 * origin, then to the local dev front-end.
 *
 * @returns {string} An absolute origin with no trailing slash (e.g. "https://app.example.com").
 */
const resolveFrontendUrl = () => {
    const candidates = [
        process.env.FRONTEND_URL,
        process.env.FRONTEND_EMAIL_CONFIRMATION_URL,
        process.env.FRONTEND_RESET_PASSWORD_URL,
        process.env.APP_URL,
    ];
    for (const candidate of candidates) {
        if (!candidate) continue;
        try {
            const url = new URL(candidate);
            if (url.host) return `${url.protocol}//${url.host}`;
        } catch {
            // Not an absolute URL with a host — skip it.
        }
    }
    return 'http://localhost:5173';
};

module.exports = { resolveFrontendUrl };
