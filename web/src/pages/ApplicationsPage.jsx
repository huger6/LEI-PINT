import { useUser } from '../hooks/userContext';
import LoadingScreen from '../components/LoadingScreen/LoadingScreen';
import AdminApplications from './admin/AdminApplications';
import MyApplications from './consultant/MyApplications';

export default function ApplicationsPage() {
	const { user, isUserLoading } = useUser();

	if (isUserLoading) return <LoadingScreen />;

	const role = user?.role;

	if (role === 'Administrator') {
		return <AdminApplications />;
	}

	return <MyApplications />;
}
