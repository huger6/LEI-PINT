const stripNullishFields = (object) => (
    Object.fromEntries(
        Object.entries(object).filter(([, value]) => value !== null && value !== undefined)
    )
);

module.exports = stripNullishFields;