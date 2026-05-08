import api from '../services/api';

export const fetchUsernameAvailability = async (value) => {
	const { data } = await api.get('/utils/check/username', { params: { value } });
	return data?.data ?? { available: false };
};

export const fetchEmailAvailability = async (value) => {
	const { data } = await api.get('/utils/check/email', { params: { value } });
	return data?.data ?? { available: false };
};

export const fetchBiographyValidity = async (value) => {
	const { data } = await api.post('/utils/check/biography', { biography: value });
	return data?.data ?? { available: false, code: null };
};
