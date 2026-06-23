import styles from './AuthCard.module.css';

/** Styled card container for authentication pages (login, register, forgot password). */
export default function AuthCard({ children }) {
	return <div className={styles.card}>{children}</div>;
}
