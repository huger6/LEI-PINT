import { Navigate } from 'react-router-dom';
import { useUser } from '../../../hooks/userContext';
import { SHARED } from '../../../routes/paths';
import TmStats from '../TmStats/TmStats';
import SllStats from '../SllStats/SllStats';

// Dispatches the statistics/reports page by role (shared /stats path).
export default function StatsPage() {
	const { user } = useUser();

	if (user?.role === 'Talent Manager') return <TmStats />;
	if (user?.role === 'Service Line Leader') return <SllStats />;
	return <Navigate to={SHARED.UNAUTHORIZED} replace />;
}
