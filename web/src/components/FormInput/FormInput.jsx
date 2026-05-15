import styles from './FormInput.module.css';

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
