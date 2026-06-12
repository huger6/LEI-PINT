import Icon from '../Icons/Icons';
import styles from './FilterSearchInput.module.css';

/**
 * FilterSearchInput — inline search field for filter bars.
 *
 * Props:
 *   id          {string}   Optional id forwarded to the <input>.
 *   name        {string}   Input name (used by the parent onChange handler).
 *   value       {string}   Controlled value.
 *   onChange    {Function} Native change handler — receives a standard event with
 *                          event.target.{ name, value }.
 *   placeholder {string}   Placeholder text.
 *   ariaLabel   {string}   Accessible label for the input.
 *   className   {string}   Extra class applied to the outer wrapper.
 *   iconSize    {number}   Search icon size in px (default 16).
 *   disabled    {boolean}  Disables the input.
 */
export default function FilterSearchInput({
	id,
	name,
	value,
	onChange,
	placeholder = '',
	ariaLabel,
	className = '',
	iconSize = 16,
	disabled = false,
}) {
	return (
		<div className={`${styles.wrapper} ${className}`.trim()}>
			<Icon
				name="search"
				size={iconSize}
				className={styles.icon}
				aria-hidden="true"
			/>
			<input
				id={id}
				type="text"
				className={styles.input}
				name={name}
				value={value}
				onChange={onChange}
				placeholder={placeholder}
				aria-label={ariaLabel || placeholder}
				disabled={disabled}
			/>
		</div>
	);
}
