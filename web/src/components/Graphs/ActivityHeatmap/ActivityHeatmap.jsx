import { useTranslation } from 'react-i18next';
import styles from './ActivityHeatmap.module.css';

const INTENSITY_LEVELS = ['empty', 'low', 'medium', 'high', 'max'];

/**
 * GitHub-style activity heatmap showing daily activity intensity over time.
 * @param {Array} data - Daily activity entries: { date, count }.
 */
// Renders a weekly activity grid with intensity-based cell coloring.
export default function ActivityHeatmap({ data = [], weeks = 4, dayLabels, title }) {
	// Provides translated day and week label strings.
	const { t } = useTranslation();

	const defaultDayLabels = dayLabels || [
		t('shared.days.mon'), t('shared.days.tue'), t('shared.days.wed'),
		t('shared.days.thu'), t('shared.days.fri'), t('shared.days.sat'),
		t('shared.days.sun'),
	];

	const rows = [];
	for (let w = 0; w < weeks; w++) {
		const row = [];
		for (let d = 0; d < 7; d++) {
			const idx = w * 7 + d;
			const level = data[idx] != null
				? Math.min(data[idx], INTENSITY_LEVELS.length - 1)
				: 0;
			row.push(level);
		}
		rows.push(row);
	}

	return (
		<div className={styles.wrapper}>
			{title && <p className={styles.title}>{title}</p>}
			<div className={styles.grid}>
				<div className={styles.weekLabels}>
					{rows.map((_, i) => (
						<span key={i} className={styles.weekLabel}>
							{t('shared.weekAbbr')}{i + 1}
						</span>
					))}
				</div>
				<div className={styles.cells}>
					<div className={styles.dayLabels}>
						{defaultDayLabels.map((label, i) => (
							<span key={i} className={styles.dayLabel}>{label}</span>
						))}
					</div>
					{rows.map((row, wi) => (
						<div key={wi} className={styles.row}>
							{row.map((level, di) => (
								<div
									key={di}
									className={`${styles.cell} ${styles[INTENSITY_LEVELS[level]]}`}
								/>
							))}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
