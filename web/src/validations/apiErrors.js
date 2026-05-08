import i18n from '../i18n';

const ta = (key, opts) => i18n.t(key, { ns: 'api', ...opts });

export const resolveApiCodeMessage = (code, fallback = '') => {
	if (!code) return fallback;
	const translated = ta(code, { defaultValue: '' });
	return translated || fallback;
};

const formatRetryAfter = (seconds) => {
	if (!seconds || Number.isNaN(Number(seconds))) return null;
	const s = Number(seconds);
	if (s < 60) return ta('retrySeconds', { count: s });
	const m = Math.ceil(s / 60);
	return ta('retryMinutes', { count: m });
};

const DYNAMIC_MESSAGES = {
	AUTH_ACCOUNT_LOCKED: (data) => {
		const wait = formatRetryAfter(data?.retryAfter);
		return wait ? ta('AUTH_ACCOUNT_LOCKED_WAIT', { wait }) : ta('AUTH_ACCOUNT_LOCKED');
	},
	AUTH_RESEND_RATE_LIMITED: (data) => {
		const wait = formatRetryAfter(data?.retryAfter);
		return wait ? ta('AUTH_RESEND_RATE_LIMITED_WAIT', { wait }) : ta('AUTH_RESEND_RATE_LIMITED');
	},
};

const CODE_FIELDS = {
	AUTH_EMAIL_INVALID: 'email',
	AUTH_PASSWORD_WEAK: 'newPassword',
	AUTH_PASSWORD_FORMAT_INVALID: 'newPassword',
	AUTH_CURRENT_PASSWORD_WRONG: 'currentPassword',
	AUTH_PASSWORD_SAME_AS_CURRENT: 'newPassword',
	AUTH_INVALID_LOCATION: 'location_id',
	AUTH_INVALID_LANGUAGE: 'language_id',
	AUTH_INVALID_PROFILE_IMAGE: 'profile_img_url',
};

export const FIELD_FROM_BACKEND = {
	full_name: 'full_name',
	username: 'username',
	email_address: 'email_address',
	email: 'email',
	password: 'password',
	newPassword: 'newPassword',
	currentPassword: 'currentPassword',
	phone_number: 'phone_number',
	birthdate: 'birthdate',
	biography: 'biography',
	language_id: 'language_id',
	preferred_lang_id: 'language_id',
	location_id: 'location_id',
	service_line_id: 'service_line_id',
	areas: 'areas',
	identifier: 'identifier',
	profile_img_url: 'profile_img_url',
};

export const resolveErrorMessage = (error) => {
	if (!error) return ta('GENERIC_FALLBACK');
	if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
		return ta('NETWORK_ERROR');
	}

	const status = error?.response?.status;
	const data = error?.response?.data;
	const code = data?.code;

	if (code) {
		if (DYNAMIC_MESSAGES[code]) return DYNAMIC_MESSAGES[code](data?.data);
		const translated = ta(code, { defaultValue: '' });
		if (translated) return translated;
	}

	if (status) {
		const statusMsg = ta(`STATUS_${status}`, { defaultValue: '' });
		if (statusMsg) return statusMsg;
	}

	return ta('GENERIC_FALLBACK');
};

export const resolveErrorField = (error) => {
	const code = error?.response?.data?.code;
	return code ? (CODE_FIELDS[code] ?? null) : null;
};

export const extractFieldErrors = (error) => {
	const data = error?.response?.data;
	const issues = data?.errors;
	if (!Array.isArray(issues)) return {};
	const result = {};
	for (const issue of issues) {
		const field = issue?.field;
		if (!field) continue;
		const mapped = FIELD_FROM_BACKEND[field];
		if (!mapped) continue;
		result[mapped] =
			issue?.message ||
			issue?.detail ||
			i18n.t('validation.invalidValue');
	}
	return result;
};

export const isCode = (error, code) => error?.response?.data?.code === code;
