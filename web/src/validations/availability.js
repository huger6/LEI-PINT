import api from '../services/api';

// Checks whether a username is available via the backend.
export const fetchUsernameAvailability = async (value) => {
	const { data } = await api.get('/utils/check/username', { params: { value } });
	return data?.data ?? { available: false };
};

// Checks whether an email address is available via the backend.
export const fetchEmailAvailability = async (value) => {
	const { data } = await api.get('/utils/check/email', { params: { value } });
	return data?.data ?? { available: false };
};

// Validates biography content server-side (e.g. profanity/length checks).
export const fetchBiographyValidity = async (value) => {
	const { data } = await api.post('/utils/check/biography', { biography: value });
	return data?.data ?? { available: false, code: null };
};
