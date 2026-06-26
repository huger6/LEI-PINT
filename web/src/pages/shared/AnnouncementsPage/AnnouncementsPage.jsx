import { useUser } from '../../../hooks/userContext';
import ConsultantAnnouncements from '../../consultant/ConsultantAnnouncements/ConsultantAnnouncements';
import Announcements from '../../management/Announcements/Announcements';

// Routes the announcements view based on the current user's role
export default function AnnouncementsPage() {
	// Read the authenticated user from context
	const { user } = useUser();

	if (user?.role === 'Consultant') return <ConsultantAnnouncements />;
	return <Announcements />;
}
