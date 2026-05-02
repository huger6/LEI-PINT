import styles from './FormButton.module.css';

export default function FormButton({
  children,
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${styles.btn} ${styles[variant]} ${loading ? styles.loading : ''} ${className ?? ''}`}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : null}
      <span className={loading ? styles.hiddenText : ''}>{children}</span>
    </button>
  );
}
