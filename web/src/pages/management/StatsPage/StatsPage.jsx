import { Navigate } from 'react-router-dom';
import { useUser } from '../../../hooks/userContext';
import { SHARED } from '../../../routes/paths';
import TmStats from '../TmStats/TmStats';
import SllStats from '../SllStats/SllStats';

// Dispatches the statistics/reports page by role (shared /stats path).
export default function StatsPage() {
	const { user } = useUser();

	// The Administrator oversees the whole platform, so reuses the global
	// (Talent Manager) statistics/reports view.
	if (user?.role === 'Talent Manager' || user?.role === 'Administrator') return <TmStats />;
	if (user?.role === 'Service Line Leader') return <SllStats />;
	return <Navigate to={SHARED.UNAUTHORIZED} replace />;
}
