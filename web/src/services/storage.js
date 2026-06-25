// Handles file uploads to Supabase Storage (profile images and badge evidence files).
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

// Returns a trimmed string, or empty string for non-string input.
const asString = (value) =>
	typeof value === 'string' ? value.trim() : '';

// Builds an Error with a machine-readable code and optional details.
const createUploadError = (message, code = 'PROFILE_IMAGE_UPLOAD_FAILED', details = null) => {
	const error = new Error(message);
	error.code = code;
	if (details) error.details = details;
	return error;
};

// Reads and validates the Supabase storage base URL and API key from env.
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

// Extracts the lowercase file extension (without the dot).
const getExtension = (fileName = '') => {
	const index = fileName.lastIndexOf('.');
	if (index < 1) return '';
	return fileName.slice(index + 1).toLowerCase();
};

// Strips the extension and replaces unsafe characters in the base file name.
const sanitizeFileBaseName = (fileName = '') => {
	const base = fileName.replace(/\.[^.]+$/, '');
	const safe = base
		.trim()
		.replace(/[^a-zA-Z0-9._-]+/g, '_')
		.replace(/^_+|_+$/g, '');

	return safe || DEFAULT_IMAGE_NAME;
};

// Builds a unique temp file name by appending a timestamp to the sanitized base.
const buildTempFileName = (originalFileName = DEFAULT_IMAGE_NAME) => {
	const extension = getExtension(originalFileName);
	const safeBase = sanitizeFileBaseName(originalFileName);
	const timestamp = Date.now();
	const suffix = extension ? `.${extension}` : '';
	return `${safeBase}_${timestamp}${suffix}`;
};

// URL-encodes each path segment while preserving the slash separators.
const encodePath = (path) =>
	path.split('/').map((segment) => encodeURIComponent(segment)).join('/');

// Checks whether a file is an allowed image by MIME type and/or extension.
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

/** Validates a profile image file (type and size <= 2MB). Throws on failure. */
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

/** Uploads a profile image to the Supabase temp folder. Returns { fileName, objectPath, publicUrl }. */
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

const MAX_GENERIC_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
	'application/pdf',
	'image/jpeg',
	'image/jpg',
	'image/png',
	'application/zip',
]);

const ALLOWED_EVIDENCE_EXTENSIONS = new Set([
	'pdf', 'jpg', 'jpeg', 'png', 'zip',
]);

/** Validates a badge evidence file (PDF, JPG, PNG, ZIP; <= 10MB). Throws on failure. */
export const validateEvidenceFile = (file) => {
	if (!file) {
		throw createUploadError('No file was selected.', 'EVIDENCE_FILE_MISSING');
	}

	const mimeType = asString(file?.type).toLowerCase();
	const extension = getExtension(file?.name);
	const isAllowed = ALLOWED_EVIDENCE_MIME_TYPES.has(mimeType) || ALLOWED_EVIDENCE_EXTENSIONS.has(extension);

	if (!isAllowed) {
		throw createUploadError('Unsupported file format.', 'EVIDENCE_FILE_INVALID_FORMAT');
	}

	if (file.size > MAX_GENERIC_FILE_SIZE_BYTES) {
		throw createUploadError('File size exceeds the 10 MB limit.', 'EVIDENCE_FILE_TOO_LARGE');
	}
};

export const EVIDENCE_ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.zip';

/** Uploads any validated file to the Supabase temp folder. Returns { fileName, objectPath, publicUrl }. */
export const uploadFileToTemp = async (file, options = {}) => {
	const { baseUrl, apiKey } = getStorageConfig();
	const fileName = buildTempFileName(file.name || 'file');
	const objectPath = `${TEMP_FOLDER}/${fileName}`;
	const uploadUrl = `${baseUrl}/storage/v1/object/${BUCKET_NAME}/${encodePath(objectPath)}`;

	try {
		await axios.post(uploadUrl, file, {
			headers: {
				apikey: apiKey,
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': file.type || 'application/octet-stream',
				'cache-control': '3600',
				'x-upsert': 'false',
			},
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
