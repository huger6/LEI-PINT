import { useTranslation } from 'react-i18next';
import PlaceholderPage from '../../../components/PlaceholderPage/PlaceholderPage';

export default function SllTeam() {
	const { t } = useTranslation();
	return (
		<PlaceholderPage
			icon="user"
			title={t('sidebar.sll.team')}
			description={t('sllSections.teamDesc')}
		/>
	);
}
