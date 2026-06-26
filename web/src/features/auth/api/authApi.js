// Authentication API: login, register, password reset, email confirmation, and session management.
import api from '../../../services/api.js';

// Authenticates a user with identifier, password, and remember-me flag.
export const login = (identifier, password, remember) =>
	api.post('/auth/login', { identifier, password, remember });

// Registers a new user account with the provided payload.
export const register = (payload) =>
	api.post('/auth/register', payload);

// Logs the current user out and invalidates the session.
export const logout = () =>
	api.post('/auth/logout');

// Requests a new access token using the current refresh token.
export const refreshToken = () =>
	api.post('/auth/refresh');

// Fetches the authenticated user's profile data.
export const getMe = () =>
	api.get('/me');

// Verifies whether the current session is still valid.
export const verifySession = () =>
	api.get('/auth/verify-session');

// Confirms a user's email address using the provided token.
export const confirmEmail = (token) =>
	api.get(`/auth/confirm-email?token=${token}`);

// Resends the email confirmation link to the given email address.
export const resendConfirmation = (email) =>
	api.post('/auth/resend-confirmation', { email });

// Sends a password reset link to the specified email address.
export const forgotPassword = (email) =>
	api.post('/auth/forgot-password', { email });

// Validates a password reset token to check if it is still usable.
export const validateResetToken = (token) =>
	api.get(`/auth/validate-reset-token/${token}`);

// Resets the user's password using the provided token and new password.
export const resetPassword = (token, newPassword) =>
	api.post('/auth/reset-password', { token, newPassword });

// Changes the authenticated user's password from current to a new one.
export const changePassword = (currentPassword, newPassword) =>
	api.post('/auth/change-password', { currentPassword, newPassword });

// Updates the authenticated user's preferred language setting.
export const updateUserLanguage = (languageId) =>
	api.patch(`/me/language/${languageId}`);
