import { useTranslation } from 'react-i18next';
import PlaceholderPage from '../../../components/PlaceholderPage/PlaceholderPage';

export default function SllBadgeHistory() {
	const { t } = useTranslation();
	return (
		<PlaceholderPage
			icon="time"
			title={t('sidebar.sll.badgeHistory')}
			description={t('sllSections.badgeHistoryDesc')}
		/>
	);
}
