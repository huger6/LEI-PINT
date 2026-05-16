import { useTranslation } from 'react-i18next';
import StructureTypeCard from '../../../components/StructureTypeCard/StructureTypeCard';
import { useStructureCounts } from '../../../features/structure';
import styles from './AdminStructure.module.css';

export default function AdminStructure() {
	const { t } = useTranslation();
	const { counts, loading } = useStructureCounts();

	const SECTIONS = [
		{
			to: '/learning-paths',
			title: t('shared.structureLabels.learningPaths'),
			description: t('shared.structureDescriptions.learningPaths'),
			icon: 'learning-path',
			countKey: 'learningPaths',
			tone: 'learningPaths',
		},
		{
			to: '/service-lines',
			title: t('shared.structureLabels.serviceLines'),
			description: t('shared.structureDescriptions.serviceLines'),
			icon: 'service-line',
			countKey: 'serviceLines',
			tone: 'serviceLines',
		},
		{
			to: '/areas',
			title: t('shared.structureLabels.areas'),
			description: t('shared.structureDescriptions.areas'),
			icon: 'area',
			countKey: 'areas',
			tone: 'areas',
		},
		{
			to: '/levels',
			title: t('shared.structureLabels.stages'),
			description: t('shared.structureDescriptions.stages'),
			icon: 'evolution',
			countKey: 'stages',
			tone: 'levels',
		},
	];

	return (
		<div className={styles.page}>
			<header className={styles.header}>
				<h1 className={styles.title}>{t('adminStructure.title')}</h1>
				<p className={styles.subtitle}>
					{t('adminStructure.countsPlaceholder', {
						defaultValue: 'Counts are fetched from live structure data.',
					})}
				</p>
			</header>

			<div className={styles.cardList}>
				{SECTIONS.map((section) => (
					<StructureTypeCard
						key={section.to}
						{...section}
						count={loading ? '...' : counts[section.countKey]}
					/>
				))}
			</div>
		</div>
	);
}
