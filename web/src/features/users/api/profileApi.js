// API for user profile operations: view, update, and profile image management.
import api from '../../../services/api';
import { extractCollection } from '../../../utils/collections';

export const getUserPublicProfile = async (guid) => {
	const { data } = await api.get(`/admin/users/${guid}`);
	return data?.data;
};

export const updateProfile = async (payload) => {
	const { data } = await api.put('/me', payload);
	return data?.data;
};

let locationsPromise = null;

export const getLocations = () => {
	if (!locationsPromise) {
		locationsPromise = api.get('/locations')
			.then((res) => extractCollection(res))
			.catch((err) => {
				locationsPromise = null;
				throw err;
			});
	}
	return locationsPromise;
};
