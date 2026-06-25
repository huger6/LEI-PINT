// Validates a full international phone number (with +country code) against metadata.
export function validatePhoneWithMetadata(phoneNumber, metadata) {
	if (!phoneNumber || !metadata) return { valid: false, error: 'MISSING_INPUT' };

	const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

	if (!cleaned.startsWith('+')) {
		return { valid: false, error: 'MISSING_PLUS' };
	}

	const digits = cleaned.slice(1);
	if (!/^\d+$/.test(digits)) {
		return { valid: false, error: 'INVALID_CHARACTERS' };
	}

	const match = matchCountryByNumber(digits, metadata);
	if (!match) {
		return { valid: false, error: 'UNKNOWN_COUNTRY_CODE' };
	}

	const { country, nationalNumber } = match;

	if (country.possibleLengths.length > 0 && !country.possibleLengths.includes(nationalNumber.length)) {
		return { valid: false, error: 'INVALID_LENGTH', country: country.regionCode };
	}

	if (country.nationalPattern) {
		const regex = new RegExp(`^(?:${country.nationalPattern})$`);
		if (!regex.test(nationalNumber)) {
			return { valid: false, error: 'PATTERN_MISMATCH', country: country.regionCode };
		}
	}

	const numberType = detectNumberType(nationalNumber, country);

	return {
		valid: true,
		country: country.regionCode,
		callingCode: country.callingCode,
		nationalNumber,
		type: numberType,
	};
}

// Validates a national number against a given calling code using metadata.
export function validateNationalNumber(nationalNumber, callingCode, metadata) {
	if (!nationalNumber || !callingCode || !metadata) {
		return { valid: false, error: 'MISSING_INPUT' };
	}

	const digits = nationalNumber.replace(/[\s\-()]/g, '');
	if (!/^\d+$/.test(digits)) {
		return { valid: false, error: 'INVALID_CHARACTERS' };
	}

	const regionCodes = metadata.countryCallingCodes[callingCode];
	if (!regionCodes || regionCodes.length === 0) {
		return { valid: false, error: 'UNKNOWN_COUNTRY_CODE' };
	}

	for (const regionCode of regionCodes) {
		const country = metadata.countries[regionCode];
		if (!country) continue;

		if (country.possibleLengths.length > 0 && !country.possibleLengths.includes(digits.length)) {
			continue;
		}

		if (country.nationalPattern) {
			const regex = new RegExp(`^(?:${country.nationalPattern})$`);
			if (regex.test(digits)) {
				const numberType = detectNumberType(digits, country);
				return {
					valid: true,
					country: country.regionCode,
					callingCode: country.callingCode,
					nationalNumber: digits,
					type: numberType,
				};
			}
		}
	}

	const primaryCountry = metadata.countries[regionCodes[0]];
	if (primaryCountry) {
		if (primaryCountry.possibleLengths.length > 0 && !primaryCountry.possibleLengths.includes(digits.length)) {
			return { valid: false, error: 'INVALID_LENGTH', country: regionCodes[0] };
		}
	}

	return { valid: false, error: 'PATTERN_MISMATCH', country: regionCodes[0] };
}

// Matches the leading digits to a country, returning the country and national number.
function matchCountryByNumber(digits, metadata) {
	for (let len = 1; len <= 3; len++) {
		if (digits.length < len) break;
		const code = digits.slice(0, len);
		const regionCodes = metadata.countryCallingCodes[code];
		if (!regionCodes) continue;

		const nationalNumber = digits.slice(len);

		for (const regionCode of regionCodes) {
			const country = metadata.countries[regionCode];
			if (!country) continue;

			if (country.possibleLengths.length > 0 && !country.possibleLengths.includes(nationalNumber.length)) {
				continue;
			}

			if (country.nationalPattern) {
				const regex = new RegExp(`^(?:${country.nationalPattern})$`);
				if (regex.test(nationalNumber)) {
					return { country, nationalNumber };
				}
			}
		}

		const primary = metadata.countries[regionCodes[0]];
		if (primary) {
			const nationalNumber2 = digits.slice(len);
			if (primary.possibleLengths.length === 0 || primary.possibleLengths.includes(nationalNumber2.length)) {
				return { country: primary, nationalNumber: nationalNumber2 };
			}
		}
	}

	return null;
}

// Classifies a national number as MOBILE, FIXED_LINE, or UNKNOWN.
function detectNumberType(nationalNumber, country) {
	if (country.mobilePattern) {
		const mobileRegex = new RegExp(`^(?:${country.mobilePattern})$`);
		if (mobileRegex.test(nationalNumber)) return 'MOBILE';
	}

	if (country.fixedLinePattern) {
		const fixedRegex = new RegExp(`^(?:${country.fixedLinePattern})$`);
		if (fixedRegex.test(nationalNumber)) return 'FIXED_LINE';
	}

	return 'UNKNOWN';
}

// Builds a sorted list of country dialing prefixes with their validation patterns.
export function getCountryPrefixes(metadata) {
	if (!metadata) return [];

	const prefixes = [];

	for (const [callingCode, regionCodes] of Object.entries(metadata.countryCallingCodes)) {
		for (const regionCode of regionCodes) {
			const country = metadata.countries[regionCode];
			if (!country) continue;
			prefixes.push({
				regionCode,
				callingCode,
				prefix: `+${callingCode}`,
				possibleLengths: country.possibleLengths,
				nationalPattern: country.nationalPattern,
				mobilePattern: country.mobilePattern,
			});
		}
	}

	return prefixes.sort((a, b) => a.regionCode.localeCompare(b.regionCode));
}
