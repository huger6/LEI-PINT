import { useTranslation } from 'react-i18next';
import PlaceholderPage from '../../../components/PlaceholderPage/PlaceholderPage';

export default function TmConsultants() {
	const { t } = useTranslation();
	return (
		<PlaceholderPage
			icon="user"
			title={t('sidebar.tm.consultants')}
			description={t('tmSections.consultantsDesc')}
		/>
	);
}
