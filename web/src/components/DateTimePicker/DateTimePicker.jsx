import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CustomSelect from '../CustomSelect/CustomSelect';
import Icon from '../Icons/Icons';
import styles from './DateTimePicker.module.css';

function toDateOnly(date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseIso(value) {
	if (!value) return null;
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
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

function pad(n) {
	return String(n).padStart(2, '0');
}

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
	const { t } = useTranslation();
	const wrapperRef = useRef(null);
	const [open, setOpen] = useState(false);

	const selectedDate = useMemo(() => parseIso(value), [value]);

	const [hours, setHours] = useState(() => selectedDate ? selectedDate.getHours() : 0);
	const [minutes, setMinutes] = useState(() => selectedDate ? selectedDate.getMinutes() : 0);

	const [visibleMonth, setVisibleMonth] = useState(() => {
		const focusDate = selectedDate ?? new Date();
		return getMonthStart(focusDate);
	});

	useEffect(() => {
		if (selectedDate) {
			setHours(selectedDate.getHours());
			setMinutes(selectedDate.getMinutes());
		}
	}, [selectedDate]);

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

	const openPicker = useCallback(() => {
		if (disabled) return;
		const focusDate = selectedDate ?? new Date();
		setVisibleMonth(getMonthStart(focusDate));
		setOpen(true);
	}, [disabled, selectedDate]);

	const togglePicker = () => {
		if (open) { closePicker(true); return; }
		openPicker();
	};

	const selectDate = useCallback((date) => {
		const h = selectedDate ? selectedDate.getHours() : hours;
		const m = selectedDate ? selectedDate.getMinutes() : minutes;
		const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m);
		emitChange(combined.toISOString());
	}, [emitChange, hours, minutes, selectedDate]);

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

	const handleHoursBlur = () => {
		if (hours === '' || hours === undefined) setHours(0);
	};

	const handleMinutesBlur = () => {
		if (minutes === '' || minutes === undefined) setMinutes(0);
	};

	const handleClear = () => {
		emitChange('');
		setHours(0);
		setMinutes(0);
		closePicker(true);
	};

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

	const currentYear = new Date().getFullYear();
	const yearOptions = useMemo(
		() => Array.from({ length: 11 }, (_, idx) => ({
			value: currentYear - 1 + idx,
			label: String(currentYear - 1 + idx),
		})),
		[currentYear]
	);

	const cells = useMemo(
		() => getCalendarCells(visibleMonth, selectedDate),
		[visibleMonth, selectedDate]
	);

	const displayValue = selectedDate ? formatDisplay(selectedDate) : placeholder;

	const handleMonthChange = (e) => {
		const month = Number(e.target.value);
		setVisibleMonth(new Date(visibleMonth.getFullYear(), month, 1));
	};

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
