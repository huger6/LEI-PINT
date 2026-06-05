import { useEffect } from 'react';
import Icon from '../Icons/Icons';
import styles from './SaveToast.module.css';

export default function SaveToast({ open = false, message, onClose, duration = 3000 }) {
	useEffect(() => {
		if (!open) return;
		const timer = setTimeout(() => onClose?.(), duration);
		return () => clearTimeout(timer);
	}, [open, duration, onClose]);

	if (!open) return null;

	return (
		<div className={styles.toast} role="status" aria-live="polite">
			<Icon name="check_circle" size={18} color="var(--color-green-on-soft)" />
			<span className={styles.message}>{message}</span>
		</div>
	);
}
