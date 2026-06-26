import { useCallback } from 'react';
import styles from './RangeSlider.module.css';

/**
 * Dual-thumb range slider for selecting a min/max value range.
 * @param {string} [label] - Label text shown above the slider.
 * @param {number} [min=0] - Minimum selectable value.
 * @param {number} [max=100] - Maximum selectable value.
 * @param {number[]} [value=[0,100]] - Current [low, high] selection.
 * @param {Function} onChange - Called with the updated [low, high] array.
 */
// Renders a dual-thumb range slider for selecting a min/max value range.
export default function RangeSlider({
	id,
	label,
	min = 0,
	max = 100,
	value = [0, 100],
	onChange,
	disabled = false,
}) {
	const [low, high] = value;
	const range = max - min;
	const pctLow = range > 0 ? ((low - min) / range) * 100 : 0;
	const pctHigh = range > 0 ? ((high - min) / range) * 100 : 100;

	// Handles the low (minimum) thumb input and clamps it below the high value.
	const handleLow = useCallback(
		(e) => {
			const v = Number(e.target.value);
			onChange([Math.min(v, high), high]);
		},
		[onChange, high],
	);

	// Handles the high (maximum) thumb input and clamps it above the low value.
	const handleHigh = useCallback(
		(e) => {
			const v = Number(e.target.value);
			onChange([low, Math.max(v, low)]);
		},
		[onChange, low],
	);

	if (max <= min) return null;

	const isDefault = low === min && high === max;

	return (
		<div className={`${styles.wrapper} ${disabled ? styles.disabled : ''}`}>
			{label && (
				<span className={styles.label}>
					{label}
					{!isDefault && (
						<span className={styles.badge}>{low} - {high}</span>
					)}
				</span>
			)}
			<div className={styles.track}>
				<div
					className={styles.fill}
					style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }}
					aria-hidden="true"
				/>
				<input
					id={`${id}-low`}
					type="range"
					className={styles.input}
					min={min}
					max={max}
					value={low}
					onInput={handleLow}
					disabled={disabled}
					aria-label={`${label} minimum`}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={low}
				/>
				<input
					id={`${id}-high`}
					type="range"
					className={styles.input}
					min={min}
					max={max}
					value={high}
					onInput={handleHigh}
					disabled={disabled}
					aria-label={`${label} maximum`}
					aria-valuemin={min}
					aria-valuemax={max}
					aria-valuenow={high}
				/>
			</div>
			<div className={styles.values}>
				<span className={styles.bound}>{min}</span>
				<span className={styles.bound}>{max}</span>
			</div>
		</div>
	);
}
