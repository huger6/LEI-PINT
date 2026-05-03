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

const collect = (entries) => {
  const errors = {};
  for (const [field, message] of entries) {
    if (message) errors[field] = message;
  }
  return errors;
};

export const validateLoginForm = (form) =>
  collect([
    ['identifier', validateIdentifier(form.identifier)],
    ['password', validatePasswordPresence(form.password)],
  ]);

export const validateRegisterStep2 = (form) =>
  collect([
    ['full_name', validateFullName(form.full_name)],
    ['username', validateUsername(form.username)],
    ['email_address', validateEmail(form.email_address)],
    ['password', validatePassword(form.password)],
  ]);

export const validateRegisterStep3 = (form, role) => {
  const entries = [
    ['phone_number', validatePhoneNumber(form.phone_number)],
    ['birthdate', validateBirthdate(form.birthdate)],
    ['biography', validateBiography(form.biography)],
    ['preferred_lang_id', validatePositiveIntId(form.preferred_lang_id, 'Preferred language')],
    ['location_id', validatePositiveIntId(form.location_id, 'Location')],
  ];
  if (role === 'Consultant') {
    entries.push(['areas', validateConsultantAreas(form.areas)]);
  }
  if (role === 'Service Line Leader') {
    entries.push([
      'service_line_id',
      validateRequiredPositiveIntId(form.service_line_id, 'Service line'),
    ]);
  }
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
      validateMatch(form.confirmPassword, form.newPassword, 'Confirmation password'),
    ],
  ]);

export const validateChangePasswordForm = (form) => {
  const errors = collect([
    ['currentPassword', validatePasswordPresence(form.currentPassword)],
    ['newPassword', validatePassword(form.newPassword)],
    [
      'confirmPassword',
      validateMatch(form.confirmPassword, form.newPassword, 'Confirmation password'),
    ],
  ]);
  if (
    !errors.newPassword &&
    !errors.currentPassword &&
    form.newPassword === form.currentPassword
  ) {
    errors.newPassword = 'New password must be different from the current one.';
  }
  return errors;
};

export const hasErrors = (errors) =>
  errors && Object.values(errors).some((v) => Boolean(v));
