import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Icon from '../Icons/Icons';
import styles from './CustomSelect.module.css';

/**
 * Accessible custom dropdown select with keyboard navigation and type-ahead search.
 * Emits synthetic onChange events compatible with standard form handlers.
 * @param {string} id - Element id for accessibility linkage.
 * @param {string} name - Field name emitted in onChange events.
 * @param {string} value - Currently selected value.
 * @param {Function} onChange - Receives a synthetic event with { target: { name, value } }.
 * @param {Array} options - Options: { value, label }.
 * @param {boolean} [compact=false] - Renders a smaller trigger for inline usage.
 */
export default function CustomSelect({
	id,
	name,
	value,
	onChange,
	onBlur,
	options = [],
	placeholder = '',
	disabled = false,
	error = false,
	ariaLabel,
	compact = false,
}) {
	const [open, setOpen] = useState(false);
	const [focusIndex, setFocusIndex] = useState(-1);
	const [dropUp, setDropUp] = useState(false);
	const wrapperRef = useRef(null);
	const triggerRef = useRef(null);
	const listRef = useRef(null);
	const searchBufferRef = useRef('');
	const searchTimerRef = useRef(null);

	const selected = options.find((o) => String(o.value) === String(value));

	const optionLabelsLower = useMemo(
		() => options.map((o) => String(o.label).toLowerCase()),
		[options]
	);

	const close = useCallback(() => {
		setOpen(false);
		setFocusIndex(-1);
	}, []);

	const toggle = () => {
		if (disabled) return;
		if (!open) {
			const rect = triggerRef.current?.getBoundingClientRect();
			if (rect) {
				const spaceBelow = window.innerHeight - rect.bottom;
				setDropUp(spaceBelow < 240 && rect.top > spaceBelow);
			}
		}
		setOpen((prev) => !prev);
	};

	const select = useCallback(
		(opt) => {
			const syntheticEvent = {
				target: { name: name || id, value: opt.value, type: 'select-one' },
			};
			onChange(syntheticEvent);
			close();
			triggerRef.current?.focus();
		},
		[onChange, name, id, close]
	);

	useEffect(() => {
		if (!open) return;
		const handleClickOutside = (e) => {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
				close();
				if (onBlur) {
					onBlur({ target: { name: name || id } });
				}
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [open, close, onBlur, name, id]);

	useEffect(() => {
		if (open && focusIndex >= 0 && listRef.current) {
			const items = listRef.current.querySelectorAll('[role="option"]');
			items[focusIndex]?.scrollIntoView({ block: 'nearest' });
		}
	}, [open, focusIndex]);

	const handleKeyDown = (e) => {
		if (disabled) return;

		const jumpToLetter = (key) => {
			clearTimeout(searchTimerRef.current);
			searchBufferRef.current += key.toLowerCase();
			searchTimerRef.current = setTimeout(() => { searchBufferRef.current = ''; }, 500);

			const query = searchBufferRef.current;
			const idx = optionLabelsLower.findIndex((label) => label.startsWith(query));
			if (idx >= 0) setFocusIndex(idx);
		};

		if (!open) {
			if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
				e.preventDefault();
				setOpen(true);
				const idx = options.findIndex((o) => String(o.value) === String(value));
				setFocusIndex(idx >= 0 ? idx : 0);
			} else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
				e.preventDefault();
				setOpen(true);
				jumpToLetter(e.key);
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				setFocusIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
				break;
			case 'ArrowUp':
				e.preventDefault();
				setFocusIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (focusIndex >= 0 && focusIndex < options.length) {
					select(options[focusIndex]);
				}
				break;
			case 'Escape':
			case 'Tab':
				close();
				if (e.key === 'Tab' && onBlur) {
					onBlur({ target: { name: name || id } });
				}
				break;
			case 'Home':
				e.preventDefault();
				setFocusIndex(0);
				break;
			case 'End':
				e.preventDefault();
				setFocusIndex(options.length - 1);
				break;
			default:
				if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
					e.preventDefault();
					jumpToLetter(e.key);
				}
				break;
		}
	};

	const triggerClass = [
		styles.trigger,
		compact && styles.triggerCompact,
		open && styles.triggerOpen,
		error && styles.triggerError,
		disabled && styles.triggerDisabled,
	]
		.filter(Boolean)
		.join(' ');

	const chevronClass = [
		styles.chevron,
		compact && styles.chevronCompact,
		open && styles.chevronOpen,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<div className={styles.wrapper} ref={wrapperRef}>
			<button
				ref={triggerRef}
				type="button"
				id={id}
				role="combobox"
				aria-expanded={open}
				aria-haspopup="listbox"
				aria-controls={`${id}-listbox`}
				aria-label={ariaLabel}
				className={triggerClass}
				onClick={toggle}
				onKeyDown={handleKeyDown}
				disabled={disabled}
			>
				<span className={`${styles.triggerText} ${!selected ? styles.placeholder : ''}`}>
					{selected ? selected.label : placeholder}
				</span>
				<span className={chevronClass} aria-hidden="true" />
			</button>

			{open && (
				<div
					ref={listRef}
					id={`${id}-listbox`}
					role="listbox"
					aria-activedescendant={
						focusIndex >= 0 ? `${id}-option-${focusIndex}` : undefined
					}
					className={[
						styles.dropdown,
						compact && styles.dropdownCompact,
						dropUp && styles.dropdownUp,
					].filter(Boolean).join(' ')}
				>
					{options.map((opt, i) => {
						const isSelected = String(opt.value) === String(value);
						const isFocused = i === focusIndex;
						const optClass = [
							styles.option,
							compact && styles.optionCompact,
							isSelected && styles.optionSelected,
							isFocused && styles.optionFocused,
						]
							.filter(Boolean)
							.join(' ');

						return (
							<button
								key={opt.value}
								id={`${id}-option-${i}`}
								role="option"
								type="button"
								tabIndex={-1}
								aria-selected={isSelected}
								className={optClass}
								onMouseEnter={() => setFocusIndex(i)}
								onMouseDown={(e) => e.preventDefault()}
								onClick={() => select(opt)}
							>
								{opt.label}
								{isSelected && (
									<span className={styles.checkmark} aria-hidden="true">
										<Icon name="check" size={14} aria-hidden="true" />
									</span>
								)}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
