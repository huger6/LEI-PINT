import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../CustomSelect/CustomSelect';
import Icon from '../Icons/Icons';
import styles from './DatePicker.module.css';

const DEFAULT_YEAR_START = 1900;

function toDateOnly(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseYmd(value) {
	if (!value || typeof value !== 'string') return null;
	const [y, m, d] = value.split('-').map(Number);
	if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) return null;
	const parsed = new Date(y, m - 1, d);
	if (
		parsed.getFullYear() !== y ||
		parsed.getMonth() !== m - 1 ||
		parsed.getDate() !== d
	) {
		return null;
	}
	return parsed;
}

function normalizeDate(value) {
	if (!value) return null;
	if (value instanceof Date && !Number.isNaN(value.getTime())) return toDateOnly(value);
	return parseYmd(String(value));
}

function toYmd(date) {
	const year = String(date.getFullYear());
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function formatDdMmYyyy(date) {
	const day = String(date.getDate()).padStart(2, '0');
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const year = String(date.getFullYear());
	return `${day}-${month}-${year}`;
}

function isSameDay(a, b) {
	return a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();
}

function getMonthStart(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function clampMonth(month, minMonth, maxMonth) {
	if (minMonth && month < minMonth) return minMonth;
	if (maxMonth && month > maxMonth) return maxMonth;
	return month;
}

function getCalendarCells(monthDate, minDate, maxDate, selectedDate) {
	const monthStart = getMonthStart(monthDate);
	const offsetToMonday = (monthStart.getDay() + 6) % 7;
	const gridStart = new Date(monthStart);
	gridStart.setDate(monthStart.getDate() - offsetToMonday);
	const today = new Date();

	return Array.from({ length: 42 }, (_, idx) => {
		const date = new Date(gridStart);
		date.setDate(gridStart.getDate() + idx);
		const beforeMin = minDate ? date < minDate : false;
		const afterMax = maxDate ? date > maxDate : false;
		return {
			date,
			inCurrentMonth: date.getMonth() === monthDate.getMonth(),
			isDisabled: beforeMin || afterMax,
			isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
			isToday: isSameDay(date, today),
		};
	});
}

/**
 * Custom date picker with calendar grid, month/year selects, and min/max constraints.
 * Emits dates in YYYY-MM-DD format via synthetic onChange events.
 * @param {string} value - Selected date in YYYY-MM-DD format.
 * @param {Function} onChange - Synthetic event: { target: { name, value } }.
 * @param {string} [max] - Maximum selectable date (YYYY-MM-DD).
 * @param {string} [min] - Minimum selectable date (YYYY-MM-DD).
 */
export default function DatePicker({
	id,
	name,
	value,
	onChange,
	onBlur,
	max,
	min,
	disabled = false,
	error = false,
	ariaLabel,
	placeholder = 'DD-MM-YYYY',
	locale = 'en-US',
	yearStart = DEFAULT_YEAR_START,
}) {
	const { t } = useTranslation();
	const wrapperRef = useRef(null);
	const [open, setOpen] = useState(false);
	const selectedDate = useMemo(() => normalizeDate(value), [value]);
	const minDate = useMemo(() => normalizeDate(min), [min]);
	const maxDate = useMemo(() => normalizeDate(max), [max]);

	const minMonth = useMemo(() => (minDate ? getMonthStart(minDate) : null), [minDate]);
	const maxMonth = useMemo(() => (maxDate ? getMonthStart(maxDate) : null), [maxDate]);

	const [visibleMonth, setVisibleMonth] = useState(() => {
		const focusDate = selectedDate ?? maxDate ?? new Date();
		return getMonthStart(focusDate);
	});

	const activeMonth = useMemo(
		() => clampMonth(visibleMonth, minMonth, maxMonth),
		[maxMonth, minMonth, visibleMonth]
	);

	const emitBlur = useCallback(() => {
		if (!onBlur) return;
		onBlur({ target: { name: name || id } });
	}, [id, name, onBlur]);

	const closePicker = useCallback((triggerBlur = true) => {
		setOpen(false);
		if (triggerBlur) emitBlur();
	}, [emitBlur]);

	useEffect(() => {
		if (!open) return undefined;
		const handleOutsideClick = (event) => {
			if (!wrapperRef.current?.contains(event.target)) {
				closePicker(true);
			}
		};
		document.addEventListener('mousedown', handleOutsideClick);
		return () => document.removeEventListener('mousedown', handleOutsideClick);
	}, [closePicker, open]);

	const emitChange = useCallback((nextValue) => {
		if (!onChange) return;
		onChange({
			target: {
				name: name || id,
				value: nextValue,
				type: 'text',
			},
		});
	}, [id, name, onChange]);

	const openPicker = useCallback(() => {
		if (disabled) return;
		const focusDate = selectedDate ?? maxDate ?? new Date();
		const targetMonth = clampMonth(getMonthStart(focusDate), minMonth, maxMonth);
		setVisibleMonth(targetMonth);
		setOpen(true);
	}, [disabled, maxDate, maxMonth, minMonth, selectedDate]);

	const togglePicker = () => {
		if (open) {
			closePicker(true);
			return;
		}
		openPicker();
	};

	const selectDate = useCallback((date) => {
		emitChange(toYmd(date));
		closePicker(true);
	}, [closePicker, emitChange]);

	const weekdayLabels = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
		const monday = new Date(2024, 0, 1);
		return Array.from({ length: 7 }, (_, index) => {
			const day = new Date(monday);
			day.setDate(monday.getDate() + index);
			return formatter.format(day);
		});
	}, [locale]);

	const monthOptions = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
		return Array.from({ length: 12 }, (_, index) => ({
			value: index,
			label: formatter.format(new Date(2024, index, 1)),
		}));
	}, [locale]);

	const maxYear = maxDate ? maxDate.getFullYear() : new Date().getFullYear();
	const rawMinYear = minDate ? minDate.getFullYear() : yearStart;
	const minYear = Math.min(rawMinYear, maxYear);

	const yearOptions = useMemo(
		() => Array.from({ length: maxYear - minYear + 1 }, (_, idx) => ({
			value: maxYear - idx,
			label: String(maxYear - idx),
		})),
		[maxYear, minYear]
	);

	const canGoPrev = !minMonth || activeMonth > minMonth;
	const canGoNext = !maxMonth || activeMonth < maxMonth;

	const cells = useMemo(
		() => getCalendarCells(activeMonth, minDate, maxDate, selectedDate),
		[activeMonth, maxDate, minDate, selectedDate]
	);

	const displayValue = selectedDate ? formatDdMmYyyy(selectedDate) : placeholder;

	const handleMonthChange = (e) => {
		const month = Number(e.target.value);
		const next = clampMonth(
			new Date(activeMonth.getFullYear(), month, 1),
			minMonth,
			maxMonth
		);
		setVisibleMonth(next);
	};

	const handleYearChange = (e) => {
		const year = Number(e.target.value);
		const next = clampMonth(
			new Date(year, activeMonth.getMonth(), 1),
			minMonth,
			maxMonth
		);
		setVisibleMonth(next);
	};

	const triggerClass = [
		styles.trigger,
		error && styles.triggerError,
		!selectedDate && styles.placeholder,
		disabled && styles.triggerDisabled,
		open && styles.triggerOpen,
	].filter(Boolean).join(' ');

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				type="button"
				id={id}
				className={triggerClass}
				onClick={togglePicker}
				aria-expanded={open}
				aria-haspopup="dialog"
				aria-label={ariaLabel}
				disabled={disabled}
			>
				<span className={styles.triggerText}>{displayValue}</span>
				<Icon
					name={open ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
					size={16}
					className={styles.triggerIcon}
					aria-hidden="true"
				/>
			</button>

			{open && (
				<div className={styles.panel} role="dialog" aria-label={ariaLabel}>
					<div className={styles.header}>
						<button
							type="button"
							className={styles.navButton}
							onClick={() =>
								setVisibleMonth((current) =>
									clampMonth(
										new Date(current.getFullYear(), current.getMonth() - 1, 1),
										minMonth,
										maxMonth
									)
								)
							}
							disabled={!canGoPrev}
							aria-label={t('datePicker.previousMonth')}
						>
							<Icon
								name="keyboard_arrow_down"
								size={16}
								aria-hidden="true"
								style={{ transform: 'rotate(90deg)' }}
							/>
						</button>

						<div className={styles.selectRow}>
							<CustomSelect
								id={`${id}-month`}
								value={activeMonth.getMonth()}
								onChange={handleMonthChange}
								options={monthOptions}
								ariaLabel={t('datePicker.selectMonth')}
								compact
							/>
							<CustomSelect
								id={`${id}-year`}
								value={activeMonth.getFullYear()}
								onChange={handleYearChange}
								options={yearOptions}
								ariaLabel={t('datePicker.selectYear')}
								compact
							/>
						</div>

						<button
							type="button"
							className={styles.navButton}
							onClick={() =>
								setVisibleMonth((current) =>
									clampMonth(
										new Date(current.getFullYear(), current.getMonth() + 1, 1),
										minMonth,
										maxMonth
									)
								)
							}
							disabled={!canGoNext}
							aria-label={t('datePicker.nextMonth')}
						>
							<Icon
								name="keyboard_arrow_down"
								size={16}
								aria-hidden="true"
								style={{ transform: 'rotate(-90deg)' }}
							/>
						</button>
					</div>

					<div className={styles.weekdays}>
						{weekdayLabels.map((label) => (
							<span key={label} className={styles.weekday}>{label}</span>
						))}
					</div>

					<div className={styles.grid}>
						{cells.map(({ date, inCurrentMonth, isDisabled, isSelected, isToday }) => (
							<button
								key={toYmd(date)}
								type="button"
								className={[
									styles.day,
									!inCurrentMonth && styles.dayOutside,
									isSelected && styles.daySelected,
									isToday && styles.dayToday,
								].filter(Boolean).join(' ')}
								disabled={isDisabled}
								onClick={() => selectDate(date)}
							>
								{date.getDate()}
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
