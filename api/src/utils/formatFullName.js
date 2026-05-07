const capitalizeWord = (word) => {
    const lowerWord = word.toLowerCase();
    return lowerWord.replace(/^\p{L}/u, (letter) => letter.toUpperCase());
};

const formatFullName = (value) => {
    if (typeof value !== 'string') return value;

    return value
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .filter(Boolean)
        .map((word) => word
            .split(/([-'])/)
            .map((segment) => (segment === '-' || segment === "'" ? segment : capitalizeWord(segment)))
            .join(''))
        .join(' ');
};

module.exports = formatFullName;
