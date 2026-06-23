// Fetches and caches the available platform languages (pt-PT, en-GB, es-ES) from the API.
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { extractCollection } from '../utils/collections';

const LanguageContext = createContext(null);

let languagePromise = null;

/** Provides the list of available languages to descendant components. Fetches once and caches. */
export function LanguageProvider({ children }) {
	const [languages, setLanguages] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let ignore = false;
		if (!languagePromise) {
			languagePromise = api.get('/languages')
				.then((res) => extractCollection(res))
				.catch(() => {
					languagePromise = null;
					return [];
				});
		}
		languagePromise.then((data) => {
			if (!ignore) {
				setLanguages(data);
				setLoading(false);
			}
		});
		return () => { ignore = true; };
	}, []);

	return (
		<LanguageContext.Provider value={{ languages, loading }}>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguageContext() {
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error('useLanguageContext must be used inside LanguageProvider');
	return ctx;
}
