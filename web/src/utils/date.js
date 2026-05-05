export const MIN_AGE = 16;

export function getMinBirthdate() {
	const d = new Date();
	d.setFullYear(d.getFullYear() - MIN_AGE);
	return d.toISOString().split('T')[0];
}
