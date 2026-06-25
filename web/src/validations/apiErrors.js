import i18n from '../i18n';

// Translation helper scoped to the 'api' namespace.
const ta = (key, opts) => i18n.t(key, { ns: 'api', ...opts });

// Resolves a backend error code to a translated message, or returns the fallback.
export const resolveApiCodeMessage = (code, fallback = '') => {
	if (!code) return fallback;
	const translated = ta(code, { defaultValue: '' });
	return translated || fallback;
};

// Formats a retry-after duration (in seconds) into a human-readable seconds/minutes string.
const formatRetryAfter = (seconds) => {
	if (!seconds || Number.isNaN(Number(seconds))) return null;
	const s = Number(seconds);
	if (s < 60) return ta('retrySeconds', { count: s });
	const m = Math.ceil(s / 60);
	return ta('retryMinutes', { count: m });
};

// Maps error codes that need dynamic data (e.g. rate-limit wait time) to message builders.
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

// Maps error codes to the form field they should highlight.
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

// Maps backend field names to the frontend form field names.
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

// Resolves an axios error into a translated user-facing message (code, status, or generic fallback).
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

// Returns the form field associated with an error's code, or null.
export const resolveErrorField = (error) => {
	const code = error?.response?.data?.code;
	return code ? (CODE_FIELDS[code] ?? null) : null;
};

// Builds a field-to-message map from a backend validation error's issues array.
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

// Returns true when an error's code matches the given code.
export const isCode = (error, code) => error?.response?.data?.code === code;
