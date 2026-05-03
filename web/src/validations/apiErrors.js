const GENERIC_FALLBACK = 'Something went wrong. Please try again.';

const formatRetryAfter = (seconds) => {
  if (!seconds || Number.isNaN(Number(seconds))) return null;
  const s = Number(seconds);
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`;
  const m = Math.ceil(s / 60);
  return `${m} minute${m === 1 ? '' : 's'}`;
};

const CODE_MESSAGES = {
  // Login
  AUTH_INVALID_CREDENTIALS: { message: 'Invalid email/username or password.' },
  AUTH_ACCOUNT_DEACTIVATED: { message: 'This account has been deactivated.' },
  AUTH_ACCOUNT_LOCKED: {
    message: (data) => {
      const wait = formatRetryAfter(data?.retryAfter);
      return wait
        ? `Too many failed attempts. Please try again in ${wait}.`
        : 'Too many failed attempts. Please try again later.';
    },
  },
  AUTH_RATE_LIMIT_LOGIN: { message: 'Too many login attempts. Please wait before trying again.' },
  AUTH_EMAIL_NOT_CONFIRMED: { message: 'Your email is not confirmed. Please confirm it before signing in.' },

  // Register
  AUTH_CREDENTIALS_CONFLICT: { message: 'An account with that email or username already exists.' },
  AUTH_ROLE_NOT_REGISTERABLE: { message: 'The selected role cannot be registered through this form.' },
  AUTH_PROFILE_IMAGE_STORAGE_FAILED: { message: 'There was a problem saving your profile picture. Please try again.' },
  AUTH_REGISTER_EMAIL_FAILED: { message: 'Account created, but the confirmation email could not be sent. Please use "Resend confirmation".' },
  AUTH_REGISTER_FAILED: { message: 'Registration failed. Please try again.' },
  AUTH_RATE_LIMIT_REGISTER: { message: 'Too many registration attempts. Please wait an hour before trying again.' },

  // Email confirmation
  AUTH_TOKEN_INVALID_OR_USED: { message: 'This link is invalid or has already been used.' },
  AUTH_TOKEN_EXPIRED: { message: 'This link has expired. Please request a new one.' },
  AUTH_TOKEN_INVALID_OR_EXPIRED: { message: 'This link is invalid or has expired.' },
  AUTH_TOKEN_REQUIRED: { message: 'A token is required to complete this action.' },
  AUTH_EMAIL_CONFIRM_FAILED: { message: 'We could not confirm your email. Please try again.' },

  // Resend confirmation
  AUTH_RESEND_RATE_LIMITED: {
    message: (data) => {
      const wait = formatRetryAfter(data?.retryAfter);
      return wait
        ? `Please wait ${wait} before requesting another email.`
        : 'Please wait a moment before requesting another email.';
    },
  },
  AUTH_CONFIRMATION_EMAIL_FAILED: { message: 'We could not send the confirmation email. Please try again.' },
  AUTH_RESEND_CONFIRMATION_FAILED: { message: 'Failed to resend the confirmation email. Please try again.' },

  // Forgot password
  AUTH_EMAIL_INVALID: { message: 'Please provide a valid email address.', field: 'email' },
  AUTH_RATE_LIMIT_FORGOT_PASSWORD: { message: 'Too many requests. Please wait an hour before trying again.' },

  // Reset password
  AUTH_PASSWORD_WEAK: { message: 'Password does not meet the security requirements.', field: 'newPassword' },
  AUTH_PASSWORD_RESET_SUCCESS: { message: 'Password reset successfully.' },

  // Change password
  AUTH_PASSWORD_FORMAT_INVALID: { message: 'Password does not meet the security requirements.', field: 'newPassword' },
  AUTH_CURRENT_PASSWORD_WRONG: { message: 'Current password is incorrect.', field: 'currentPassword' },
  AUTH_PASSWORD_SAME_AS_CURRENT: { message: 'New password must be different from the current one.', field: 'newPassword' },
  AUTH_PASSWORD_CHANGE_FAILED: { message: 'We could not update your password. Please try again.' },

  // Generic / session
  AUTH_SESSION_EXPIRED: { message: 'Your session has expired. Please sign in again.' },
  AUTH_SESSION_EXPIRED_OR_INVALID: { message: 'Your session is no longer valid. Please sign in again.' },
  AUTH_USER_INACTIVE_OR_NOT_FOUND: { message: 'Account not available. Please contact support.' },
  AUTH_USER_NOT_FOUND: { message: 'Account not found.' },
  AUTH_REFRESH_TOKEN_MISSING: { message: 'You are not signed in.' },
  AUTH_REQUEST_FAILED: { message: GENERIC_FALLBACK },
  AUTH_INVALID_LOCATION: { message: 'Selected location is invalid.', field: 'location_id' },
  AUTH_INVALID_LANGUAGE: { message: 'Selected language is invalid.', field: 'preferred_lang_id' },
  AUTH_INVALID_PROFILE_IMAGE: { message: 'The profile image is invalid.', field: 'profile_img_url' },
  VALIDATION_INVALID_DATA: { message: 'Please review the highlighted fields and try again.' },
};

const STATUS_FALLBACKS = {
  400: 'Please review the information you provided.',
  401: 'You are not authorised to perform this action.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource could not be found.',
  409: 'A conflict occurred. Please review your input.',
  410: 'This link has expired.',
  429: 'Too many requests. Please wait before trying again.',
  500: 'A server error occurred. Please try again later.',
  502: 'The server is temporarily unavailable. Please try again later.',
  503: 'The service is temporarily unavailable. Please try again later.',
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
  preferred_lang_id: 'preferred_lang_id',
  location_id: 'location_id',
  service_line_id: 'service_line_id',
  areas: 'areas',
  identifier: 'identifier',
  profile_img_url: 'profile_img_url',
};

export const resolveErrorMessage = (error) => {
  if (!error) return GENERIC_FALLBACK;
  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
    return 'Could not reach the server. Check your connection and try again.';
  }

  const status = error?.response?.status;
  const data = error?.response?.data;
  const code = data?.code;

  if (code && CODE_MESSAGES[code]) {
    const entry = CODE_MESSAGES[code];
    return typeof entry.message === 'function'
      ? entry.message(data?.data)
      : entry.message;
  }

  if (status && STATUS_FALLBACKS[status]) return STATUS_FALLBACKS[status];

  return GENERIC_FALLBACK;
};

export const resolveErrorField = (error) => {
  const code = error?.response?.data?.code;
  const entry = code ? CODE_MESSAGES[code] : null;
  return entry?.field ?? null;
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
      'Invalid value.';
  }
  return result;
};

export const isCode = (error, code) => error?.response?.data?.code === code;
