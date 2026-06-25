import { useState, useEffect } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

/**
 * Renders dynamic database text translated to the user's language via the TranslationContext.
 * Use this for all dynamic DB content (titles, descriptions). Do NOT wrap static i18n strings.
 * @param {string} text - Original text to translate.
 * @param {string|Component} [as='span'] - HTML element or component to render.
 */
// Renders database text translated to the user's active language via the translation context.
export default function TranslatedText({ text, as: Tag = 'span', className, style }) {
	// Provides the async translateText function and current language from context.
	const { translateText, currentLang } = useTranslationContext();
	// Holds the translated text string to render.
	const [translated, setTranslated] = useState(text || '');

	// Re-translates the text whenever the source text or active language changes.
	useEffect(() => {
		if (!text) {
			setTranslated('');
			return;
		}

		let cancelled = false;

		translateText(text).then((result) => {
			if (!cancelled) {
				setTranslated(result);
			}
		});

		return () => { cancelled = true; };
	}, [text, translateText, currentLang]);

	return <Tag className={className} style={style}>{translated}</Tag>;
}
