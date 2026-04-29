const sanitizeHtml = require('sanitize-html');

const sanitizeText = (value) => {
    if (!value) return value;
    return sanitizeHtml(value, {
        allowedTags: [],
        allowedAttributes: {}
    });
};

module.exports = sanitizeText;