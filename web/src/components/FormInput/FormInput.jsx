import styles from './FormInput.module.css';

export default function FormInput({ id, label, error, className, ...inputProps }) {
  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      {label && (
        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
      )}
      <input
        id={id}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...inputProps}
      />
      {error && (
        <span className={styles.errorText} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
