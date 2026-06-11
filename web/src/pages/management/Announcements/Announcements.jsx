import { useTranslation } from 'react-i18next';
import PlaceholderPage from '../../../components/PlaceholderPage/PlaceholderPage';

// Shared announcements view for management roles (Talent Manager / Service Line Leader).
export default function Announcements() {
	const { t } = useTranslation();
	return (
		<PlaceholderPage
			icon="megaphone"
			title={t('sidebar.tm.announcements')}
			description={t('tmSections.announcementsDesc')}
		/>
	);
}
