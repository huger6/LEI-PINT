// Hook for fetching and caching entity counts across the organizational structure.
import { useEffect, useState } from 'react';
import { EMPTY_STRUCTURE_COUNTS, getAllStructureCounts } from '../api/structureCountsApi';

// Fetches structure entity counts on mount and returns them with a loading flag.
export function useStructureCounts() {
	// Stores the fetched entity counts for the organizational structure.
	const [counts, setCounts] = useState(EMPTY_STRUCTURE_COUNTS);
	// Tracks whether the counts fetch is still in progress.
	const [loading, setLoading] = useState(true);

	// Fetches structure counts on mount and cleans up by tracking mount state.
	useEffect(() => {
		let isMounted = true;

		// Calls the API to retrieve all structure counts and updates state.
		async function fetchCounts() {
			try {
				setLoading(true);
				const nextCounts = await getAllStructureCounts();
				if (isMounted) setCounts(nextCounts);
			} catch {
				if (isMounted) setCounts(EMPTY_STRUCTURE_COUNTS);
			} finally {
				if (isMounted) setLoading(false);
			}
		}

		fetchCounts();

		return () => {
			isMounted = false;
		};
	}, []);

	return { counts, loading };
}
