import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';

const DUMMY_SL = {
	title: 'AWS Solutions',
	description: 'This service line groups all certifications and competencies related to Amazon Web Services. It covers foundational cloud concepts through advanced architecture and specialization credentials.',
	imageUrl: null,
};

const DUMMY_STATS = [
	{ icon: 'tabler_users', label: 'Users', value: 56, accentColor: 'var(--color-primary)', accentBg: 'var(--color-primary-soft)' },
	{ icon: 'paper', label: 'Pending', value: 4, accentColor: 'var(--color-secondary)', accentBg: 'var(--color-secondary-container)' },
	{ icon: 'target', label: 'SLAs', value: 2, accentColor: '#0f7f69', accentBg: 'var(--color-green-soft)' },
	{ icon: 'megaphone', label: 'Alerts', value: 1, accentColor: 'var(--color-warning)', accentBg: 'var(--color-orange-soft)' },
	{ icon: 'badge', label: 'Badges', value: 12, accentColor: '#8d640d', accentBg: 'rgba(210, 148, 21, 0.12)' },
	{ icon: 'evolution', label: 'Avg. Progress', value: '73%', accentColor: '#274f82', accentBg: 'rgba(57, 99, 156, 0.12)' },
];

const DUMMY_SUB_STRUCTURES = [
	{ id: 1, title: 'Cloud Practitioner', description: 'Foundational AWS cloud concepts and services', count: 3 },
	{ id: 2, title: 'Solutions Architect', description: 'Design and deploy scalable systems on AWS', count: 4 },
	{ id: 3, title: 'Developer Associate', description: 'Develop and maintain AWS-based applications', count: 2 },
];

export default function ServiceLineDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();

	return (
		<StructureDetailLayout
			title={DUMMY_SL.title}
			description={DUMMY_SL.description}
			icon="service-line"
			imageUrl={DUMMY_SL.imageUrl}
			tone="serviceLines"
			stats={DUMMY_STATS}
			subStructures={DUMMY_SUB_STRUCTURES}
			subStructureLabel={t('shared.structureLabels.areas')}
			subStructureIcon="area"
			subStructureTone="areas"
			addSubLabel={t('structureDetail.addArea', { defaultValue: 'Add Area' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
