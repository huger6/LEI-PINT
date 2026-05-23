import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONSULTANT, SHARED } from '../../../routes/paths';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import { fetchNotifications } from '../../../features/notifications/api/notificationsApi';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './Objectives.module.css';

// ── Mock data (no API exists yet for goals) ────────────────
const MOCK_OBJECTIVES = [
	{
		id: 1,
		stageCode: 'A1',
		learningPath: 'objectives.pathTechnical',
		title: 'React Advanced Certification',
		description: 'objectives.mockDesc1',
		daysRemaining: 12,
		completedReqs: 6,
		totalReqs: 8,
	},
	{
		id: 2,
		stageCode: 'A2',
		learningPath: 'objectives.pathCloud',
		title: 'AWS Cloud Practitioner',
		description: 'objectives.mockDesc2',
		daysRemaining: 28,
		completedReqs: 4,
		totalReqs: 10,
	},
	{
		id: 3,
		stageCode: 'A3',
		learningPath: 'objectives.pathTechnical',
		title: 'Node.js Mastery',
		description: 'objectives.mockDesc3',
		daysRemaining: 45,
		completedReqs: 2,
		totalReqs: 12,
	},
];

const MOCK_TIMELINE = [
	{ code: 'E', label: 'objectives.beginner', title: 'objectives.foundations', reqs: '3/3', status: 'complete', detail: 'objectives.completedJan2025' },
	{ code: 'D', label: 'objectives.intermediate', title: 'objectives.development', reqs: '4/4', status: 'complete', detail: 'objectives.completedJun2025' },
	{ code: 'C', label: 'objectives.senior', title: 'objectives.specialization', reqs: '7/8', status: 'inProgress', detail: 'objectives.deadline31Dec2026' },
	{ code: 'B', label: 'objectives.advanced', title: 'objectives.techLeadership', reqs: '0/6', status: 'locked', detail: 'objectives.availableAfterC' },
	{ code: 'A', label: 'objectives.expert', title: 'objectives.architectureMentoring', reqs: '0/5', status: 'locked', detail: 'objectives.availableAfterB' },
];

const MOCK_STATS = {
	activeObjectives: 3,
	daysToNext: 12,
	badgesExpiring: 2,
	completedObjectives: 16,
};

const MOCK_PROGRESS = [
	{ name: 'objectives.technicalJourney', completed: 15, total: 20 },
	{ name: 'objectives.softSkills', completed: 15, total: 20 },
];
// ── End mock data ──────────────────────────────────────────

function getGreeting(t) {
	const hour = new Date().getHours();
	if (hour >= 6 && hour < 13) return t('welcomeCard.goodMorning');
	if (hour >= 13 && hour < 20) return t('welcomeCard.goodAfternoon');
	return t('welcomeCard.goodEvening');
}

