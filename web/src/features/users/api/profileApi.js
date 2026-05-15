import api from '../../../services/api';
import { extractCollection } from '../../../utils/collections';

export const getUserPublicProfile = async (guid) => {
	const { data } = await api.get(`/users/${guid}/profile`);
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
