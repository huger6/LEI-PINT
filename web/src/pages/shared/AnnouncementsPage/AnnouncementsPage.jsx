import { useUser } from '../../../hooks/userContext';
import ConsultantAnnouncements from '../../consultant/ConsultantAnnouncements/ConsultantAnnouncements';
import Announcements from '../../management/Announcements/Announcements';

export default function AnnouncementsPage() {
	const { user } = useUser();

	if (user?.role === 'Consultant') return <ConsultantAnnouncements />;
	return <Announcements />;
}
