import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CONSULTANT, SHARED } from '../../../routes/paths';
import { useAuth } from '../../../features/auth/hooks/useAuth';
import { useUser } from '../../../hooks/userContext';
import { fetchNotifications } from '../../../features/notifications/api/notificationsApi';
import { getGoals, getGoalStats, getProgressionTimeline } from '../../../features/goals/api/goalsApi';
import { getLearningPathProgress } from '../../../features/goals/api/statsApi';
import PieDonutChart from '../../../components/Graphs/PieDonut/PieDonutChart';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './Objectives.module.css';

function getGreeting(t) {
	const hour = new Date().getHours();
	if (hour >= 6 && hour < 13) return t('welcomeCard.goodMorning');
	if (hour >= 13 && hour < 20) return t('welcomeCard.goodAfternoon');
	return t('welcomeCard.goodEvening');
}

function deriveTimelineStatus(stages) {
	let foundInProgress = false;
	return stages.map((s) => {
		if (s.total_badges > 0 && s.earned_badges >= s.total_badges) {
			return { ...s, status: 'complete' };
		}
		if (s.earned_badges > 0 && !foundInProgress) {
			foundInProgress = true;
			return { ...s, status: 'inProgress' };
		}
		return { ...s, status: 'locked' };
	});
}

function mapGoalToObjective(goal) {
	const badge = goal.badge_badge;
	const app = goal.application;
	const totalReqs = badge?.badge_requirements?.length || 0;
	const completedReqs = app?.requirements_evidences?.length || 0;
	const stageCode = badge?.progression_stage?.stage_code?.stage_code || '?';
	const learningPath = badge?.learning_path?.path_title || '';

	let daysRemaining = 0;
	if (goal.event_end_date) {
		const diff = new Date(goal.event_end_date) - new Date();
		daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
	}

	return {
		id: goal.goal_id,
		stageCode,
		learningPath,
		title: badge?.badge_title || goal.event_title,
		description: goal.event_description || '',
		daysRemaining,
		completedReqs,
		totalReqs,
	};
}

export default function Objectives() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { user: authUser } = useAuth();
	const { displayName } = useUser();
	const [reminders, setReminders] = useState([]);
	const [stats, setStats] = useState({ activeObjectives: 0, daysToNext: 0, badgesExpiring: 0, completedObjectives: 0 });
	const [objectives, setObjectives] = useState([]);
	const [timeline, setTimeline] = useState([]);
	const [progressData, setProgressData] = useState([]);
	const greeting = getGreeting(t);

	useEffect(() => {
		fetchNotifications({ limit: 5 })
			.then((res) => {
				const list = res?.data?.data || res?.data || [];
				setReminders(Array.isArray(list) ? list.slice(0, 5) : []);
			})
			.catch(() => setReminders([]));

		getGoalStats()
			.then((data) => setStats({
				activeObjectives: data.active_objectives ?? 0,
				daysToNext: data.days_to_next ?? 0,
				badgesExpiring: data.badges_expiring ?? 0,
				completedObjectives: data.completed_objectives ?? 0,
			}))
			.catch(() => {});

		getGoals()
			.then((data) => setObjectives(data.map(mapGoalToObjective)))
			.catch(() => setObjectives([]));

		getProgressionTimeline()
			.then((data) => setTimeline(deriveTimelineStatus(data)))
			.catch(() => setTimeline([]));

		getLearningPathProgress()
			.then((data) => {
				const mapped = data
					.filter((lp) => lp.total_badges > 0)
					.map((lp) => ({
						name: lp.path_title || lp.learning_path,
						completed: parseInt(lp.earned_badges ?? lp.badges_earned ?? 0, 10),
						total: parseInt(lp.total_badges ?? 0, 10),
					}));
				setProgressData(mapped.length > 0 ? mapped : []);
			})
			.catch(() => setProgressData([]));
	}, []);

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
									{stage.code} - {stage.title}
								</span>
								<strong className={styles.timelineTitle}>{stage.title}</strong>
								<span className={styles.timelineReqs}>{stage.earned_badges}/{stage.total_badges} {t('objectives.requirements')}</span>
								<span className={`${styles.timelineDetail} ${
									stage.status === 'inProgress' ? styles.detailWarning : ''
								}`}>
									{stage.status === 'complete' && stage.last_awarded
										? t('objectives.completedOn', { date: new Date(stage.last_awarded).toLocaleDateString() })
										: stage.status === 'inProgress'
											? t('objectives.inProgressLabel')
											: t('objectives.lockedLabel')}
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
							const pct = obj.totalReqs > 0 ? Math.round((obj.completedReqs / obj.totalReqs) * 100) : 0;
							return (
								<div key={obj.id} className={styles.objectiveCard}>
									<div className={styles.objectiveHeader}>
										<div className={styles.objectiveTags}>
											<span className={styles.stageTag}>{obj.stageCode}</span>
											<span className={styles.pathTag}>{obj.learningPath}</span>
										</div>
										<span className={styles.daysRemaining}>
											{obj.daysRemaining} {t('objectives.daysRemaining')}
										</span>
									</div>
									<h3 className={styles.objectiveTitle}>{obj.title}</h3>
									<p className={styles.objectiveDesc}>{obj.description}</p>
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
									<strong>{pd.name}</strong>
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
