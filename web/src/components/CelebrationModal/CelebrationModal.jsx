import { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Button from '../Button/Button';
import styles from './CelebrationModal.module.css';

const CONFETTI_COLORS = [
	'var(--color-primary)',
	'var(--color-secondary)',
	'var(--color-success)',
	'var(--color-warning)',
	'var(--color-badge-premium)',
];

/**
 * Animated celebration modal with confetti. Defaults to the badge-milestone copy
 * (used by Achievements) but accepts an optional emoji/title/message so it can be
 * reused for other celebrations (e.g. login-streak milestones).
 */
export default function CelebrationModal({ count, onClose, emoji = '🏆', title, message }) {
	const { t } = useTranslation();
	const resolvedTitle = title || t('achievements.celebrate.title');
	const resolvedMessage = message || t('achievements.celebrate.message', { count });

	// Closes the modal when the Escape key is pressed.
	useEffect(() => {
		const onKey = (e) => { if (e.key === 'Escape') onClose(); };
		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [onClose]);

	// Pre-compute confetti pieces once (varying column, delay, colour, drift).
	const pieces = useMemo(
		() => Array.from({ length: 36 }, (_, i) => ({
			left: (i * 2.7 + (i % 5) * 3) % 100,
			delay: ((i % 9) * 0.12).toFixed(2),
			duration: (2.4 + (i % 6) * 0.25).toFixed(2),
			color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
			rotate: (i % 7) * 52,
		})),
		[],
	);

	return (
		<div className={styles.overlay} role="dialog" aria-modal="true" aria-label={resolvedTitle} onClick={onClose}>
			<div className={styles.confetti} aria-hidden="true">
				{pieces.map((p, i) => (
					<span
						key={i}
						className={styles.piece}
						style={{
							left: `${p.left}%`,
							backgroundColor: p.color,
							animationDelay: `${p.delay}s`,
							animationDuration: `${p.duration}s`,
							transform: `rotate(${p.rotate}deg)`,
						}}
					/>
				))}
			</div>

			<div className={styles.card} onClick={(e) => e.stopPropagation()}>
				<div className={styles.emoji} aria-hidden="true">{emoji}</div>
				<h2 className={styles.title}>{resolvedTitle}</h2>
				<p className={styles.message}>{resolvedMessage}</p>
				<Button onClick={onClose}>{t('achievements.celebrate.close')}</Button>
			</div>
		</div>
	);
}

CelebrationModal.propTypes = {
	count: PropTypes.number,
	onClose: PropTypes.func.isRequired,
	emoji: PropTypes.string,
	title: PropTypes.string,
	message: PropTypes.string,
};
