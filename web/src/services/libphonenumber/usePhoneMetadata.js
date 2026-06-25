import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMetadata } from './metadata';
import { getCountryPrefixes, validateNationalNumber, validatePhoneWithMetadata } from './validator';

// Resolves a localized country/region display name, falling back to the code.
function getRegionName(code, locale) {
	try {
		const displayNames = new Intl.DisplayNames([locale], { type: 'region' });
		return displayNames.of(code);
	} catch {
		return code;
	}
}

let sharedMetadata = null;
let sharedPromise = null;

// Loads metadata once and shares the result/promise across all hook consumers.
function loadMetadata() {
	if (sharedMetadata) return Promise.resolve(sharedMetadata);
	if (sharedPromise) return sharedPromise;
	sharedPromise = fetchMetadata().then((data) => {
		sharedMetadata = data;
		sharedPromise = null;
		return data;
	}).catch((err) => {
		sharedPromise = null;
		throw err;
	});
	return sharedPromise;
}

// Hook exposing phone metadata, localized prefix options, and validation helpers.
export function usePhoneMetadata() {
	const { i18n } = useTranslation();
	// Local metadata/loading/error state, seeded from the shared singleton.
	const [metadata, setMetadata] = useState(sharedMetadata);
	const [loading, setLoading] = useState(!sharedMetadata);
	const [error, setError] = useState(null);
	const mountedRef = useRef(true);

	// Loads metadata once on mount (if not already shared) and tracks mount status.
	useEffect(() => {
		if (sharedMetadata) return;
		mountedRef.current = true;

		loadMetadata()
			.then((data) => {
				if (mountedRef.current) {
					setMetadata(data);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (mountedRef.current) {
					setError(err);
					setLoading(false);
				}
			});

		return () => { mountedRef.current = false; };
	}, []);

	// Memoized, locale-sorted list of country prefix options for select inputs.
	const prefixOptions = useMemo(() => {
		if (!metadata) return [];
		return getCountryPrefixes(metadata)
			.map((p) => ({
				value: p.prefix,
				label: `${getRegionName(p.regionCode, i18n.language)} (${p.prefix})`,
				regionCode: p.regionCode,
				_sortName: getRegionName(p.regionCode, i18n.language),
			}))
			.sort((a, b) => a._sortName.localeCompare(b._sortName, i18n.language))
			.map(({ _sortName, ...rest }) => rest);
	}, [metadata, i18n.language]);

	// Validates a full international number once metadata is loaded.
	const validate = (phoneNumber) => {
		if (!metadata) return { valid: false, error: 'METADATA_NOT_LOADED' };
		return validatePhoneWithMetadata(phoneNumber, metadata);
	};

	// Validates a national number against a calling code once metadata is loaded.
	const validateNational = (nationalNumber, callingCode) => {
		if (!metadata) return { valid: false, error: 'METADATA_NOT_LOADED' };
		return validateNationalNumber(nationalNumber, callingCode, metadata);
	};

	return {
		metadata,
		loading,
		error,
		prefixOptions,
		validate,
		validateNational,
	};
}
