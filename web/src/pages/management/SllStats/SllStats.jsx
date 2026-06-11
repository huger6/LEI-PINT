import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getApplicationsPaged } from '../../../features/applications/api/applicationsApi';
import BadgeOverview from '../../../components/BadgeOverview/BadgeOverview';
import ExportsPanel from '../../../components/ExportsPanel/ExportsPanel';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import VerticalBarChart from '../../../components/Graphs/VerticalBar/VerticalBarChart';
import CardGridSkeleton from '../../../components/Skeleton/CardGridSkeleton';
import styles from './SllStats.module.css';

// Awarded badges (Accepted applications) grouped by month. getApplications is
// scoped server-side to the Service Line Leader's Service Line, so this report
// is inherently limited to "a sua área" without any extra client-side filtering.
function buildMonthlyReport(apps) {
	const buckets = new Map();
	for (const app of apps) {
		if ((app.application_state || app.state) !== 'Accepted') continue;
		const dateStr = app.closed_at || app.submitted_at || app.opened_at;
		if (!dateStr) continue;
		const d = new Date(dateStr);
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		const label = d.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' });
		const entry = buckets.get(key) || { key, label, count: 0 };
		entry.count += 1;
		buckets.set(key, entry);
	}
	return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

export default function SllStats() {
	const { t } = useTranslation();
	const [report, setReport] = useState([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		let active = true;
		(async () => {
			setLoading(true);
			try {
				const { data } = await getApplicationsPaged({ state: 'Accepted', page: 1, limit: 200 });
				if (!active) return;
				setReport(buildMonthlyReport(data));
				setTotal(data.length);
			} catch {
				if (active) { setReport([]); setTotal(0); }
			} finally {
				if (active) setLoading(false);
			}
		})();
		return () => { active = false; };
	}, []);

	return (
		<div className={styles.page}>
			<h1 className={styles.pageTitle}>{t('sidebar.sll.stats')}</h1>

			{/* Report: awarded badges per month (Service Line scoped) */}
			<ContentCard className={styles.reportCard}>
				<div className={styles.reportHeader}>
					<CardHeader icon="progress" iconBg="var(--color-green-soft)" iconColor="var(--color-green-on-soft)" title={t('sllStats.reportsTitle')} />
					{!loading && <span className={styles.total}>{t('sllStats.total', { count: total })}</span>}
				</div>
				{loading ? (
					<CardGridSkeleton count={1} columns={2} />
				) : report.length === 0 ? (
					<p className={styles.empty}>{t('sllStats.noData')}</p>
				) : (
					<VerticalBarChart data={report} xAxisKey="label" yAxisKey="count" barColor="#04CE00" />
				)}
			</ContentCard>

			<ExportsPanel />
			<BadgeOverview />
		</div>
	);
}
