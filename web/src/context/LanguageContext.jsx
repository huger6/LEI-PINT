// Fetches and caches the available platform languages (pt-PT, en-GB, es-ES) from the API.
import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { extractCollection } from '../utils/collections';

const LanguageContext = createContext(null);

let languagePromise = null;

/** Provides the list of available languages to descendant components. Fetches once and caches. */
export function LanguageProvider({ children }) {
	// Holds the list of available platform languages fetched from the API.
	const [languages, setLanguages] = useState([]);
	// Tracks whether the language list is still being fetched.
	const [loading, setLoading] = useState(true);

	// Fetches available languages once on mount using a shared singleton promise.
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

// Returns the languages list and loading state from LanguageContext.
export function useLanguageContext() {
	// Reads the LanguageContext value and throws if used outside its provider.
	const ctx = useContext(LanguageContext);
	if (!ctx) throw new Error('useLanguageContext must be used inside LanguageProvider');
	return ctx;
}
