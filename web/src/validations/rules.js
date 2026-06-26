// Individual field validation rules used across all forms. Each returns null on success or an i18n error key.
import i18n from '../i18n';
import { validatePhoneWithMetadata } from '../services/libphonenumber/validator';

// Translation helper.
const t = (key, opts) => i18n.t(key, opts);

// Returns the translated label for a field name.
const labelOf = (field) => t(`validation.fields.${field}`, { defaultValue: field });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;
const PHONE_REGEX_FALLBACK = /^\+\d{7,15}$/;

// Returns true when a value is undefined, null, or an empty/whitespace string.
const required = (value) =>
	value === undefined ||
	value === null ||
	(typeof value === 'string' && value.trim() === '');

// Validates full name: required, 2-255 characters.
export const validateFullName = (value) => {
	if (required(value)) return t('validation.fieldRequired', { field: labelOf('full_name') });
	const v = value.trim();
	if (v.length < 2) return t('validation.nameMinLength');
	if (v.length > 255) return t('validation.nameMaxLength');
	return null;
};

// Validates username: required, 3-50 chars, allowed characters only.
export const validateUsername = (value) => {
	if (required(value)) return t('validation.fieldRequired', { field: labelOf('username') });
	const v = value.trim();
	if (v.length < 3) return t('validation.usernameMinLength');
	if (v.length > 50) return t('validation.usernameMaxLength');
	if (!USERNAME_REGEX.test(v)) return t('validation.usernameFormat');
	return null;
};

// Validates email: required, max 255 chars, valid format.
export const validateEmail = (value) => {
	if (required(value)) return t('validation.emailRequired');
	const v = value.trim();
	if (v.length > 255) return t('validation.emailTooLong');
	if (!EMAIL_REGEX.test(v)) return t('validation.emailInvalid');
	return null;
};

// Validates a login identifier that may be either an email or a username.
export const validateIdentifier = (value) => {
	if (required(value)) return t('validation.identifierRequired');
	const v = value.trim();
	if (EMAIL_REGEX.test(v)) return null;
	if (USERNAME_REGEX.test(v) && v.length >= 3 && v.length <= 50) return null;
	return t('validation.identifierInvalid');
};

/** Password strength rules: min 8 chars, uppercase, lowercase, digit, and special character. */
export const PASSWORD_RULES = [
	{ key: 'minLength', test: (v) => typeof v === 'string' && v.length >= 8 },
	{ key: 'uppercase', test: (v) => /[A-Z]/.test(v ?? '') },
	{ key: 'lowercase', test: (v) => /[a-z]/.test(v ?? '') },
	{ key: 'digit', test: (v) => /[0-9]/.test(v ?? '') },
	{ key: 'special', test: (v) => /[^A-Za-z0-9]/.test(v ?? '') },
];

// Validates password: required, max 100 chars, must satisfy all PASSWORD_RULES.
export const validatePassword = (value) => {
	if (required(value)) return t('validation.passwordRequired');
	if (value.length > 100) return t('validation.passwordMaxLength');
	const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
	if (failed) return t('validation.passwordMustInclude', { rule: t(`passwordRules.${failed.key}`).toLowerCase() });
	return null;
};

// Validates that a password is present, without enforcing strength rules.
export const validatePasswordPresence = (value) => {
	if (required(value)) return t('validation.passwordRequired');
	return null;
};

// Validates an optional phone number against a fallback regex and optional libphonenumber metadata.
export const validatePhoneNumber = (value, metadata) => {
	if (required(value)) return null;
	const v = value.replace(/\s+/g, '');
	if (!PHONE_REGEX_FALLBACK.test(v)) return t('validation.phoneInvalid');
	if (metadata) {
		const result = validatePhoneWithMetadata(v, metadata);
		if (!result.valid) return t('validation.phoneInvalid');
	}
	return null;
};

// Validates an optional birthdate: valid date, not in the future, minimum age 16.
export const validateBirthdate = (value) => {
	if (required(value)) return null;
	const date = value instanceof Date ? value : new Date(value);
	if (Number.isNaN(date.getTime())) return t('validation.dateInvalid');
	const today = new Date();
	if (date > today) return t('validation.dateFuture');
	let age = today.getFullYear() - date.getFullYear();
	const monthDelta = today.getMonth() - date.getMonth();
	if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
		age -= 1;
	}
	if (age < 16) return t('validation.dateMinAge');
	return null;
};

// Validates an optional biography: max 5000 chars and max 500 words.
export const validateBiography = (value) => {
	if (required(value)) return null;
	if (value.length > 5000) return t('validation.biographyTooLong');
	const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
	if (wordCount > 500) return t('validation.biographyMaxWords');
	return null;
};

// Validates an optional ID is a positive integer.
export const validatePositiveIntId = (value, label = 'Identifier') => {
	if (required(value)) return null;
	const n = Number(value);
	if (!Number.isInteger(n) || n <= 0) return t('validation.positiveInteger', { label });
	return null;
};

// Validates a required ID is present and a positive integer.
export const validateRequiredPositiveIntId = (value, label = 'Identifier') => {
	if (required(value)) return t('validation.fieldRequired', { field: label });
	return validatePositiveIntId(value, label);
};

// Validates a consultant's areas: 1-5 entries, no duplicates, at most one primary.
export const validateConsultantAreas = (areas) => {
	if (!Array.isArray(areas) || areas.length < 1) return t('validation.areasMin');
	if (areas.length > 5) return t('validation.areasMax');
	const ids = areas.map((a) => a.area_id);
	if (new Set(ids).size !== ids.length) return t('validation.areasDuplicate');
	const primaries = areas.filter((a) => a.is_primary).length;
	if (primaries > 1) return t('validation.areasPrimaryMax');
	return null;
};

// Validates a confirmation value is present and matches another value.
export const validateMatch = (value, other, label = 'Confirmation') => {
	if (required(value)) return t('validation.fieldRequired', { field: label });
	if (value !== other) return t('validation.passwordsDoNotMatch');
	return null;
};
