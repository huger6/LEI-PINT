import axios from 'axios';

const BUCKET_NAME = 'public-assets';
const TEMP_FOLDER = 'temp';
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const DEFAULT_IMAGE_NAME = 'image';

const ALLOWED_IMAGE_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'image/bmp',
	'image/svg+xml',
	'image/heic',
	'image/heif',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
	'jpg',
	'jpeg',
	'png',
	'webp',
	'gif',
	'bmp',
	'svg',
	'heic',
	'heif',
]);

const asString = (value) =>
	typeof value === 'string' ? value.trim() : '';

const createUploadError = (message, code = 'PROFILE_IMAGE_UPLOAD_FAILED', details = null) => {
	const error = new Error(message);
	error.code = code;
	if (details) error.details = details;
	return error;
};

const getStorageConfig = () => {
	const baseUrl = asString(import.meta.env.VITE_SUPABASE_STORAGE_URL || import.meta.env.SUPABASE_STORAGE_URL);
	const apiKey = asString(import.meta.env.VITE_SUPABASE_STORAGE_API_KEY || import.meta.env.SUPABASE_STORAGE_API_KEY);

	if (!baseUrl || !apiKey) {
		throw createUploadError(
			'Supabase storage configuration is missing.',
			'SUPABASE_CONFIG_MISSING'
		);
	}

	return {
		baseUrl: baseUrl.replace(/\/+$/, ''),
		apiKey,
	};
};

const getExtension = (fileName = '') => {
	const index = fileName.lastIndexOf('.');
	if (index < 1) return '';
	return fileName.slice(index + 1).toLowerCase();
};

const sanitizeFileBaseName = (fileName = '') => {
	const base = fileName.replace(/\.[^.]+$/, '');
	const safe = base
		.trim()
		.replace(/[^a-zA-Z0-9._-]+/g, '_')
		.replace(/^_+|_+$/g, '');

	return safe || DEFAULT_IMAGE_NAME;
};

const buildTempFileName = (originalFileName = DEFAULT_IMAGE_NAME) => {
	const extension = getExtension(originalFileName);
	const safeBase = sanitizeFileBaseName(originalFileName);
	const timestamp = Date.now();
	const suffix = extension ? `.${extension}` : '';
	return `${safeBase}_${timestamp}${suffix}`;
};

const encodePath = (path) =>
	path.split('/').map((segment) => encodeURIComponent(segment)).join('/');

const isAllowedImageFile = (file) => {
	const mimeType = asString(file?.type).toLowerCase();
	const extension = getExtension(file?.name);

	if (mimeType) {
		if (ALLOWED_IMAGE_MIME_TYPES.has(mimeType)) return true;
		if (!mimeType.startsWith('image/')) return false;
		return ALLOWED_IMAGE_EXTENSIONS.has(extension);
	}

	return ALLOWED_IMAGE_EXTENSIONS.has(extension);
};

export const validateProfileImageFile = (file) => {
	if (!file) {
		throw createUploadError('No file was selected.', 'PROFILE_IMAGE_MISSING');
	}

	if (!isAllowedImageFile(file)) {
		throw createUploadError('Unsupported file format.', 'PROFILE_IMAGE_INVALID_FORMAT');
	}

	if (file.size > MAX_FILE_SIZE_BYTES) {
		throw createUploadError('File size exceeds the limit.', 'PROFILE_IMAGE_TOO_LARGE');
	}
};

export const uploadProfileImageToTemp = async (file, options = {}) => {
	validateProfileImageFile(file);

	const { baseUrl, apiKey } = getStorageConfig();
	const fileName = buildTempFileName(file.name || DEFAULT_IMAGE_NAME);
	const objectPath = `${TEMP_FOLDER}/${fileName}`;
	const uploadUrl = `${baseUrl}/storage/v1/object/${BUCKET_NAME}/${encodePath(objectPath)}`;
	const { onUploadProgress } = options;

	try {
		await axios.post(uploadUrl, file, {
			headers: {
				apikey: apiKey,
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': file.type || 'application/octet-stream',
				'cache-control': '3600',
				'x-upsert': 'false',
			},
			// Optional callback for future upload progress UI (e.g. progress bar).
			// onUploadProgress,
		});
	} catch (error) {
		const details = error?.response?.data ?? error;
		throw createUploadError(
			error?.response
				? 'Supabase rejected the upload.'
				: 'Could not connect to Supabase storage.',
			'SUPABASE_UPLOAD_FAILED',
			details
		);
	}

	const publicUrl = `${baseUrl}/storage/v1/object/public/${BUCKET_NAME}/${encodePath(objectPath)}`;

	return {
		fileName,
		objectPath,
		publicUrl,
	};
};

export const PROFILE_IMAGE_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
