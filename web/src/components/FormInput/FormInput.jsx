import styles from './FormInput.module.css';

/**
 * Form input field with label, error display, and optional trailing element.
 * @param {string} id - Input element id.
 * @param {string} [label] - Label text shown above the input.
 * @param {string} [error] - Error message shown below the input with red highlight.
 * @param {ReactNode} [trailing] - Element rendered inside the input (e.g. password toggle).
 * @param {boolean} [required] - Shows a red asterisk on the label.
 */
export default function FormInput({
	id,
	label,
	error,
	className,
	inputClassName,
	trailing,
	required,
	...inputProps
}) {
	// Builds the input's class list, applying trailing-element and error styling variants.
	const inputClassNames = `form-control ${styles.input} ${trailing ? styles.inputWithTrailing : ''} ${error ? `is-invalid ${styles.inputError}` : ''} ${inputClassName ?? ''}`.trim();

	return (
		<div className={className ?? ''}>
			{label && (
				<label htmlFor={id} className={`form-label ${styles.label}`}>
					{label}
					{required && <span className={styles.required}> *</span>}
				</label>
			)}
			<div className={styles.inputWrapper}>
				<input
					id={id}
					className={inputClassNames}
					required={required}
					{...inputProps}
				/>
				{trailing && <div className={styles.trailing}>{trailing}</div>}
			</div>
			{error && (
				<div className={`invalid-feedback d-block ${styles.errorText ?? ''}`} role="alert">
					{error}
				</div>
			)}
		</div>
	);
}
