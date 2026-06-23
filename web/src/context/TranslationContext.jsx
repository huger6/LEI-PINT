// Provides on-demand text translation via the API with batching and caching.
import { createContext, useContext, useCallback, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

const TranslationContext = createContext(null);

const BATCH_DELAY_MS = 60;

/**
 * Batches translation requests within a 60ms window and caches results.
 * Used by the TranslatedText component to translate dynamic database content.
 */
export function TranslationProvider({ children }) {
	const { i18n } = useTranslation();
	const currentLang = i18n.language?.slice(0, 2) || 'pt';

	const cacheRef = useRef(new Map());
	const queueRef = useRef([]);
	const timerRef = useRef(null);

	// Sends accumulated translation requests to the API in a single batch.
	const flushQueue = useCallback(async (lang) => {
		const batch = queueRef.current.splice(0);
		if (batch.length === 0) return;

		const uniqueTexts = [...new Set(batch.map((item) => item.text))];
		const textsToTranslate = uniqueTexts.filter((t) => !cacheRef.current.has(`${lang}:${t}`));

		if (textsToTranslate.length > 0) {
			try {
				const { data } = await api.post('/translate', {
					texts: textsToTranslate,
					target: lang
				});

				const translations = data.data?.translations || [];

				translations.forEach(({ original, translated }) => {
					cacheRef.current.set(`${lang}:${original}`, translated);
				});
			} catch (err) {
				console.error('[TranslationContext] API call failed:', err);
				textsToTranslate.forEach((t) => {
					cacheRef.current.set(`${lang}:${t}`, t);
				});
			}
		}

		batch.forEach(({ text, resolve }) => {
			resolve(cacheRef.current.get(`${lang}:${text}`) || text);
		});
	}, []);

	// Queues a text for translation, returning a Promise that resolves with the translated string.
	const translateText = useCallback((text) => {
		const lang = currentLang;

		if (!text) return Promise.resolve('');

		const cached = cacheRef.current.get(`${lang}:${text}`);
		if (cached) return Promise.resolve(cached);

		return new Promise((resolve) => {
			queueRef.current.push({ text, resolve });

			if (!timerRef.current) {
				timerRef.current = setTimeout(() => {
					timerRef.current = null;
					flushQueue(lang);
				}, BATCH_DELAY_MS);
			}
		});
	}, [currentLang, flushQueue]);

	const value = useMemo(() => ({
		translateText,
		currentLang
	}), [translateText, currentLang]);

	return (
		<TranslationContext.Provider value={value}>
			{children}
		</TranslationContext.Provider>
	);
}

export function useTranslationContext() {
	const ctx = useContext(TranslationContext);
	if (!ctx) throw new Error('useTranslationContext must be used inside TranslationProvider');
	return ctx;
}
