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

module.exports = { moveImageToPermanent };