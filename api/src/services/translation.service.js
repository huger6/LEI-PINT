const crypto = require('crypto');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const loadEnvironment = require('../config/loadEnv');

loadEnvironment();

const GOOGLE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const CACHE_TTL = 604800; // 7 days
const SOURCE_LANG = 'pt';

const cacheKey = (text, targetLang) => {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `translate:${targetLang}:${hash}`;
};

const translateTexts = async (texts, targetLang) => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    if (!apiKey) {
        logger.error('GOOGLE_TRANSLATE_API_KEY is not configured');
        return texts.map((t) => ({ original: t, translated: t }));
    }

    const trimmed = texts.map((t) => t.trim());
    const results = new Array(texts.length);
    const uncachedIndexes = [];
    const uncachedTexts = [];

    const cachePromises = trimmed.map((text, i) => {
        if (!text) {
            results[i] = { original: texts[i], translated: '' };
            return Promise.resolve();
        }

        return redis.get(cacheKey(text, targetLang)).then((cached) => {
            if (cached) {
                results[i] = { original: texts[i], translated: cached };
            } else {
                uncachedIndexes.push(i);
                uncachedTexts.push(text);
            }
        }).catch(() => {
            uncachedIndexes.push(i);
            uncachedTexts.push(text);
        });
    });

    await Promise.all(cachePromises);

    if (uncachedTexts.length === 0) {
        return results;
    }

    const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: uncachedTexts,
            target: targetLang,
            source: SOURCE_LANG,
            format: 'text'
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error('Google Translation API error', { status: response.status, body: errorBody });
        uncachedIndexes.forEach((idx, j) => {
            results[idx] = { original: texts[idx], translated: uncachedTexts[j] };
        });
        return results;
    }

    const data = await response.json();
    const translations = data.data?.translations || [];

    const cacheWrites = [];

    uncachedIndexes.forEach((idx, j) => {
        const translated = translations[j]?.translatedText || uncachedTexts[j];
        results[idx] = { original: texts[idx], translated };

        cacheWrites.push(
            redis.set(cacheKey(uncachedTexts[j], targetLang), translated, 'EX', CACHE_TTL)
                .catch((err) => logger.error('Redis cache write failed', { err }))
        );
    });

    await Promise.all(cacheWrites);

    return results;
};

module.exports = { translateTexts };
