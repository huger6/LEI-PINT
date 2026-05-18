const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

// Lazily initialize Supabase client. When running tests the environment
// variables may be absent; in that case we keep `supabase` as null and make
// storage functions into safe no-ops (they return the original URL or
// a sensible dummy) so requiring this module does not throw.
let supabase = null;
if (process.env.SUPABASE_STORAGE_URL && process.env.SUPABASE_STORAGE_API_KEY) {
    try {
        supabase = createClient(process.env.SUPABASE_STORAGE_URL, process.env.SUPABASE_STORAGE_API_KEY);
    } catch (err) {
        logger.warn('Failed to initialize Supabase client, continuing without storage client', { err });
        supabase = null;
    }
} else {
    logger.warn('Supabase storage not configured; storage operations will be no-ops in this process');
}

const moveImageToPermanent = async (permanentPathPrefix, tempUrl, user_guid) => {
    if (!tempUrl || !tempUrl.includes('/temp/')) return tempUrl;

    // Get filename from URL
    const fileName = tempUrl.split('/').pop().split('?')[0];
    const tempPath = `temp/${fileName}`;
    const permanentPath = `${permanentPathPrefix}/${user_guid}/${fileName}`;

    // If Supabase is not configured (for example when running tests),
    // return the original URL (no-op) so callers are not blocked.
    if (!supabase) return tempUrl;

    // Move the file in supabase storage
    const { data, error } = await supabase.storage
        .from('public-assets') // Bucket name
        .move(tempPath, permanentPath);

    if (error) {
        const storageError = new Error(error.message);
        storageError.name = 'StorageMoveError';
        throw storageError;
    }

    // New perm URL
    const { data: publicData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(permanentPath);

    return publicData.publicUrl;
};

const moveStructureImageToPermanent = async (structureType, tempUrl, entityIdentifier) => {
    if (!tempUrl || !tempUrl.includes('/temp/')) return tempUrl;

    const fileName = tempUrl.split('/').pop().split('?')[0];
    const tempPath = `temp/${fileName}`;

    const permanentPath = entityIdentifier
        ? `structure/${structureType}/${entityIdentifier}/${fileName}`
        : `structure/${structureType}/${fileName}`;

    if (!supabase) return tempUrl;

    const { data, error } = await supabase.storage
        .from('public-assets')
        .move(tempPath, permanentPath);

    if (error) {
        const storageError = new Error(error.message);
        storageError.name = 'StorageMoveError';
        throw storageError;
    }

    const { data: publicData } = supabase.storage
        .from('public-assets')
        .getPublicUrl(permanentPath);

    return publicData.publicUrl;
};

const generateSignedUploadUrl = async (bucketName = 'private-assets', storagePath, expiresInSeconds = 300) => {
    try {
        if (!supabase) {
            // Return sensible dummy URLs when Supabase is not configured.
            const base = process.env.SUPABASE_URL || 'http://localhost';
            const uploadUrl = `${base}/storage/v1/signed_upload/${bucketName}/${encodeURIComponent(storagePath)}`;
            const finalFileUrl = `${base}/storage/v1/object/authenticated/${bucketName}/${storagePath}`;
            return { uploadUrl, finalFileUrl };
        }

        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .createSignedUploadUrl(storagePath, expiresInSeconds);

        if (error) {
            throw new Error(`Supabase Error: ${error.message}`);
        }

        const uploadUrl = `${process.env.SUPABASE_URL}/storage/v1${data.signedUrl}`;

        // URL after upload
        const finalFileUrl = `${process.env.SUPABASE_URL}/storage/v1/object/authenticated/${bucketName}/${storagePath}`;

        return { uploadUrl, finalFileUrl };

    } catch (error) {
        logger.error('Failed to generate signed upload URL in Supabase Service', { error, bucketName, storagePath });

        throw error;
    }
};

/**
 * Uploads a Buffer directly to a Supabase storage bucket and returns the public URL.
 * Used for server-generated files (e.g., PDF certificates).
 *
 * @param {string} bucketName - 'public-assets' or 'private-assets'
 * @param {string} storagePath - Path within the bucket (e.g., 'certificates/guid/cert.pdf')
 * @param {Buffer} buffer - File content
 * @param {string} [contentType='application/pdf']
 * @returns {Promise<string>} Public URL of the uploaded file
 */
const uploadBuffer = async (bucketName, storagePath, buffer, contentType = 'application/pdf') => {
    if (!supabase) {
        const base = process.env.SUPABASE_STORAGE_URL || 'http://localhost';
        return `${base}/storage/v1/object/public/${bucketName}/${storagePath}`;
    }

    const { error } = await supabase.storage
        .from(bucketName)
        .upload(storagePath, buffer, { contentType, upsert: true });

    if (error) {
        const storageError = new Error(error.message);
        storageError.name = 'StorageUploadError';
        throw storageError;
    }

    const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(storagePath);

    return publicUrl;
};

module.exports = {
    moveImageToPermanent,
    moveStructureImageToPermanent,
    generateSignedUploadUrl,
    uploadBuffer
};