const crypto = require('crypto');
const { franc } = require('franc-min');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const loadEnvironment = require('../config/loadEnv');

loadEnvironment();

const GOOGLE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const CACHE_TTL = 604800; // 7 days
const MIN_DETECT_LENGTH = 15;

const ISO3_TO_ISO1 = { por: 'pt', eng: 'en', spa: 'es' };
const SUPPORTED_LANGS = new Set(['pt', 'en', 'es']);

const cacheKey = (text, targetLang) => {
    const hash = crypto.createHash('md5').update(text).digest('hex');
    return `translate:${targetLang}:${hash}`;
};

const detectLanguage = (text) => {
    if (text.length < MIN_DETECT_LENGTH) return null;
    const iso3 = franc(text);
    return ISO3_TO_ISO1[iso3] || null;
};

const translateTexts = async (texts, targetLang) => {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;

    logger.info('[Translation] Request received', { targetLang, textCount: texts.length, texts: texts.map((t) => t.slice(0, 80)) });

    if (!apiKey) {
        logger.error('[Translation] GOOGLE_TRANSLATE_API_KEY is not configured');
        return texts.map((t) => ({ original: t, translated: t }));
    }

    const trimmed = texts.map((t) => t.trim());
    const results = new Array(texts.length);
    const uncachedIndexes = [];
    const uncachedTexts = [];

    const cachePromises = trimmed.map((text, i) => {
        if (!text) {
            logger.debug(`[Translation] [${i}] Empty text — skipped`);
            results[i] = { original: texts[i], translated: '' };
            return Promise.resolve();
        }

        const detected = detectLanguage(text);
        if (detected === targetLang) {
            logger.debug(`[Translation] [${i}] franc detected="${detected}" matches target="${targetLang}" — skipped`, { preview: text.slice(0, 60) });
            results[i] = { original: texts[i], translated: text };
            return Promise.resolve();
        }

        logger.debug(`[Translation] [${i}] franc detected="${detected || 'und'}" target="${targetLang}" — checking cache`, { preview: text.slice(0, 60) });

        return redis.get(cacheKey(text, targetLang)).then((cached) => {
            if (cached) {
                logger.debug(`[Translation] [${i}] Cache HIT`, { preview: text.slice(0, 40), cached: cached.slice(0, 40) });
                results[i] = { original: texts[i], translated: cached };
            } else {
                logger.debug(`[Translation] [${i}] Cache MISS — queued for Google`);
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
        logger.info('[Translation] All texts resolved without Google API call', { skippedByFranc: texts.length - uncachedIndexes.length, cachedHits: uncachedIndexes.length === 0 ? 'all remaining' : 0 });
        return results;
    }

    logger.info(`[Translation] Sending ${uncachedTexts.length}/${texts.length} texts to Google`, { target: targetLang, texts: uncachedTexts.map((t) => t.slice(0, 60)) });

    const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            q: uncachedTexts,
            target: targetLang,
            format: 'text'
        })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        logger.error('[Translation] Google API error', { status: response.status, body: errorBody });
        uncachedIndexes.forEach((idx, j) => {
            results[idx] = { original: texts[idx], translated: uncachedTexts[j] };
        });
        return results;
    }

    const data = await response.json();
    const translations = data.data?.translations || [];

    logger.info('[Translation] Google API response', { translationCount: translations.length, results: translations.map((t) => t.translatedText?.slice(0, 60)) });

    const cacheWrites = [];

    uncachedIndexes.forEach((idx, j) => {
        const translated = translations[j]?.translatedText || uncachedTexts[j];
        results[idx] = { original: texts[idx], translated };

        cacheWrites.push(
            redis.set(cacheKey(uncachedTexts[j], targetLang), translated, 'EX', CACHE_TTL)
                .catch((err) => logger.error('[Translation] Redis cache write failed', { err }))
        );
    });

    await Promise.all(cacheWrites);

    logger.info('[Translation] Complete', { total: texts.length, results: results.map((r) => ({ original: r.original?.slice(0, 40), translated: r.translated?.slice(0, 40) })) });

    return results;
};

module.exports = { translateTexts };
