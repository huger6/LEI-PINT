// Phone number formatting utilities and fallback country prefix list.
const DIGITS_ONLY_REGEX = /\D+/g;

export const FALLBACK_PHONE_PREFIXES = [
	{ value: '+54', label: 'Argentina (+54)' },
	{ value: '+61', label: 'Australia (+61)' },
	{ value: '+32', label: 'Belgium (+32)' },
	{ value: '+55', label: 'Brazil (+55)' },
	{ value: '+86', label: 'China (+86)' },
	{ value: '+33', label: 'France (+33)' },
	{ value: '+49', label: 'Germany (+49)' },
	{ value: '+91', label: 'India (+91)' },
	{ value: '+39', label: 'Italy (+39)' },
	{ value: '+81', label: 'Japan (+81)' },
	{ value: '+52', label: 'Mexico (+52)' },
	{ value: '+31', label: 'Netherlands (+31)' },
	{ value: '+64', label: 'New Zealand (+64)' },
	{ value: '+351', label: 'Portugal (+351)' },
	{ value: '+27', label: 'South Africa (+27)' },
	{ value: '+82', label: 'South Korea (+82)' },
	{ value: '+34', label: 'Spain (+34)' },
	{ value: '+971', label: 'UAE (+971)' },
	{ value: '+44', label: 'UK (+44)' },
	{ value: '+1', label: 'US/CA (+1)' },
];

/** Strips all non-digit characters from a phone number string. */
export function normalizePhoneDigits(value) {
	return String(value ?? '').replace(DIGITS_ONLY_REGEX, '');
}

/** Formats a phone number by grouping digits in sets of three for readability. */
export function groupByThree(value) {
	const digits = normalizePhoneDigits(value);
	return digits.match(/.{1,3}/g)?.join(' ') ?? '';
}
