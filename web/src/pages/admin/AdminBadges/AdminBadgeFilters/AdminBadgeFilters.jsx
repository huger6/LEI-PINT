import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../../../../components/CustomSelect/CustomSelect';
import styles from './AdminBadgeFilters.module.css';

export const MAX_POINTS = 5000;

export const PROGRESSION_TIERS = [
	{ code: 'A', labelKey: 'badgeCatalog.filters.tiers.A' },
	{ code: 'B', labelKey: 'badgeCatalog.filters.tiers.B' },
	{ code: 'C', labelKey: 'badgeCatalog.filters.tiers.C' },
	{ code: 'D', labelKey: 'badgeCatalog.filters.tiers.D' },
	{ code: 'E', labelKey: 'badgeCatalog.filters.tiers.E' },
];

export const EMPTY_FILTERS = {
	search: '',
	learningPathId: '',
	serviceLineId: '',
	areaId: '',
	stageCodes: [],
	badgeClass: 'all',
	minPoints: 0,
	maxPoints: MAX_POINTS,
	expiringOnly: false,
};

const idOf = (x, ...keys) => {
	for (const k of keys) if (x[k] != null) return String(x[k]);
	return '';
};

/**
 * Server-side filter sidebar for the admin badge catalog. Mirrors the consultant
 * catalog filters (structure cascade, progression tier, class, points, expiring)
 * and emits a partial-filter patch via onChange. The cascade resets downstream
 * selections when a parent changes.
 */
