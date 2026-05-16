import { useTranslation } from 'react-i18next';
import StructureTypeCard from '../../../components/StructureTypeCard/StructureTypeCard';
import styles from './AdminStructure.module.css';

export default function AdminStructure() {
	const { t } = useTranslation();

	const SECTIONS = [
		{
			to: '/learning-paths',
			title: t('shared.structureLabels.learningPaths'),
			description: t('shared.structureDescriptions.learningPaths'),
			icon: 'learning-path',
			count: 0,
			tone: 'learningPaths',
		},
		{
			to: '/service-lines',
			title: t('shared.structureLabels.serviceLines'),
			description: t('shared.structureDescriptions.serviceLines'),
			icon: 'service-line',
			count: 0,
			tone: 'serviceLines',
		},
		{
			to: '/areas',
			title: t('shared.structureLabels.areas'),
			description: t('shared.structureDescriptions.areas'),
			icon: 'area',
			count: 0,
			tone: 'areas',
		},
		{
			to: '/levels',
			title: t('shared.structureLabels.stages'),
			description: t('shared.structureDescriptions.stages'),
			icon: 'evolution',
			count: 0,
			tone: 'levels',
		},
	];

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1 className={styles.title}>{t('adminStructure.title')}</h1>
				<p className={styles.subtitle}>
					{t('adminStructure.countsPlaceholder', {
						defaultValue: 'Structure counts are placeholders for now and will be connected to API data later.',
					})}
				</p>
			</header>

			<div className={styles.cardList}>
				{SECTIONS.map((section) => (
					<StructureTypeCard key={section.to} {...section} />
				))}
			</div>
		</div>
	);
}
