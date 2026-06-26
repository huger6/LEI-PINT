import { useUser } from '../../hooks/userContext';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import ValidationsBoard from '../management/ValidationsBoard/ValidationsBoard';
import MyApplications from '../consultant/MyApplications/MyApplications';

// Page that renders the applications view appropriate to the user's role
export default function ApplicationsPage() {
	// Get the authenticated user and its loading state
	const { user, isUserLoading } = useUser();

	if (isUserLoading) return <LoadingScreen />;

	const role = user?.role;

	if (role === 'Administrator') {
		return <ValidationsBoard />;
	}

	return <MyApplications />;
}
