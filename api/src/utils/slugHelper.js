const { Op } = require('sequelize');

const generateSlug = (text) => {
    if (!text) return '';

    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
};

/**
 * Generates a slug and ensures it is unique in DB
 * * @param {Object} model - Sequelize model
 * @param {string} slugColumn - Slug's column name in DB
 * @param {string} text - Text to convert
 * @param {number|null} excludeId - (Optional) ID to ignore (use on PUT/Update)
 * @param {string|null} idColumn - (Optional) ID to ignore
 */
const generateUniqueSlug = async (model, slugColumn, text, excludeId = null, idColumn = null) => {
    const baseSlug = generateSlug(text) || 'untitled';
    let uniqueSlug = baseSlug;
    let counter = 1;

    while (true) {
        // Query to see if slug already exists
        const whereClause = { [slugColumn]: uniqueSlug };

        // If it's an update, ignore this id
        if (excludeId && idColumn) {
            whereClause[idColumn] = { [Op.ne]: excludeId };
        }

        const existingRecord = await model.findOne({ where: whereClause });

        // If not found, slug is valid
        if (!existingRecord) {
            break;
        }

        // If exists, increase counter and try again
        uniqueSlug = `${baseSlug}-${counter}`;
        counter++;
    }

    return uniqueSlug;
};

module.exports = {
    generateSlug,
    generateUniqueSlug
};