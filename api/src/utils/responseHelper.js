const handleZodError = (res, error, code = 'VALIDATION_INVALID_QUERY_PARAMS') => {
    const issues = error.issues || error.errors || [];
    return res.status(400).json({ success: false, code, errors: issues });
};

module.exports = { handleZodError };
