import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StructureDetailLayout from '../../layouts/StructureDetailLayout/StructureDetailLayout';

const DUMMY_LEVEL = {
	title: 'Professional Level',
	description: 'The Professional progression stage targets experienced practitioners ready to demonstrate advanced competency. Candidates at this level are expected to design complex systems, lead technical decisions, and mentor associates.',
	imageUrl: null,
};

const DUMMY_STATS = [
	{ icon: 'tabler_users', label: 'Users', value: 14, accentColor: 'var(--color-primary)', accentBg: 'var(--color-primary-soft)' },
	{ icon: 'paper', label: 'Pending', value: 1, accentColor: 'var(--color-secondary)', accentBg: 'var(--color-secondary-container)' },
	{ icon: 'target', label: 'SLAs', value: 1, accentColor: '#0f7f69', accentBg: 'var(--color-green-soft)' },
	{ icon: 'megaphone', label: 'Alerts', value: 0, accentColor: 'var(--color-warning)', accentBg: 'var(--color-orange-soft)' },
	{ icon: 'badge', label: 'Badges', value: 3, accentColor: '#8d640d', accentBg: 'rgba(210, 148, 21, 0.12)' },
	{ icon: 'star-points', label: 'Avg. Points', value: 850, accentColor: '#274f82', accentBg: 'rgba(57, 99, 156, 0.12)' },
];

const DUMMY_SUB_STRUCTURES = [
	{ id: 1, title: 'AWS Solutions Architect Professional', description: 'Advanced architecture on AWS', count: 5 },
	{ id: 2, title: 'AWS DevOps Engineer Professional', description: 'CI/CD and automation on AWS', count: 4 },
	{ id: 3, title: 'AWS Security Specialty', description: 'Security best practices on AWS', count: 3 },
];

export default function LevelDetail() {
	const { slug } = useParams();
	const { t } = useTranslation();

	return (
		<StructureDetailLayout
			title={DUMMY_LEVEL.title}
			description={DUMMY_LEVEL.description}
			icon="evolution"
			imageUrl={DUMMY_LEVEL.imageUrl}
			tone="levels"
			stats={DUMMY_STATS}
			subStructures={DUMMY_SUB_STRUCTURES}
			subStructureLabel={t('structureDetail.badges', { defaultValue: 'Badges' })}
			subStructureIcon="badge"
			subStructureTone="learningPaths"
			addSubLabel={t('structureDetail.addBadge', { defaultValue: 'Add Badge' })}
			onEdit={() => {}}
			onAddSub={() => {}}
			onDelete={() => {}}
			onExport={() => {}}
		/>
	);
}
