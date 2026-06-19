import { Navigate } from 'react-router-dom';
import { useUser } from '../../../hooks/userContext';
import { SHARED } from '../../../routes/paths';
import TmStats from '../TmStats/TmStats';
import SllStats from '../SllStats/SllStats';
import AdminStats from '../../admin/AdminStats/AdminStats';

// Dispatches the statistics/reports page by role (shared /stats path).
export default function StatsPage() {
	const { user } = useUser();

	// The Administrator gets a dedicated, richer view (platform-wide enrollment,
	// named expiring list, full exports). TM/SLL get aggregate-only views.
	if (user?.role === 'Administrator') return <AdminStats />;
	if (user?.role === 'Talent Manager') return <TmStats />;
	if (user?.role === 'Service Line Leader') return <SllStats />;
	return <Navigate to={SHARED.UNAUTHORIZED} replace />;
}
