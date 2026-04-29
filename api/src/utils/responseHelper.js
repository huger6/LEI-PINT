const handleZodError = (res, error, code = 'VALIDATION_INVALID_QUERY_PARAMS') =>
    res.status(400).json({ success: false, code, errors: error.errors });

module.exports = { handleZodError };
