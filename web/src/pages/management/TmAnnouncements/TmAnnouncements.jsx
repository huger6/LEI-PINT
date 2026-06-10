import { useTranslation } from 'react-i18next';
import PlaceholderPage from '../../../components/PlaceholderPage/PlaceholderPage';

export default function TmAnnouncements() {
	const { t } = useTranslation();
	return (
		<PlaceholderPage
			icon="megaphone"
			title={t('sidebar.tm.announcements')}
			description={t('tmSections.announcementsDesc')}
		/>
	);
}
