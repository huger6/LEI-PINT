const METADATA_URL = 'https://unpkg.com/libphonenumber-js@1.11.20/metadata.full.json';

const CACHE_KEY = 'libphonenumber_metadata';
const CACHE_VERSION_KEY = 'libphonenumber_metadata_version';
const CACHE_VERSION = '1.11.20';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

function getCachedMetadata() {
	try {
		const version = localStorage.getItem(CACHE_VERSION_KEY);
		if (version !== CACHE_VERSION) {
			localStorage.removeItem(CACHE_KEY);
			localStorage.removeItem(CACHE_VERSION_KEY);
			return null;
		}
		const raw = localStorage.getItem(CACHE_KEY);
		if (!raw) return null;
		const { data, timestamp } = JSON.parse(raw);
		if (Date.now() - timestamp > CACHE_TTL) {
			localStorage.removeItem(CACHE_KEY);
			return null;
		}
		return data;
	} catch {
		localStorage.removeItem(CACHE_KEY);
		return null;
	}
}

function setCachedMetadata(data) {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
		localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
	} catch { /* quota exceeded - non-critical */ }
}

export async function fetchMetadata() {
	const cached = getCachedMetadata();
	if (cached) return cached;

	const response = await fetch(METADATA_URL);
	if (!response.ok) {
		throw new Error(`Failed to fetch libphonenumber metadata: ${response.status}`);
	}

	const raw = await response.json();
	const parsed = parseMetadata(raw);
	setCachedMetadata(parsed);
	return parsed;
}

export function parseMetadata(raw) {
	const countryCallingCodes = raw.country_calling_codes || {};
	const countriesRaw = raw.countries || {};

	const countries = {};

	for (const [regionCode, entry] of Object.entries(countriesRaw)) {
		if (!Array.isArray(entry) || entry.length < 4) continue;

		const callingCode = entry[0];
		const internationalPrefix = entry[1] || null;
		const nationalPattern = entry[2] || null;
		const possibleLengths = entry[3] || [];
		const nationalPrefix = entry[5] || null;

		const typePatterns = Array.isArray(entry[11]) ? entry[11] : [];
		const fixedLinePattern = typePatterns[0]
			? (Array.isArray(typePatterns[0]) ? typePatterns[0][0] : typePatterns[0])
			: null;
		const mobilePattern = typePatterns[1]
			? (Array.isArray(typePatterns[1]) ? typePatterns[1][0] : typePatterns[1])
			: null;

		countries[regionCode] = {
			regionCode,
			callingCode,
			internationalPrefix,
			nationalPrefix,
			nationalPattern,
			possibleLengths,
			fixedLinePattern,
			mobilePattern,
		};
	}

	return { countries, countryCallingCodes };
}
