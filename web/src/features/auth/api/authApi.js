import api from '../../../services/api.js';

export const login = (identifier, password, remember) =>
	api.post('/auth/login', { identifier, password, remember });

export const register = (payload) =>
	api.post('/auth/register', payload);

export const logout = () =>
	api.post('/auth/logout');

export const refreshToken = () =>
	api.post('/auth/refresh');

export const getMe = () =>
	api.get('/me');

export const verifySession = () =>
	api.get('/auth/verify-session');

export const confirmEmail = (token) =>
	api.get(`/auth/confirm-email?token=${token}`);

export const resendConfirmation = (email) =>
	api.post('/auth/resend-confirmation', { email });

export const forgotPassword = (email) =>
	api.post('/auth/forgot-password', { email });

export const validateResetToken = (token) =>
	api.get(`/auth/validate-reset-token/${token}`);

export const resetPassword = (token, newPassword) =>
	api.post('/auth/reset-password', { token, newPassword });

export const changePassword = (currentPassword, newPassword) =>
	api.post('/auth/change-password', { currentPassword, newPassword });

export const updateUserLanguage = (languageId) =>
	api.patch(`/me/language/${languageId}`);
