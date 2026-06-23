import { useState, useEffect } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

/**
 * Renders dynamic database text translated to the user's language via the TranslationContext.
 * Use this for all dynamic DB content (titles, descriptions). Do NOT wrap static i18n strings.
 * @param {string} text - Original text to translate.
 * @param {string|Component} [as='span'] - HTML element or component to render.
 */
export default function TranslatedText({ text, as: Tag = 'span', className, style }) {
	const { translateText, currentLang } = useTranslationContext();
	const [translated, setTranslated] = useState(text || '');

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
