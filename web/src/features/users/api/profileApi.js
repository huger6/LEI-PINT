// API for user profile operations: view, update, and profile image management.
import api from '../../../services/api';
import { extractCollection } from '../../../utils/collections';

// Fetches a user's public profile data by their GUID.
export const getUserPublicProfile = async (guid) => {
	const { data } = await api.get(`/admin/users/${guid}`);
	return data?.data;
};

// Sends updated profile fields for the currently authenticated user.
export const updateProfile = async (payload) => {
	const { data } = await api.put('/me', payload);
	return data?.data;
};

let locationsPromise = null;

// Fetches available locations once and caches the promise for subsequent calls.
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
