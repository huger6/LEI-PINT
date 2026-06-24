// Hook for fetching and caching entity counts across the organizational structure.
import { useEffect, useState } from 'react';
import { EMPTY_STRUCTURE_COUNTS, getAllStructureCounts } from '../api/structureCountsApi';

export function useStructureCounts() {
	const [counts, setCounts] = useState(EMPTY_STRUCTURE_COUNTS);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let isMounted = true;

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
