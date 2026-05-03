const FIELD_LABELS = {
  full_name: 'Full name',
  username: 'Username',
  email_address: 'Email',
  email: 'Email',
  identifier: 'Email or username',
  password: 'Password',
  newPassword: 'New password',
  currentPassword: 'Current password',
  confirmPassword: 'Confirmation password',
  phone_number: 'Phone number',
  birthdate: 'Date of birth',
  biography: 'Biography',
  preferred_lang_id: 'Preferred language',
  location_id: 'Location',
  service_line_id: 'Service line',
  areas: 'Areas of expertise',
};

const labelOf = (field) => FIELD_LABELS[field] ?? field;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._]+$/;
const PHONE_REGEX = /^\+\d{7,15}$/;

const required = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && value.trim() === '');

export const validateFullName = (value) => {
  if (required(value)) return `${labelOf('full_name')} is required.`;
  const v = value.trim();
  if (v.length < 2) return 'Name must have a minimum of 2 characters.';
  if (v.length > 255) return 'Name must have a maximum of 255 characters.';
  return null;
};

export const validateUsername = (value) => {
  if (required(value)) return `${labelOf('username')} is required.`;
  const v = value.trim();
  if (v.length < 3) return 'Username must have a minimum of 3 characters.';
  if (v.length > 50) return 'Username must have a maximum of 50 characters.';
  if (!USERNAME_REGEX.test(v))
    return 'Username can only contain letters, numbers, dots and underscores.';
  return null;
};

export const validateEmail = (value) => {
  if (required(value)) return 'Email is required.';
  const v = value.trim();
  if (v.length > 255) return 'Email is too long.';
  if (!EMAIL_REGEX.test(v)) return 'Invalid e-mail format.';
  return null;
};

export const validateIdentifier = (value) => {
  if (required(value)) return 'Email or username is required.';
  const v = value.trim();
  if (EMAIL_REGEX.test(v)) return null;
  if (USERNAME_REGEX.test(v) && v.length >= 3 && v.length <= 50) return null;
  return 'Please enter a valid email or username.';
};

export const PASSWORD_RULES = [
  { label: 'At least 8 characters', test: (v) => typeof v === 'string' && v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v ?? '') },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v ?? '') },
  { label: 'One digit', test: (v) => /[0-9]/.test(v ?? '') },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v ?? '') },
];

export const validatePassword = (value) => {
  if (required(value)) return 'Password is required.';
  if (value.length > 100) return 'Password must have a maximum of 100 characters.';
  const failed = PASSWORD_RULES.find((rule) => !rule.test(value));
  if (failed) return `Password must include: ${failed.label.toLowerCase()}.`;
  return null;
};

export const validatePasswordPresence = (value) => {
  if (required(value)) return 'Password is required.';
  return null;
};

export const validatePhoneNumber = (value) => {
  if (required(value)) return null;
  const v = value.replace(/\s+/g, '');
  if (!PHONE_REGEX.test(v))
    return 'Invalid format. Use the international standard (must include prefix, e.g. +351912345678).';
  return null;
};

export const validateBirthdate = (value) => {
  if (required(value)) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date.';
  const today = new Date();
  if (date > today) return 'Date of birth cannot be in the future.';
  let age = today.getFullYear() - date.getFullYear();
  const monthDelta = today.getMonth() - date.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  if (age < 16) return 'You must be at least 16 years old to register.';
  return null;
};

export const validateBiography = (value) => {
  if (required(value)) return null;
  if (value.length > 5000) return 'Biography is too long.';
  const wordCount = value.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount > 500) return 'Biography cannot exceed 500 words.';
  return null;
};

export const validatePositiveIntId = (value, label = 'Identifier') => {
  if (required(value)) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return `${label} must be a positive integer.`;
  return null;
};

export const validateRequiredPositiveIntId = (value, label = 'Identifier') => {
  if (required(value)) return `${label} is required.`;
  return validatePositiveIntId(value, label);
};

export const validateConsultantAreas = (areas) => {
  if (!Array.isArray(areas) || areas.length < 1)
    return 'You must select at least 1 area.';
  if (areas.length > 5) return "You can't select more than 5 areas.";
  const ids = areas.map((a) => a.area_id);
  if (new Set(ids).size !== ids.length)
    return "You can't select the same area more than once.";
  const primaries = areas.filter((a) => a.is_primary).length;
  if (primaries > 1) return 'Only one area can be defined as primary.';
  return null;
};

export const validateMatch = (value, other, label = 'Confirmation') => {
  if (required(value)) return `${label} is required.`;
  if (value !== other) return 'Passwords do not match.';
  return null;
};
