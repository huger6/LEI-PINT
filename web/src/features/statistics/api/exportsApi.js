import api from '../../../services/api';

const EXPORT_PATHS = {
	consultants: '/exports/consultants',
	applications: '/exports/applications',
	badges: '/exports/badges',
	pointsHistory: '/exports/points-history',
	applicationLogs: '/exports/application-logs',
};

/**
 * Downloads a server-generated export file (csv | xlsx | pdf) and triggers
 * the browser "save as" dialog. Honours the filename sent in the
 * Content-Disposition header, falling back to a sensible default.
 *
 * @param {string} type   one of EXPORT_PATHS keys
 * @param {object} params { format, state, from, to, q, active }
 */
export async function downloadExport(type, { format = 'csv', ...params } = {}) {
	const path = EXPORT_PATHS[type];
	if (!path) throw new Error(`Unknown export type: ${type}`);

	const res = await api.get(path, {
		params: { format, ...params },
		responseType: 'blob',
	});

	// A blob with a JSON content-type means the server returned an error payload.
	const contentType = res.headers?.['content-type'] || '';
	if (contentType.includes('application/json')) {
		const text = await res.data.text();
		let code = 'EXPORT_FAILED';
		try { code = JSON.parse(text).code || code; } catch { /* keep default */ }
		throw new Error(code);
	}

	const disposition = res.headers?.['content-disposition'] || '';
	const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
	const filename = match ? decodeURIComponent(match[1]) : `${type}_export.${format}`;

	const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
	const blobUrl = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = blobUrl;
	link.download = filename;
	link.rel = 'noopener';
	document.body.appendChild(link);
	link.click();
	// Defer cleanup so the browser can start the download (an immediate revoke
	// cancels it in some browsers).
	setTimeout(() => {
		link.remove();
		URL.revokeObjectURL(blobUrl);
	}, 1500);
}
