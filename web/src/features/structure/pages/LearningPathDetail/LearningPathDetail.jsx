import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';

const DUMMY_LP = {
	title: 'Cloud & DevOps',
	description: 'This learning path covers the full spectrum of cloud computing and DevOps practices, including infrastructure as code, container orchestration, CI/CD pipelines, and cloud-native development across major providers like AWS, Azure, and GCP.',
	imageUrl: null,
};

const DUMMY_STATS = [
	{ icon: 'tabler_users', label: 'Users', value: 142, accentColor: 'var(--color-primary)', accentBg: 'var(--color-primary-soft)' },
	{ icon: 'paper', label: 'Pending', value: 8, accentColor: 'var(--color-secondary)', accentBg: 'var(--color-secondary-container)' },
	{ icon: 'target', label: 'SLAs', value: 3, accentColor: '#0f7f69', accentBg: 'var(--color-green-soft)' },
	{ icon: 'megaphone', label: 'Alerts', value: 2, accentColor: 'var(--color-warning)', accentBg: 'var(--color-orange-soft)' },
	{ icon: 'badge', label: 'Badges', value: 24, accentColor: '#8d640d', accentBg: 'rgba(210, 148, 21, 0.12)' },
	{ icon: 'evolution', label: 'Avg. Progress', value: '67%', accentColor: '#274f82', accentBg: 'rgba(57, 99, 156, 0.12)' },
];

const DUMMY_SUB_STRUCTURES = [
	{ id: 1, title: 'AWS Solutions', description: 'Amazon Web Services certifications and specializations', count: 5 },
	{ id: 2, title: 'Azure Fundamentals', description: 'Microsoft Azure cloud infrastructure path', count: 4 },
	{ id: 3, title: 'DevOps Engineering', description: 'CI/CD, containerization, and infrastructure automation', count: 6 },
	{ id: 4, title: 'GCP Architecture', description: 'Google Cloud Platform design and implementation', count: 3 },
];

export default function LearningPathDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();

	return (
		<StructureDetailLayout
			title={DUMMY_LP.title}
			description={DUMMY_LP.description}
			icon="learning-path"
			imageUrl={DUMMY_LP.imageUrl}
			tone="learningPaths"
			stats={DUMMY_STATS}
			subStructures={DUMMY_SUB_STRUCTURES}
			subStructureLabel={t('shared.structureLabels.serviceLines')}
			subStructureIcon="service-line"
			subStructureTone="serviceLines"
			addSubLabel={t('structureDetail.addServiceLine', { defaultValue: 'Add Service Line' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
