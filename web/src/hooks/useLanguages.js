import { useState, useEffect } from 'react';
import api from '../services/api';
import { extractCollection } from '../utils/collections';

const MAX_LANGUAGES = 5;

/**
 * Fetches available languages from the API, capped at MAX_LANGUAGES.
 * Returns { languages, loading } where each language has { language_id, language_iso, language_name }.
 */
export function useLanguages() {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/languages')
            .then((res) => {
                const all = extractCollection(res);
                setLanguages(all.slice(0, MAX_LANGUAGES));
            })
            .catch(() => setLanguages([]))
            .finally(() => setLoading(false));
    }, []);

    return { languages, loading };
}
