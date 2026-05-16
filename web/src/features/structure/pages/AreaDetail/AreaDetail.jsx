import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';

const DUMMY_AREA = {
	title: 'Solutions Architect',
	description: 'The Solutions Architect area focuses on designing distributed systems, evaluating cost-optimization strategies, and implementing best practices for high availability, fault tolerance, and security on cloud platforms.',
	imageUrl: null,
};

const DUMMY_STATS = [
	{ icon: 'tabler_users', label: 'Users', value: 31, accentColor: 'var(--color-primary)', accentBg: 'var(--color-primary-soft)' },
	{ icon: 'paper', label: 'Pending', value: 2, accentColor: 'var(--color-secondary)', accentBg: 'var(--color-secondary-container)' },
	{ icon: 'target', label: 'SLAs', value: 1, accentColor: '#0f7f69', accentBg: 'var(--color-green-soft)' },
	{ icon: 'megaphone', label: 'Alerts', value: 0, accentColor: 'var(--color-warning)', accentBg: 'var(--color-orange-soft)' },
	{ icon: 'badge', label: 'Badges', value: 6, accentColor: '#8d640d', accentBg: 'rgba(210, 148, 21, 0.12)' },
	{ icon: 'fire', label: 'Completion Rate', value: '82%', accentColor: '#274f82', accentBg: 'rgba(57, 99, 156, 0.12)' },
];

const DUMMY_SUB_STRUCTURES = [
	{ id: 1, title: 'Associate Level', description: 'Entry-level architecture fundamentals', count: 2 },
	{ id: 2, title: 'Professional Level', description: 'Advanced architectural design patterns', count: 3 },
	{ id: 3, title: 'Specialty Level', description: 'Domain-specific architecture expertise', count: 1 },
];

export default function AreaDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();

	return (
		<StructureDetailLayout
			title={DUMMY_AREA.title}
			description={DUMMY_AREA.description}
			icon="area"
			imageUrl={DUMMY_AREA.imageUrl}
			tone="areas"
			stats={DUMMY_STATS}
			subStructures={DUMMY_SUB_STRUCTURES}
			subStructureLabel={t('shared.structureLabels.stages')}
			subStructureIcon="evolution"
			subStructureTone="levels"
			addSubLabel={t('structureDetail.addLevel', { defaultValue: 'Add Level' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
