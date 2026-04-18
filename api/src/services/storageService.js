const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_STORAGE_URL, process.env.SUPABASE_STORAGE_API_KEY);

const moveImageToPermanent = async (permanentPathPrefix, tempUrl, user_guid) => {
    if (!tempUrl || !tempUrl.includes('/temp/')) return tempUrl;

    // Get filename from URL
    const fileName = tempUrl.split('/').pop().split('?')[0];
    const tempPath = `temp/${fileName}`;
    const permanentPath = `${permanentPathPrefix}/${user_guid}/${fileName}`;

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

const generateSignedUploadUrl = async (bucketName = 'private-assets', storagePath, expiresInSeconds = 300) => {
    try {
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

module.exports = {
    moveImageToPermanent,
    generateSignedUploadUrl
};