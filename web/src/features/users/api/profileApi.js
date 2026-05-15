import api from '../../../services/api';

export const getUserPublicProfile = async (guid) => {
	const { data } = await api.get(`/users/${guid}/profile`);
	return data?.data;
};

export const updateProfile = async (payload) => {
	const { data } = await api.put('/me/profile', payload);
	return data?.data;
};
