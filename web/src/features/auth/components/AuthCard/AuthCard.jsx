import styles from './AuthCard.module.css';

export default function AuthCard({ children }) {
  return <div className={styles.card}>{children}</div>;
}