export default function Objectives() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user: authUser } = useAuth();
	const { displayName } = useUser();
	const [reminders, setReminders] = useState([]);

	useEffect(() => {
		fetchNotifications({ limit: 5 })
			.then((res) => {
				const list = res?.data?.data || res?.data || [];
				setReminders(Array.isArray(list) ? list.slice(0, 5) : []);
			})
			.catch(() => setReminders([]));
	}, []);

	const greeting = getGreeting(t);
	const stats = MOCK_STATS;
	const objectives = MOCK_OBJECTIVES;
	const timeline = MOCK_TIMELINE;
	const progressData = MOCK_PROGRESS;

	const urgentCount = reminders.filter(
		(r) => r.priority === 'urgent' || r.type === 'warning' || r.type === 'sla_breach'
	).length;

	return (
		<div className={styles.page}>
			{/* ── Welcome Header ─────────────────────── */}
			<section className={styles.welcomeCard}>
				<div className={styles.welcomeAvatar}>
					<Icon name="user" size={28} color="var(--color-secondary)" />
				</div>
				<div className={styles.welcomeBody}>
					<h1 className={styles.welcomeTitle}>
						{greeting}, {displayName || authUser?.name || t('objectives.user')}!
					</h1>
					<p className={styles.welcomeSubtitle}>
						{t('objectives.welcomeSubtitle', {
							objectives: stats.activeObjectives,
							reminders: urgentCount || stats.badgesExpiring,
						})}
					</p>
				</div>
			</section>

			{/* ── Stats Cards ────────────────────────── */}
			<div className={styles.statsRow}>
				<StatCard
					icon="target"
					label={t('objectives.activeObjectives')}
					value={stats.activeObjectives}
					color="var(--color-primary)"
					badge="+1"
				/>
				<StatCard
					icon="clock"
					label={t('objectives.daysToNext')}
					value={stats.daysToNext}
					color="var(--color-warning)"
				/>
				<StatCard
					icon="danger"
					label={t('objectives.badgesExpiring')}
					value={stats.badgesExpiring}
					color="var(--color-error)"
				/>
				<StatCard
					icon="trophy"
					label={t('objectives.completedObjectives')}
					value={stats.completedObjectives}
					color="var(--color-success)"
					badge="+5"
				/>
			</div>

			{/* ── Professional Timeline ──────────────── */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('objectives.professionalTimeline')}</h2>
				<div className={styles.timeline}>
					{timeline.map((stage, i) => (
						<div key={stage.code} className={styles.timelineStep}>
							<div className={styles.timelineIndicator}>
								{stage.status === 'complete' && (
									<div className={`${styles.timelineDot} ${styles.dotComplete}`}>
										<Icon name="check_circle" size={28} color="var(--color-success)" />
									</div>
								)}
								{stage.status === 'inProgress' && (
									<div className={`${styles.timelineDot} ${styles.dotInProgress}`} />
								)}
								{stage.status === 'locked' && (
									<div className={`${styles.timelineDot} ${styles.dotLocked}`}>
										<Icon name="target" size={18} color="var(--color-outline)" />
									</div>
								)}
								{i < timeline.length - 1 && (
									<div className={`${styles.timelineLine} ${
										stage.status === 'complete' ? styles.lineComplete : styles.linePending
									}`} />
								)}
							</div>
							<div className={styles.timelineContent}>
								<span className={`${styles.timelineCode} ${
									stage.status === 'complete' ? styles.codeComplete :
									stage.status === 'inProgress' ? styles.codeInProgress : styles.codeLocked
								}`}>
									{stage.code} - {t(stage.label)}
								</span>
								<strong className={styles.timelineTitle}>{t(stage.title)}</strong>
								<span className={styles.timelineReqs}>{stage.reqs} {t('objectives.requirements')}</span>
								<span className={`${styles.timelineDetail} ${
									stage.status === 'inProgress' ? styles.detailWarning : ''
								}`}>
									{t(stage.detail)}
								</span>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* ── Two-column: Objectives + Reminders ── */}
			<div className={styles.twoColumn}>
				{/* Left: My Objectives */}
				<div className={styles.objectivesColumn}>
					<h2 className={styles.sectionTitle}>{t('objectives.myObjectives')}</h2>
					<div className={styles.objectivesList}>
						{objectives.map((obj) => {
							const pct = Math.round((obj.completedReqs / obj.totalReqs) * 100);
							return (
								<div key={obj.id} className={styles.objectiveCard}>
									<div className={styles.objectiveHeader}>
										<div className={styles.objectiveTags}>
											<span className={styles.stageTag}>{obj.stageCode}</span>
											<span className={styles.pathTag}>{t(obj.learningPath)}</span>
										</div>
										<span className={styles.daysRemaining}>
											{obj.daysRemaining} {t('objectives.daysRemaining')}
										</span>
									</div>
									<h3 className={styles.objectiveTitle}>{obj.title}</h3>
									<p className={styles.objectiveDesc}>{t(obj.description)}</p>
									<div className={styles.objectiveProgress}>
										<div className={styles.progressMeta}>
											<span>{obj.completedReqs}/{obj.totalReqs} {t('objectives.reqsCompleted')}</span>
											<span>{pct}%</span>
										</div>
										<div className={styles.progressTrack}>
											<div className={styles.progressFill} style={{ width: `${pct}%` }} />
										</div>
									</div>
									<div className={styles.objectiveAction}>
										<Button
											variant="filled"
											size="sm"
											className={styles.resumeBtn}
											onClick={() => navigate(SHARED.BADGES)}
										>
											<Icon name="chevron_forward" size={14} />
											{t('objectives.resumeTraining')}
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* Right: Reminders + Quick Actions */}
				<div className={styles.sideColumn}>
					{/* Reminders */}
					<section className={styles.remindersCard}>
						<div className={styles.remindersHeader}>
							<Icon name="bell" size={20} color="var(--color-warning)" />
							<h3 className={styles.remindersTitle}>{t('objectives.importantReminders')}</h3>
							{urgentCount > 0 && (
								<span className={styles.urgentBadge}>
									{urgentCount} {t('objectives.urgent')}
								</span>
							)}
						</div>
						{reminders.length > 0 ? (
							<div className={styles.remindersList}>
								{reminders.map((r, i) => (
									<ReminderItem key={r.notification_id || i} reminder={r} t={t} />
								))}
							</div>
						) : (
							<p className={styles.noReminders}>{t('objectives.noReminders')}</p>
						)}
					</section>

					{/* Quick Actions */}
					<section className={styles.quickActionsCard}>
						<h3 className={styles.quickActionsTitle}>{t('objectives.quickActions')}</h3>
						<div className={styles.quickActionsGrid}>
							<QuickAction
								icon="add"
								label={t('objectives.addNewObjective')}
								color="var(--color-success)"
								bg="var(--color-green-soft)"
								onClick={() => navigate(CONSULTANT.OBJECTIVES)}
							/>
							<QuickAction
								icon="badge"
								label={t('objectives.browseCatalog')}
								color="var(--color-primary)"
								bg="var(--color-primary-soft)"
								onClick={() => navigate(SHARED.BADGES)}
							/>
							<QuickAction
								icon="progress"
								label={t('objectives.viewProgressReport')}
								color="var(--color-warning)"
								bg="var(--color-orange-soft)"
								onClick={() => navigate(CONSULTANT.EVOLUTION || CONSULTANT.HOME)}
							/>
							<QuickAction
								icon="paper"
								label={t('objectives.exportObjectives')}
								color="var(--color-secondary)"
								bg="var(--color-blue-soft)"
							/>
						</div>
					</section>
				</div>
			</div>

			{/* ── Progress Vision ────────────────────── */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>{t('objectives.progressVision')}</h2>
				<div className={styles.donutRow}>
					{progressData.map((pd) => {
						const pct = Math.round((pd.completed / pd.total) * 100);
						return (
							<div key={pd.name} className={styles.donutCard}>
								<PieDonutChart
									data={[
										{ name: t('objectives.completed'), value: pd.completed },
										{ name: t('objectives.remaining'), value: pd.total - pd.completed },
									]}
									nameKey="name"
									valueKey="value"
									isDonut
									height={200}
									colors={['var(--color-primary)', 'rgba(57, 99, 156, 0.12)']}
								/>
								<div className={styles.donutLabel}>
									<strong>{t(pd.name)}</strong>
									<span>{pd.completed}/{pd.total} badges</span>
								</div>
							</div>
						);
					})}
				</div>
			</section>
		</div>
	);
}

// ── Sub-components ─────────────────────────────────────────

function StatCard({ icon, label, value, color, badge }) {
	return (
		<div className={styles.statCard}>
			<div className={styles.statIconWrap} style={{ color }}>
				<Icon name={icon} size={24} color={color} />
				{badge && <span className={styles.statBadge}>{badge}</span>}
			</div>
			<span className={styles.statLabel}>{label}</span>
			<span className={styles.statValue} style={{ color }}>{value}</span>
		</div>
	);
}

function ReminderItem({ reminder, t }) {
	const title = reminder.title || reminder.notification_title || t('objectives.reminder');
	const body = reminder.message || reminder.notification_message || '';
	const date = reminder.created_at || reminder.createdAt;
	const type = reminder.type || 'info';

	const severityMap = {
		warning: { label: t('objectives.urgent'), cls: styles.severityUrgent },
		sla_breach: { label: t('objectives.urgent'), cls: styles.severityUrgent },
		reminder: { label: t('objectives.attention'), cls: styles.severityAttention },
		info: { label: 'Info', cls: styles.severityInfo },
	};

	const severity = severityMap[type] || severityMap.info;

	return (
		<div className={styles.reminderItem}>
			<div className={styles.reminderBody}>
				<div className={styles.reminderTitleRow}>
					<strong className={styles.reminderTitle}>{title}</strong>
					<span className={`${styles.severityTag} ${severity.cls}`}>{severity.label}</span>
				</div>
				{body && <p className={styles.reminderText}>{body}</p>}
				{date && (
					<span className={styles.reminderDate}>
						{new Date(date).toLocaleDateString('pt-PT', {
							day: 'numeric', month: 'short', year: 'numeric',
						})}
					</span>
				)}
			</div>
			<Icon name="chevron_forward" size={16} color="var(--color-outline)" />
		</div>
	);
}

function QuickAction({ icon, label, color, bg, onClick }) {
	return (
		<button type="button" className={styles.quickActionItem} onClick={onClick}>
			<div className={styles.quickActionIcon} style={{ background: bg, color }}>
				<Icon name={icon} size={20} color={color} />
			</div>
			<span className={styles.quickActionLabel}>{label}</span>
		</button>
	);
}
