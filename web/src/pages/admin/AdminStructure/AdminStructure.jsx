import { useTranslation } from 'react-i18next';
import StructureTypeCard from '../../../components/StructureTypeCard/StructureTypeCard';
import { useStructureCounts } from '../../../features/structure';
import { ADMIN } from '../../../routes/paths';
import styles from './AdminStructure.module.css';

export default function AdminStructure() {
	const { t } = useTranslation();
	const { counts, loading } = useStructureCounts();

	const SECTIONS = [
		{
			to: ADMIN.LEARNING_PATHS,
			title: t('shared.structureLabels.learningPaths'),
			description: t('shared.structureDescriptions.learningPaths'),
			icon: 'learning-path',
			countKey: 'learningPaths',
			tone: 'learningPaths',
		},
		{
			to: ADMIN.SERVICE_LINES,
			title: t('shared.structureLabels.serviceLines'),
			description: t('shared.structureDescriptions.serviceLines'),
			icon: 'service-line',
			countKey: 'serviceLines',
			tone: 'serviceLines',
		},
		{
			to: ADMIN.AREAS,
			title: t('shared.structureLabels.areas'),
			description: t('shared.structureDescriptions.areas'),
			icon: 'area',
			countKey: 'areas',
			tone: 'areas',
		},
		{
			to: ADMIN.LEVELS,
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
					{t('adminStructure.description')}
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
