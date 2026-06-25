import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../CustomSelect/CustomSelect';
import Icon from '../Icons/Icons';
import styles from './DateTimePicker.module.css';

// Strips the time portion, returning a date at midnight local time.
function toDateOnly(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Parses an ISO string into a Date, or null if invalid.
function parseIso(value) {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}

// Returns true if two dates fall on the same calendar day.
function isSameDay(a, b) {
	return a.getFullYear() === b.getFullYear() &&
		a.getMonth() === b.getMonth() &&
		a.getDate() === b.getDate();
}

// Returns the first day of the month for the given date.
function getMonthStart(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

// Clamps a month within the allowed min/max month bounds.
function clampMonth(month, minMonth, maxMonth) {
	if (minMonth && month < minMonth) return minMonth;
	if (maxMonth && month > maxMonth) return maxMonth;
	return month;
}

// Builds the 42-cell calendar grid with selected/today flags.
function getCalendarCells(monthDate, selectedDate) {
	const monthStart = getMonthStart(monthDate);
	const offsetToMonday = (monthStart.getDay() + 6) % 7;
	const gridStart = new Date(monthStart);
	gridStart.setDate(monthStart.getDate() - offsetToMonday);
	const today = new Date();

	return Array.from({ length: 42 }, (_, idx) => {
		const date = new Date(gridStart);
		date.setDate(gridStart.getDate() + idx);
		return {
			date,
			inCurrentMonth: date.getMonth() === monthDate.getMonth(),
			isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
			isToday: isSameDay(date, today),
		};
	});
}

// Left-pads a number to two digits.
function pad(n) {
	return String(n).padStart(2, '0');
}

// Formats a Date as a DD-MM-YYYY HH:mm display string.
function formatDisplay(date) {
	if (!date) return null;
	return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Date and time picker combining a calendar grid with hour/minute inputs.
 * Emits ISO 8601 strings via synthetic onChange events.
 * @param {string} value - Selected datetime as ISO string.
 * @param {Function} onChange - Synthetic event: { target: { name, value } }.
 */
export default function DateTimePicker({
	id,
	name,
	value,
	onChange,
	onBlur,
	disabled = false,
	error = false,
	ariaLabel,
	placeholder = 'DD-MM-YYYY HH:mm',
	locale = 'en-US',
}) {
	// Translation function for localized labels.
	const { t } = useTranslation();
	// Ref to the wrapper element for outside-click detection.
	const wrapperRef = useRef(null);
	// Tracks whether the calendar panel is open.
	const [open, setOpen] = useState(false);

	// Selected datetime parsed from the value prop.
	const selectedDate = useMemo(() => parseIso(value), [value]);

	// Hour input state.
	const [hours, setHours] = useState(() => selectedDate ? selectedDate.getHours() : 0);
	// Minute input state.
	const [minutes, setMinutes] = useState(() => selectedDate ? selectedDate.getMinutes() : 0);

	// Currently displayed month, initialized to the selected/current month.
	const [visibleMonth, setVisibleMonth] = useState(() => {
		const focusDate = selectedDate ?? new Date();
		return getMonthStart(focusDate);
	});

	// Syncs hour/minute inputs when the selected date changes externally.
	useEffect(() => {
		if (selectedDate) {
			setHours(selectedDate.getHours());
			setMinutes(selectedDate.getMinutes());
		}
	}, [selectedDate]);

	// Fires the onBlur callback with a synthetic event.
	const emitBlur = useCallback(() => {
		if (!onBlur) return;
		onBlur({ target: { name: name || id } });
	}, [id, name, onBlur]);

	// Closes the panel and optionally emits a blur event.
	const closePicker = useCallback((triggerBlur = true) => {
		setOpen(false);
		if (triggerBlur) emitBlur();
	}, [emitBlur]);

	// Closes the panel when clicking outside while it is open.
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

	// Fires the onChange callback with a synthetic event carrying the ISO value.
	const emitChange = useCallback((isoValue) => {
		if (!onChange) return;
		onChange({
			target: {
				name: name || id,
				value: isoValue,
				type: 'text',
			},
		});
	}, [id, name, onChange]);

	// Opens the panel and focuses the relevant month.
	const openPicker = useCallback(() => {
		if (disabled) return;
		const focusDate = selectedDate ?? new Date();
		setVisibleMonth(getMonthStart(focusDate));
		setOpen(true);
	}, [disabled, selectedDate]);

	// Toggles the panel open/closed.
	const togglePicker = () => {
		if (open) { closePicker(true); return; }
		openPicker();
	};

	// Combines the chosen day with the current time and emits the ISO value.
	const selectDate = useCallback((date) => {
		const h = selectedDate ? selectedDate.getHours() : hours;
		const m = selectedDate ? selectedDate.getMinutes() : minutes;
		const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
		emitChange(combined.toISOString());
	}, [emitChange, hours, minutes, selectedDate]);

	// Sanitizes and clamps the hour input, emitting the updated datetime.
	const handleHoursChange = (e) => {
		let val = e.target.value.replace(/\D/g, '');
		if (val === '') { setHours(''); return; }
		let num = Math.min(Math.max(parseInt(val, 10), 0), 23);
		setHours(num);
		if (selectedDate) {
			const combined = new Date(selectedDate);
			combined.setHours(num);
			emitChange(combined.toISOString());
		}
	};

	// Sanitizes and clamps the minute input, emitting the updated datetime.
	const handleMinutesChange = (e) => {
		let val = e.target.value.replace(/\D/g, '');
		if (val === '') { setMinutes(''); return; }
		let num = Math.min(Math.max(parseInt(val, 10), 0), 59);
		setMinutes(num);
		if (selectedDate) {
			const combined = new Date(selectedDate);
			combined.setMinutes(num);
			emitChange(combined.toISOString());
		}
	};

	// Defaults the hour input to 0 when left empty.
	const handleHoursBlur = () => {
		if (hours === '' || hours === undefined) setHours(0);
	};

	// Defaults the minute input to 0 when left empty.
	const handleMinutesBlur = () => {
		if (minutes === '' || minutes === undefined) setMinutes(0);
	};

	// Clears the selected datetime and closes the panel.
	const handleClear = () => {
		emitChange('');
		setHours(0);
		setMinutes(0);
		closePicker(true);
	};

	// Localized short weekday labels starting on Monday.
	const weekdayLabels = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
		const monday = new Date(2024, 0, 1);
		return Array.from({ length: 7 }, (_, index) => {
			const day = new Date(monday);
			day.setDate(monday.getDate() + index);
			return formatter.format(day);
		});
	}, [locale]);

	// Localized month name options for the month select.
	const monthOptions = useMemo(() => {
		const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
		return Array.from({ length: 12 }, (_, index) => ({
			value: index,
			label: formatter.format(new Date(2024, index, 1)),
		}));
	}, [locale]);

	const currentYear = new Date().getFullYear();
	// Year options spanning a range around the current year.
	const yearOptions = useMemo(
		() => Array.from({ length: 11 }, (_, idx) => ({
			value: currentYear - 1 + idx,
			label: String(currentYear - 1 + idx),
		})),
		[currentYear]
	);

	// Calendar cells for the visible month.
	const cells = useMemo(
		() => getCalendarCells(visibleMonth, selectedDate),
		[visibleMonth, selectedDate]
	);

	const displayValue = selectedDate ? formatDisplay(selectedDate) : placeholder;

	// Updates the visible month when the month select changes.
	const handleMonthChange = (e) => {
		const month = Number(e.target.value);
		setVisibleMonth(new Date(visibleMonth.getFullYear(), month, 1));
	};

	// Updates the visible month when the year select changes.
	const handleYearChange = (e) => {
		const year = Number(e.target.value);
		setVisibleMonth(new Date(year, visibleMonth.getMonth(), 1));
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
									new Date(current.getFullYear(), current.getMonth() - 1, 1)
								)
							}
							aria-label={t('datePicker.previousMonth')}
						>
							<Icon name="keyboard_arrow_down" size={16} aria-hidden="true" style={{ transform: 'rotate(90deg)' }} />
						</button>

						<div className={styles.selectRow}>
							<CustomSelect
								id={`${id}-month`}
								value={visibleMonth.getMonth()}
								onChange={handleMonthChange}
								options={monthOptions}
								ariaLabel={t('datePicker.selectMonth')}
								compact
							/>
							<CustomSelect
								id={`${id}-year`}
								value={visibleMonth.getFullYear()}
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
									new Date(current.getFullYear(), current.getMonth() + 1, 1)
								)
							}
							aria-label={t('datePicker.nextMonth')}
						>
							<Icon name="keyboard_arrow_down" size={16} aria-hidden="true" style={{ transform: 'rotate(-90deg)' }} />
						</button>
					</div>

					<div className={styles.weekdays}>
						{weekdayLabels.map((label) => (
							<span key={label} className={styles.weekday}>{label}</span>
						))}
					</div>

					<div className={styles.grid}>
						{cells.map(({ date, inCurrentMonth, isSelected, isToday }) => {
							const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
							return (
								<button
									key={key}
									type="button"
									className={[
										styles.day,
										!inCurrentMonth && styles.dayOutside,
										isSelected && styles.daySelected,
										isToday && styles.dayToday,
									].filter(Boolean).join(' ')}
									onClick={() => selectDate(date)}
								>
									{date.getDate()}
								</button>
							);
						})}
					</div>

					<div className={styles.timeDivider} />

					<div className={styles.timeRow}>
						<span className={styles.timeLabel}>
							<Icon name="time" size={15} />
						</span>
						<input
							type="text"
							inputMode="numeric"
							className={styles.timeInput}
							value={hours === '' ? '' : pad(Number(hours))}
							onChange={handleHoursChange}
							onBlur={handleHoursBlur}
							maxLength={2}
							aria-label={t('dateTimePicker.hours')}
						/>
						<span className={styles.timeSeparator}>:</span>
						<input
							type="text"
							inputMode="numeric"
							className={styles.timeInput}
							value={minutes === '' ? '' : pad(Number(minutes))}
							onChange={handleMinutesChange}
							onBlur={handleMinutesBlur}
							maxLength={2}
							aria-label={t('dateTimePicker.minutes')}
						/>
					</div>

					<div className={styles.clearRow}>
						<button type="button" className={styles.clearBtn} onClick={handleClear}>
							{t('dateTimePicker.clear')}
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
