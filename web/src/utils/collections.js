export function extractCollection(response) {
	const payload = response?.data?.data;
	if (Array.isArray(payload)) return payload;
	if (Array.isArray(payload?.data)) return payload.data;
	return [];
}
