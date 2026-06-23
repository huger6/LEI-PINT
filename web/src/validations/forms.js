// Form-level validation functions that compose individual rules from rules.js.
import i18n from '../i18n';
import {
	validateBiography,
	validateBirthdate,
	validateConsultantAreas,
	validateEmail,
	validateFullName,
	validateIdentifier,
	validateMatch,
	validatePassword,
	validatePasswordPresence,
	validatePhoneNumber,
	validatePositiveIntId,
	validateRequiredPositiveIntId,
	validateUsername,
} from './rules';

const tl = (field) => i18n.t(`validation.fields.${field}`, { defaultValue: field });

const collect = (entries) => {
	const errors = {};
	for (const [field, message] of entries) {
		if (message) errors[field] = message;
	}
	return errors;
};

/** Validates the login form (identifier + password). */
export const validateLoginForm = (form) =>
	collect([
		['identifier', validateIdentifier(form.identifier)],
		['password', validatePasswordPresence(form.password)],
	]);

/** Validates registration step 2 (name, username, email, password). */
export const validateRegisterStep2 = (form) =>
	collect([
		['full_name', validateFullName(form.full_name)],
		['username', validateUsername(form.username)],
		['email_address', validateEmail(form.email_address)],
		['password', validatePassword(form.password)],
	]);

/** Validates registration step 3 (phone, birthdate, biography, language). Consultant role adds area validation. */
export const validateRegisterStep3 = (form, role, { phoneMetadata } = {}) => {
	const entries = [
		['phone_number', validatePhoneNumber(form.phone_number, phoneMetadata)],
		['birthdate', validateBirthdate(form.birthdate)],
		['biography', validateBiography(form.biography)],
		['language_id', validatePositiveIntId(form.language_id, tl('language_id'))],
		['location_id', validatePositiveIntId(form.location_id, tl('location_id'))],
	];
	if (role === 'Consultant') {
		entries.push(['areas', validateConsultantAreas(form.areas)]);
	}
	// SLL registration disabled — only Consultant can self-register.
	// if (role === 'Service Line Leader') {
	// 	entries.push([
	// 		'service_line_id',
	// 		validateRequiredPositiveIntId(form.service_line_id, tl('service_line_id')),
	// 	]);
	// }
	return collect(entries);
};

export const validateForgotPasswordForm = (form) =>
	collect([['email', validateEmail(form.email)]]);

export const validateResendConfirmationForm = (form) =>
	collect([['email', validateEmail(form.email)]]);

export const validateResetPasswordForm = (form) =>
	collect([
		['newPassword', validatePassword(form.newPassword)],
		[
			'confirmPassword',
			validateMatch(form.confirmPassword, form.newPassword, tl('confirmPassword')),
		],
	]);

export const validateChangePasswordForm = (form) => {
	const errors = collect([
		['currentPassword', validatePasswordPresence(form.currentPassword)],
		['newPassword', validatePassword(form.newPassword)],
		[
			'confirmPassword',
			validateMatch(form.confirmPassword, form.newPassword, tl('confirmPassword')),
		],
	]);
	if (
		!errors.newPassword &&
		!errors.currentPassword &&
		form.newPassword === form.currentPassword
	) {
		errors.newPassword = i18n.t('validation.passwordSameAsCurrent');
	}
	return errors;
};

/** Validates the admin create-user form. Applies role-specific rules (e.g. areas for Consultant). */
export const validateCreateUserForm = (form, role, { phoneMetadata } = {}) =>
	collect([
		['fullName', validateFullName(form.fullName)],
		['username', validateUsername(form.username)],
		['emailAddress', validateEmail(form.emailAddress)],
		['password', validatePassword(form.password)],
		['phone_number', validatePhoneNumber(form.phoneNumber, phoneMetadata)],
		['birthdate', validateBirthdate(form.birthdate)],
		['biography', validateBiography(form.biography)],
		...(role === 'Consultant'
			? [['areas', validateConsultantAreas(form.areas)]]
			: []),
	]);

/** Returns true if the errors object contains at least one non-empty error message. */
export const hasErrors = (errors) =>
	errors && Object.values(errors).some((v) => Boolean(v));
