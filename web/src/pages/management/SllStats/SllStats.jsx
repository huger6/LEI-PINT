import { useTranslation } from 'react-i18next';
import BadgeOverview from '../../../components/BadgeOverview/BadgeOverview';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import styles from './SllStats.module.css';

export default function SllStats() {
	const { t } = useTranslation();
	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('sidebar.sll.stats')}</h1>
			<ExportsPanel />
			<BadgeOverview />
		</div>
	);
}
