// API for user profile operations: view, update, and profile image management.
import api from '../../../services/api';
import { extractCollection } from '../../../utils/collections';

// Fetches a user's full profile data by their GUID (admin-only endpoint).
export const getUserPublicProfile = async (guid) => {
	const { data } = await api.get(`/admin/users/${guid}`);
	return data?.data;
};

// Fetches another user's read-only in-platform profile by GUID.
// Available to any authenticated user; excludes account/administrative fields.
export const getInPlatformProfile = async (guid) => {
	const { data } = await api.get(`/users/${guid}`);
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
