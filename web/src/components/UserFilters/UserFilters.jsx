import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../CustomSelect/CustomSelect';
import DatePicker from '../DatePicker/DatePicker';
import Button from '../Button/Button';
import Icon from '../Icons/Icons';
import styles from './UserFilters.module.css';

// Role values must match the strings stored in the database / returned by the API.
const ROLE_VALUES = ['Administrator', 'Consultant', 'Talent Manager', 'Service Line Leader'];

// Keys that live in the collapsible "advanced" section — used to count the badge.
const ADVANCED_KEYS = [
	'emailConfirmed',
	'gdprAccepted',
	'serviceLine',
	'area',
	'dateFrom',
	'dateTo',
	'pointsMin',
	'pointsMax',
];

// ── Default / empty filter state (exported so callers can reset to it) ───────

export const EMPTY_FILTERS = {
	search: '',
	role: '',
	isActive: '',
	emailConfirmed: '',
	gdprAccepted: '',
	serviceLine: '',
	area: '',
	dateFrom: '',
	dateTo: '',
	pointsMin: '',
	pointsMax: '',
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * UserFilters — reusable filter bar for the User Management page.
 *
 * Props:
 *   filters        {Object}   Current filter state (shape: EMPTY_FILTERS).
 *   onChange       {Function} Called with the full updated filters object.
 *   onClear        {Function} Resets all filters (caller sets state to EMPTY_FILTERS).
 *   serviceLines   {Array}    Service line list fetched from the API.
 *   areas          {Array}    Full area list; narrowed by selected service line.
 */
export default function UserFilters({
	filters,
	onChange,
	onClear,
	serviceLines = [],
	areas = [],
}) {
	const { t } = useTranslation();
	const [expanded, setExpanded] = useState(false);

	// Count how many advanced filters are active to render on the toggle badge.
	const activeAdvancedCount = useMemo(
		() => ADVANCED_KEYS.reduce((n, k) => n + (filters[k] !== '' ? 1 : 0), 0),
		[filters],
	);

	const hasAnyFilter = useMemo(
		() => Object.values(filters).some((v) => v !== ''),
		[filters],
	);

	// Option lists use t() so labels render in the active locale.
	const roleOptions = useMemo(() => [
		{ value: '', label: t('shared.allRoles') },
		...ROLE_VALUES.map((r) => ({ value: r, label: t(`roles.${r}`, r) })),
	], [t]);

	const statusOptions = useMemo(() => [
		{ value: '', label: t('shared.allStatuses') },
		{ value: 'true', label: t('shared.active') },
		{ value: 'false', label: t('shared.inactive') },
	], [t]);

	const boolOptions = useMemo(() => [
		{ value: '', label: t('shared.all') },
		{ value: 'true', label: t('shared.yes') },
		{ value: 'false', label: t('shared.no') },
	], [t]);

	// Build service line options from API data.
	const serviceLineOptions = useMemo(() => [
		{ value: '', label: t('shared.all') },
		...serviceLines.map((sl) => ({
			value: String(sl.service_line_id || sl.id || ''),
			label: sl.name,
		})),
	], [serviceLines, t]);

	// When a service line is selected, narrow the available areas for that line.
	const areaOptions = useMemo(() => {
		const pool = filters.serviceLine
			? areas.filter(
				(a) =>
					String(a.service_line_id || a.serviceLineId || '') ===
					String(filters.serviceLine),
			)
			: areas;
		return [
			{ value: '', label: t('shared.all') },
			...pool.map((a) => ({
				value: String(a.area_id || a.id || ''),
				label: a.name,
			})),
		];
	}, [areas, filters.serviceLine, t]);

	// Centralised change handler — also resets area when service line changes
	// to prevent orphan selections (e.g. an area that doesn't belong to the new line).
	function handleChange(e) {
		const { name, value } = e.target;
		if (name === 'serviceLine') {
			onChange({ ...filters, serviceLine: value, area: '' });
		} else {
			onChange({ ...filters, [name]: value });
		}
	}

	return (
		<div className="card border-0 shadow-sm mb-3">
			<div className="card-body">

				{/* ── Primary filter row ─────────────────────────────────────────── */}
				<div className={styles.primaryRow}>

					{/* Global text search (full_name or email_address) */}
					<div className={styles.searchWrapper}>
						<Icon
							name="search"
							size={16}
							className={styles.searchIcon}
							aria-hidden="true"
						/>
						<input
							type="text"
							className={`form-control ${styles.searchInput}`}
							name="search"
							value={filters.search}
							onChange={handleChange}
							placeholder={t('adminUsers.searchPlaceholder')}
							aria-label={t('adminUsers.searchPlaceholder')}
						/>
					</div>

					{/* Role quick-filter */}
					<div className={styles.selectWrapper}>
						<CustomSelect
							id="filter_role"
							name="role"
							value={filters.role}
							onChange={handleChange}
							options={roleOptions}
							placeholder={t('shared.allRoles')}
							ariaLabel={t('adminUsers.filterByRole')}
						/>
					</div>

					{/* Active / Inactive status quick-filter */}
					<div className={styles.selectWrapper}>
						<CustomSelect
							id="filter_status"
							name="isActive"
							value={filters.isActive}
							onChange={handleChange}
							options={statusOptions}
							placeholder={t('shared.allStatuses')}
							ariaLabel={t('adminUsers.filterByStatus')}
						/>
					</div>

					{/* Toggle for the collapsible advanced filter section */}
					<button
						type="button"
						className={[
							styles.advancedToggle,
							expanded && styles.advancedToggleActive,
						]
							.filter(Boolean)
							.join(' ')}
						onClick={() => setExpanded((v) => !v)}
						aria-expanded={expanded}
						aria-controls="user-advanced-filters"
					>
						<span>{t('shared.moreFilters')}</span>
						{activeAdvancedCount > 0 && (
							<span
								className={styles.activeBadge}
								aria-label={`${activeAdvancedCount} active advanced filters`}
							>
								{activeAdvancedCount}
							</span>
						)}
						<Icon
							name={expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
							size={14}
							aria-hidden="true"
						/>
					</button>

					{/* Reset all active filters */}
					<Button
						variant="outlined"
						size="sm"
						onClick={onClear}
						disabled={!hasAnyFilter}
						aria-label={t('shared.clearAll')}
					>
						{t('shared.clearAll')}
					</Button>
				</div>

				{/* ── Advanced filters (collapsible) ────────────────────────────── */}
				{expanded && (
					<div id="user-advanced-filters" className={styles.advancedRow}>

						{/* Service Line — selecting this cascades into Area */}
						<div className={styles.selectWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.serviceLine')}
							</label>
							<CustomSelect
								id="filter_service_line"
								name="serviceLine"
								value={filters.serviceLine}
								onChange={handleChange}
								options={serviceLineOptions}
								placeholder={t('shared.all')}
								ariaLabel={t('shared.serviceLine')}
							/>
						</div>

						{/* Area — list narrows based on the selected service line */}
						<div className={styles.selectWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.area')}
							</label>
							<CustomSelect
								id="filter_area"
								name="area"
								value={filters.area}
								onChange={handleChange}
								options={areaOptions}
								placeholder={t('shared.all')}
								ariaLabel={t('shared.area')}
							/>
						</div>

						{/* Email confirmation status */}
						<div className={styles.selectWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.emailConfirmed')}
							</label>
							<CustomSelect
								id="filter_email_confirmed"
								name="emailConfirmed"
								value={filters.emailConfirmed}
								onChange={handleChange}
								options={boolOptions}
								placeholder={t('shared.all')}
								ariaLabel={t('shared.emailConfirmed')}
							/>
						</div>

						{/* GDPR accepted (public-profile sharing consent) */}
						<div className={styles.selectWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.gdpr')}
							</label>
							<CustomSelect
								id="filter_gdpr"
								name="gdprAccepted"
								value={filters.gdprAccepted}
								onChange={handleChange}
								options={boolOptions}
								placeholder={t('shared.all')}
								ariaLabel={t('shared.gdpr')}
							/>
						</div>

						{/* Registration date range — From */}
						<div className={styles.dateWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.registeredFrom')}
							</label>
							{/* Cap the "from" picker at the current "to" value so the range stays valid */}
							<DatePicker
								id="filter_date_from"
								name="dateFrom"
								value={filters.dateFrom}
								onChange={handleChange}
								max={filters.dateTo || undefined}
								ariaLabel={t('shared.registeredFrom')}
								placeholder="DD-MM-YYYY"
							/>
						</div>

						{/* Registration date range — To */}
						<div className={styles.dateWrapper}>
							<label className={styles.filterLabel}>
								{t('shared.registeredTo')}
							</label>
							{/* The "to" picker cannot go before the "from" value */}
							<DatePicker
								id="filter_date_to"
								name="dateTo"
								value={filters.dateTo}
								onChange={handleChange}
								min={filters.dateFrom || undefined}
								ariaLabel={t('shared.registeredTo')}
								placeholder="DD-MM-YYYY"
							/>
						</div>

						{/* Gamification points — minimum */}
						<div className={styles.numberWrapper}>
							<label htmlFor="filter_points_min" className={styles.filterLabel}>
								{t('shared.pointsMin')}
							</label>
							<input
								id="filter_points_min"
								type="number"
								className={`form-control form-control-sm ${styles.numberInput}`}
								name="pointsMin"
								value={filters.pointsMin}
								onChange={handleChange}
								min={0}
								placeholder="0"
								aria-label={t('shared.pointsMin')}
							/>
						</div>

						{/* Gamification points — maximum */}
						<div className={styles.numberWrapper}>
							<label htmlFor="filter_points_max" className={styles.filterLabel}>
								{t('shared.pointsMax')}
							</label>
							<input
								id="filter_points_max"
								type="number"
								className={`form-control form-control-sm ${styles.numberInput}`}
								name="pointsMax"
								value={filters.pointsMax}
								onChange={handleChange}
								min={0}
								placeholder="∞"
								aria-label={t('shared.pointsMax')}
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
