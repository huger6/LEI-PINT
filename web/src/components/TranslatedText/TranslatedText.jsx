import { useState, useEffect } from 'react';
import { useTranslationContext } from '../../context/TranslationContext';

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
