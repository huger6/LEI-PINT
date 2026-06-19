// Light/dark color mode. The chosen mode is stored in localStorage and applied
// as a `data-theme` attribute on <html>; colors.css defines the dark overrides.
const STORAGE_KEY = 'color-mode';
export const COLOR_MODES = ['light', 'dark'];

export function getColorMode() {
	const stored = localStorage.getItem(STORAGE_KEY);
	return COLOR_MODES.includes(stored) ? stored : 'light';
}

export function applyColorMode(mode) {
	const resolved = COLOR_MODES.includes(mode) ? mode : 'light';
	document.documentElement.setAttribute('data-theme', resolved);
}

export function setColorMode(mode) {
	const resolved = COLOR_MODES.includes(mode) ? mode : 'light';
	localStorage.setItem(STORAGE_KEY, resolved);
	applyColorMode(resolved);
}
