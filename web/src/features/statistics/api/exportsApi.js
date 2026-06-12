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

	const disposition = res.headers?.['content-disposition'] || '';
	const match = /filename="?([^"]+)"?/i.exec(disposition);
	const filename = match ? match[1] : `${type}_export.${format}`;

	const blobUrl = URL.createObjectURL(res.data);
	const link = document.createElement('a');
	link.href = blobUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(blobUrl);
}