export default function AdminBadgeFilters({ filters, onChange, learningPaths, serviceLines, areas }) {
	const { t } = useTranslation();

	const scopedServiceLines = filters.learningPathId
		? serviceLines.filter((sl) => idOf(sl, 'learning_path_id', 'learningPathId') === String(filters.learningPathId))
		: [];
	const scopedAreas = filters.serviceLineId
		? areas.filter((a) => idOf(a, 'service_line_id', 'serviceLineId') === String(filters.serviceLineId))
		: [];

	const learningPathOptions = [
		{ value: '', label: t('badgeCatalog.filters.allLearningPaths') },
		...learningPaths.map((lp) => ({ value: idOf(lp, 'learning_path_id', 'learningPathId'), label: lp.path_title || lp.pathTitle })),
	];
	const serviceLineOptions = [
		{ value: '', label: t('badgeCatalog.filters.allServiceLines') },
		...scopedServiceLines.map((sl) => ({ value: idOf(sl, 'service_line_id', 'serviceLineId'), label: sl.service_line_name || sl.serviceLineName })),
	];

	return (
		<div className={`d-flex flex-column gap-4 ${styles.panel}`}>
			<section>
				<h3 className={styles.heading}>{t('badgeCatalog.filters.structure')}</h3>
				<div className="d-flex flex-column gap-2">
					<label className={styles.label} htmlFor="admin-bf-lp">{t('badgeCatalog.filters.learningPath')}</label>
					<CustomSelect
						id="admin-bf-lp"
						name="learningPathId"
						value={String(filters.learningPathId)}
						onChange={(e) => onChange({ learningPathId: e.target.value, serviceLineId: '', areaId: '' })}
						options={learningPathOptions}
						ariaLabel={t('badgeCatalog.filters.learningPath')}
					/>

					<label className={styles.label} htmlFor="admin-bf-sl">{t('badgeCatalog.filters.serviceLine')}</label>
					<CustomSelect
						id="admin-bf-sl"
						name="serviceLineId"
						value={String(filters.serviceLineId)}
						onChange={(e) => onChange({ serviceLineId: e.target.value, areaId: '' })}
						options={serviceLineOptions}
						ariaLabel={t('badgeCatalog.filters.serviceLine')}
						disabled={!filters.learningPathId}
					/>

					<div className={styles.areaWrap}>
						<div className={styles.label}>{t('badgeCatalog.filters.area')}</div>
						<div className={styles.areaGroup}>
							{scopedAreas.length === 0 && (
								<span className={styles.areaEmpty}>{t('badgeCatalog.filters.selectServiceLineFirst')}</span>
							)}
							{scopedAreas.map((area) => {
								const areaId = idOf(area, 'area_id', 'areaId');
								const isActive = String(filters.areaId) === areaId;
								return (
									<button
										key={areaId}
										type="button"
										className={`${styles.areaTag} ${isActive ? styles.areaTagActive : ''}`}
										onClick={() => onChange({ areaId: isActive ? '' : areaId })}
									>
										{area.area_name || area.areaName}
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</section>

			<section>
				<h3 className={styles.heading}>{t('badgeCatalog.filters.progression')}</h3>
				<div className="d-flex flex-column gap-2">
					{PROGRESSION_TIERS.map((tier) => (
						<label className={`form-check ${styles.checkRow}`} key={tier.code}>
							<input
								className="form-check-input"
								type="checkbox"
								checked={filters.stageCodes.includes(tier.code)}
								onChange={() => onChange({
									stageCodes: filters.stageCodes.includes(tier.code)
										? filters.stageCodes.filter((c) => c !== tier.code)
										: [...filters.stageCodes, tier.code],
								})}
							/>
							<span className="form-check-label">{t(tier.labelKey)}</span>
						</label>
					))}
				</div>
			</section>

			<section>
				<h3 className={styles.heading}>{t('badgeCatalog.filters.classification')}</h3>
				<div className={styles.segmented}>
					{['all', 'standard', 'special'].map((value) => (
						<button
							type="button"
							key={value}
							className={`${styles.segmentedBtn} ${filters.badgeClass === value ? styles.segmentedBtnActive : ''}`}
							onClick={() => onChange({ badgeClass: value })}
						>
							{t(`badgeCatalog.filters.class.${value}`)}
						</button>
					))}
				</div>
			</section>

			<section>
				<h3 className={styles.heading}>{t('badgeCatalog.filters.points')}</h3>
				<div className="d-flex flex-column gap-3">
					<div>
						<label className={styles.label} htmlFor="admin-bf-min">{t('badgeCatalog.filters.minPoints')}</label>
						<input
							id="admin-bf-min"
							type="range"
							min={0}
							max={MAX_POINTS}
							step={50}
							className="form-range"
							value={filters.minPoints}
							onChange={(e) => {
								const v = Math.min(Number(e.target.value), Number(filters.maxPoints));
								onChange({ minPoints: v, maxPoints: Math.max(v, Number(filters.maxPoints)) });
							}}
						/>
						<div className={styles.rangeValue}>{filters.minPoints}</div>
					</div>
					<div>
						<label className={styles.label} htmlFor="admin-bf-max">{t('badgeCatalog.filters.maxPoints')}</label>
						<input
							id="admin-bf-max"
							type="range"
							min={0}
							max={MAX_POINTS}
							step={50}
							className="form-range"
							value={filters.maxPoints}
							onChange={(e) => {
								const v = Math.max(Number(e.target.value), Number(filters.minPoints));
								onChange({ maxPoints: v, minPoints: Math.min(v, Number(filters.minPoints)) });
							}}
						/>
						<div className={styles.rangeValue}>{filters.maxPoints}</div>
					</div>
				</div>
			</section>

			<section>
				<label className={`form-check ${styles.checkRow}`}>
					<input
						className="form-check-input"
						type="checkbox"
						checked={filters.expiringOnly}
						onChange={(e) => onChange({ expiringOnly: e.target.checked })}
					/>
					<span className="form-check-label">{t('badgeCatalog.filters.expiringOnly')}</span>
				</label>
			</section>
		</div>
	);
}

AdminBadgeFilters.propTypes = {
	filters: PropTypes.object.isRequired,
	onChange: PropTypes.func.isRequired,
	learningPaths: PropTypes.array.isRequired,
	serviceLines: PropTypes.array.isRequired,
	areas: PropTypes.array.isRequired,
};
