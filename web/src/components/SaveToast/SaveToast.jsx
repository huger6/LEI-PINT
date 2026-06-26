import { useEffect } from 'react';
import Icon from '../Icons/Icons';
import styles from './SaveToast.module.css';

/**
 * Auto-dismissing success toast notification.
 * @param {boolean} [open=false] - Controls visibility.
 * @param {string} message - Success message text.
 * @param {Function} [onClose] - Called when the toast auto-dismisses.
 * @param {number} [duration=3000] - Auto-dismiss delay in milliseconds.
 */
// Renders a brief success toast that auto-dismisses after a configurable delay.
export default function SaveToast({ open = false, message, onClose, duration = 3000 }) {
	// Starts a timer to auto-dismiss the toast when it becomes visible.
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
