import { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { extractCollection } from '../utils/collections';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
	const [languages, setLanguages] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		api.get('/languages')
			.then((res) => setLanguages(extractCollection(res)))
			.catch(() => setLanguages([]))
			.finally(() => setLoading(false));
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
