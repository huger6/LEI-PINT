import { useUser } from '../../hooks/userContext';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import ValidationsBoard from '../management/ValidationsBoard/ValidationsBoard';
import MyApplications from '../consultant/MyApplications/MyApplications';

export default function ApplicationsPage() {
	const { user, isUserLoading } = useUser();

	if (isUserLoading) return <LoadingScreen />;

	const role = user?.role;

	if (role === 'Administrator') {
		return <ValidationsBoard />;
	}

	return <MyApplications />;
}
