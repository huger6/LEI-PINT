import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAcquisitionTimeline, getPeerComparison, getConsultantsOverview } from '../../../features/statistics/api/statisticsApi';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import { useUser } from '../../../hooks/userContext';
import { TM, SLL, SHARED } from '../../../routes/paths';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import Button from '../../../components/Button/Button';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import Spinner from '../../../components/Spinner/Spinner';
import PeerPickerModal from './PeerPickerModal/PeerPickerModal';
import styles from './ConsultantDetail.module.css';

// Badge history lenses: earned badges vs still-in-process applications.
const HISTORY_FILTERS = { obtained: ['Accepted'], inprocess: ['Open', 'Submitted', 'In validation'] };
const APP_STATE_KEY = { Open: 'open', Submitted: 'submitted', 'In validation': 'inValidation', Accepted: 'accepted', Rejected: 'rejected' };
const fmtHistDate = (d) => (d ? new Date(d).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Return the CSS class for the state pill badge on a history row.
function histStatePill(state) {
	if (state === 'Accepted') return styles.pillApproved;
	if (state === 'Rejected') return styles.pillRejected;
	if (state === 'Open') return styles.pillOpen;
	return styles.pillPending;
}

/**
 * Per-consultant detail for leadership: professional evolution timeline (TM
 * bonus), peer comparison (SLL bonus) and the consultant's badge history
 * (earned vs in-process). Opened from the consultants/team list.
 */
export default function ConsultantDetail() {
	// Access translation function.
	const { t } = useTranslation();
	// Extract the consultant's GUID from the URL params.
	const { userGuid } = useParams();
	// Allow programmatic navigation.
	const navigate = useNavigate();
	// Retrieve the current authenticated user.
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';
	const listPath = isSll ? SLL.TEAM : TM.CONSULTANTS;

	// Store the evolution timeline data for the line chart.
	const [timeline, setTimeline] = useState([]);
	// Store peer comparison data including averages and ranked peers.
	const [comparison, setComparison] = useState(null);
	// Store all consultants for the peer picker dropdown.
	const [consultants, setConsultants] = useState([]);
	// Store the GUID of the manually chosen comparison peer.
	const [compareGuid, setCompareGuid] = useState('');
	// Control visibility of the peer picker modal.
	const [showPicker, setShowPicker] = useState(false);
	// Track the loading state for the initial data fetch.
	const [loading, setLoading] = useState(true);
	// Store any error message from the data fetch.
	const [error, setError] = useState('');

	// Store the active history filter key ('obtained' or 'inprocess').
	const [historyFilter, setHistoryFilter] = useState('obtained');
	// Store the badge/application history rows for the selected filter.
	const [history, setHistory] = useState([]);
	// Track loading state for the history section separately.
	const [historyLoading, setHistoryLoading] = useState(true);

	// Load timeline, comparison, and consultants list in parallel.
	const load = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [tl, cmp, list] = await Promise.all([
				getAcquisitionTimeline(userGuid),
				getPeerComparison(userGuid),
				getConsultantsOverview({ page: 1, limit: 100, sort: 'name' }),
			]);
			setTimeline(tl);
			setComparison(cmp);
			setConsultants(list.rows || []);
		} catch (err) {
			setError(resolveErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}, [userGuid]);

	// Trigger the main data load when the consultant GUID changes.
	useEffect(() => { load(); }, [load]);

	// Fetch the badge history whenever the consultant or filter changes.
	useEffect(() => {
		let active = true;
		setHistoryLoading(true);
		getApplicationsPaged({ consultantGuid: userGuid, state: HISTORY_FILTERS[historyFilter], limit: 50 })
			.then(({ data }) => { if (active) setHistory(data); })
			.catch(() => { if (active) setHistory([]); })
			.finally(() => { if (active) setHistoryLoading(false); });
		return () => { active = false; };
	}, [userGuid, historyFilter]);

	const target = comparison?.target;
	const peers = comparison?.peers || [];
	const averages = comparison?.averages || { points: 0, badges: 0 };

	const ranked = target ? [target, ...peers].sort((a, b) => b.total_points - a.total_points) : [];
	const standing = target ? ranked.findIndex((r) => r.is_target) + 1 : 0;

	// Comparison target: a specific chosen consultant, or the peer average.
	const chosen = consultants.find((c) => c.user_guid === compareGuid) || null;
	const compareLabel = chosen ? chosen.full_name : t('consultantDetail.peerAverage');
	const comparePoints = chosen ? Number(chosen.total_points) : averages.points;
	const compareBadges = chosen ? Number(chosen.total_badges) : averages.badges;

	const pointsChart = target ? [
		{ name: t('consultantDetail.thisConsultant'), value: Number(target.total_points) },
		{ name: compareLabel, value: comparePoints },
	] : [];
	const badgesChart = target ? [
		{ name: t('consultantDetail.thisConsultant'), value: Number(target.total_badges) },
		{ name: compareLabel, value: compareBadges },
	] : [];

	const hasComparison = Boolean(target) && (chosen || peers.length > 0);
	const timelineData = timeline.map((r) => ({ ...r, label: r.month }));

	return (
		<div className={styles.page}>
			<nav className={styles.breadcrumb} aria-label="breadcrumb">
				<Link to={listPath} className={styles.breadcrumbLink}>
					{isSll ? t('consultantsList.teamTitle') : t('consultantsList.title')}
				</Link>
				<Icon name="chevron_forward" size={14} color="var(--color-outline)" />
				<span className={styles.breadcrumbActive}>{target?.full_name || '—'}</span>
			</nav>

			{loading ? (
				<Spinner />
			) : error ? (
				<div className="alert alert-danger mb-0" role="alert">{error}</div>
			) : (
				<>
					{/* Header */}
					<ContentCard className={styles.headerCard}>
						<Avatar src={target?.profile_img_url} name={target?.full_name} size={56} />
						<div className={styles.headerInfo}>
							<h1 className={styles.name}>{target?.full_name || '—'}</h1>
							<span className={styles.meta}>{target?.primary_area_name || '—'}</span>
						</div>
						<div className={styles.headerStats}>
							<div className={styles.hStat}>
								<span className={styles.hStatValue}>{Number(target?.total_points || 0).toLocaleString('pt-PT')}</span>
								<span className={styles.hStatLabel}>{t('consultantDetail.points')}</span>
							</div>
							<div className={styles.hStat}>
								<span className={styles.hStatValue}>{target?.total_badges ?? 0}</span>
								<span className={styles.hStatLabel}>{t('consultantDetail.badges')}</span>
							</div>
						</div>
						<Button as={Link} to={SHARED.USER_PROFILE_VIEW.replace(':guid', userGuid)} variant="outlined" color="primary" size="sm" className={styles.profileBtn}>
							<Icon name="user" size={16} /> {t('consultantDetail.viewPublicProfile')}
						</Button>
					</ContentCard>

					{/* Evolution timeline (TM bonus) */}
					<ContentCard className={styles.section}>
						<CardHeader icon="evolution" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('consultantDetail.timelineTitle')} />
						{timelineData.length > 0 ? (
							<LineAreaChart data={timelineData} xAxisKey="label" yAxisKey="cumulativeBadges" yAxisLabel={t('consultantDetail.timelineBadges')} />
						) : (
							<p className={styles.empty}>{t('consultantDetail.timelineEmpty')}</p>
						)}
					</ContentCard>

					{/* Peer comparison (SLL bonus) */}
					<ContentCard className={styles.section}>
						<div className={styles.compHead}>
							<CardHeader icon="ranking" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('consultantDetail.comparisonTitle')} />
							<div className={styles.compPicker}>
								<span className={styles.compPickerLabel}>{t('consultantDetail.compareWith')}</span>
								<Button variant="outlined" color="primary" size="sm" onClick={() => setShowPicker(true)} className={styles.compPickerBtn}>
									<span className={styles.compPickerValue}>{compareLabel}</span>
									<Icon name="pencil" size={14} />
								</Button>
							</div>
						</div>

						{!hasComparison ? (
							<p className={styles.empty}>{t('consultantDetail.comparisonEmpty')}</p>
						) : (
							<>
								{!chosen && (
									<p className={styles.standing}>
										{t('consultantDetail.standing', { position: standing, total: ranked.length })}
									</p>
								)}
								<div className={styles.compCharts}>
									<div className={styles.compChart}>
										<span className={styles.compChartTitle}>{t('consultantDetail.points')}</span>
										<VerticalBarChart data={pointsChart} xAxisKey="name" yAxisKey="value" valueName={t('consultantDetail.points')} />
									</div>
									<div className={styles.compChart}>
										<span className={styles.compChartTitle}>{t('consultantDetail.badges')}</span>
										<VerticalBarChart data={badgesChart} xAxisKey="name" yAxisKey="value" barColor="#39639C" valueName={t('consultantDetail.badges')} />
									</div>
								</div>

								{!chosen && peers.length > 0 && (
									<div className="table-responsive">
										<table className={`table align-middle mb-0 ${styles.table}`}>
											<thead>
												<tr>
													<th>{t('consultantDetail.colConsultant')}</th>
													<th className={styles.numCol}>{t('consultantDetail.colPoints')}</th>
													<th className={styles.numCol}>{t('consultantDetail.colBadges')}</th>
												</tr>
											</thead>
											<tbody>
												{ranked.map((r) => (
													<tr key={r.user_guid} className={r.is_target ? styles.targetRow : ''}>
														<td>
															<div className={styles.consultantCell}>
																<Avatar src={r.profile_img_url} name={r.full_name} size={26} />
																<span>{r.full_name}{r.is_target ? ` (${t('consultantDetail.thisConsultant')})` : ''}</span>
															</div>
														</td>
														<td className={styles.numCol}>{Number(r.total_points).toLocaleString('pt-PT')}</td>
														<td className={styles.numCol}>{r.total_badges}</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								)}
							</>
						)}
					</ContentCard>

					{/* Per-consultant badge history (req 5): earned vs in-process */}
					<ContentCard className={styles.section}>
						<div className={styles.compHead}>
							<CardHeader icon="badge" iconBg="var(--color-primary-container)" iconColor="var(--color-primary)" title={t('consultantDetail.historyTitle')} />
							<div className={styles.segmented} role="tablist">
								{Object.keys(HISTORY_FILTERS).map((key) => (
									<button
										key={key}
										type="button"
										role="tab"
										aria-selected={historyFilter === key}
										className={`${styles.segBtn} ${historyFilter === key ? styles.segActive : ''}`}
										onClick={() => setHistoryFilter(key)}
									>
										{t(`sllBadgeHistory.filter.${key}`)}
									</button>
								))}
							</div>
						</div>

						{historyLoading ? (
							<Spinner />
						) : history.length === 0 ? (
							<p className={styles.empty}>{t('sllBadgeHistory.empty')}</p>
						) : (
							<div className="table-responsive">
								<table className={`table align-middle mb-0 ${styles.table}`}>
									<thead>
										<tr>
											<th>{t('sllBadgeHistory.colBadge')}</th>
											<th>{t('sllBadgeHistory.colArea')}</th>
											<th>{t('sllBadgeHistory.colObtainedDate')}</th>
											<th>{t('sllBadgeHistory.colState')}</th>
										</tr>
									</thead>
									<tbody>
										{history.map((a) => {
											const date = a.validated_at || a.submitted_at || a.opened_at;
											return (
												<tr key={a.application_guid} className={styles.histRow} onClick={() => navigate(`/applications/${a.application_guid}`)}>
													<td>{a.badge?.badge_title || '—'}</td>
													<td className="text-muted">{a.badge?.area?.area_name || '—'}</td>
													<td className="text-muted">{fmtHistDate(date)}</td>
													<td>
														<span className={`${styles.histPill} ${histStatePill(a.application_state)}`}>
															{t(`applicationReview.appState.${APP_STATE_KEY[a.application_state] || 'pending'}`, { defaultValue: a.application_state })}
														</span>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						)}
					</ContentCard>
				</>
			)}

			{showPicker && (
				<PeerPickerModal
					consultants={consultants}
					excludeGuid={userGuid}
					currentGuid={compareGuid}
					onSelect={setCompareGuid}
					onClose={() => setShowPicker(false)}
				/>
			)}
		</div>
	);
}
