import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAcquisitionTimeline, getPeerComparison, getConsultantsOverview } from '../../../features/statistics/api/statisticsApi';
import { useUser } from '../../../hooks/userContext';
import { TM, SLL } from '../../../routes/paths';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import LineAreaChart from '../../../components/Graphs/LineArea/LineAreaChart';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import CustomSelect from '../../../components/CustomSelect/CustomSelect';
import Button from '../../../components/Button/Button';
import Avatar from '../../../components/Avatar/Avatar';
import Icon from '../../../components/Icons/Icons';
import Spinner from '../../../components/Spinner/Spinner';
import styles from './ConsultantDetail.module.css';

/**
 * Per-consultant detail for leadership: professional evolution timeline (TM
 * bonus) and peer comparison (SLL bonus). Opened from the consultants/team list.
 */
export default function ConsultantDetail() {
	const { t } = useTranslation();
	const { userGuid } = useParams();
	const navigate = useNavigate();
	const { user } = useUser();
	const isSll = user?.role === 'Service Line Leader';
	const listPath = isSll ? SLL.TEAM : TM.CONSULTANTS;

	const [timeline, setTimeline] = useState([]);
	const [comparison, setComparison] = useState(null);
	const [consultants, setConsultants] = useState([]);
	const [compareGuid, setCompareGuid] = useState('');
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

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

	useEffect(() => { load(); }, [load]);

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

	const compareOptions = [
		{ value: '', label: t('consultantDetail.peerAverage') },
		...consultants
			.filter((c) => c.user_guid !== userGuid)
			.map((c) => ({ value: c.user_guid, label: c.full_name })),
	];

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
						<Button as={Link} to={`/u/${userGuid}`} variant="outlined" color="primary" size="sm" className={styles.profileBtn}>
							<Icon name="user" size={16} /> {t('consultantDetail.viewPublicProfile')}
						</Button>
					</ContentCard>

					{/* Evolution timeline (TM bonus) */}
					<ContentCard className={styles.section}>
						<CardHeader icon="evolution" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('consultantDetail.timelineTitle')} />
						{timelineData.length > 0 ? (
							<LineAreaChart data={timelineData} xAxisKey="label" yAxisKey="cumulativeBadges" />
						) : (
							<p className={styles.empty}>{t('consultantDetail.timelineEmpty')}</p>
						)}
					</ContentCard>

					{/* Peer comparison (SLL bonus) */}
					<ContentCard className={styles.section}>
						<div className={styles.compHead}>
							<CardHeader icon="ranking" iconBg="var(--color-purple-soft)" iconColor="var(--color-purple-on-soft)" title={t('consultantDetail.comparisonTitle')} />
							<label className={styles.compPicker}>
								<span>{t('consultantDetail.compareWith')}</span>
								<CustomSelect name="compareGuid" value={compareGuid} onChange={(e) => setCompareGuid(e.target.value)}
									options={compareOptions} ariaLabel={t('consultantDetail.compareWith')} compact />
							</label>
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
				</>
			)}
		</div>
	);
}
