import { useUser } from '../../hooks/userContext';
import LoadingScreen from '../../components/LoadingScreen/LoadingScreen';
import BadgeApplicationForm from '../consultant/BadgeApplicationForm/BadgeApplicationForm';
import ApplicationDetail from '../consultant/ApplicationDetail/ApplicationDetail';

export default function ApplicationDetailPage() {
	const { user, isUserLoading } = useUser();

	if (isUserLoading) return <LoadingScreen />;

	if (user?.role === 'Consultant') {
		return <BadgeApplicationForm />;
	}

	return <ApplicationDetail />;
}
