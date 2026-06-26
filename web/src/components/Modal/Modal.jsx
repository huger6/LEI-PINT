import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import Icon from '../Icons/Icons';
import styles from './Modal.module.css';

/**
 * Accessible modal dialog using the native <dialog> element.
 * @param {string} title - Modal header title.
 * @param {ReactNode} children - Modal body content.
 * @param {Function} onClose - Called when the modal is dismissed (backdrop click, Escape, or close button).
 * @param {ReactNode} [footer] - Optional footer content (e.g. action buttons).
 * @param {'sm'|'md'|'lg'|'xl'} [size='md'] - Modal width preset.
 */
// Renders a native <dialog> element as a modal with header, body, and optional footer.
export default function Modal({ title, children, onClose, footer, size = 'md' }) {
	const { t } = useTranslation();
	// Ref to the native <dialog> element for programmatic control.
	const dialogRef = useRef(null);
	// Ref to keep the latest onClose callback without re-registering event listeners.
	const onCloseRef = useRef(onClose);

	// Keeps onCloseRef in sync with the latest onClose prop on every render.
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	// Opens the dialog on mount and attaches a cancel (Escape) listener; closes on unmount.
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
		const handleCancel = (e) => {
			if (e.target !== dialog) return;
			e.preventDefault();
			onCloseRef.current();
		};
		dialog.addEventListener('cancel', handleCancel);
		return () => {
			dialog.removeEventListener('cancel', handleCancel);
			dialog.close();
		};
	}, []);

	const sizeClass = size !== 'md' ? styles[size] : '';

	return (
		<dialog
			ref={dialogRef}
			className={`${styles.dialog} ${sizeClass}`.trim()}
			aria-labelledby="modal-title"
			onClick={(e) => {
				if (e.target === dialogRef.current) onCloseRef.current();
			}}
		>
			<div className={styles.header}>
				<h5 id="modal-title" className={styles.title}>{title}</h5>
				<button type="button" className={styles.closeBtn} onClick={() => onCloseRef.current()} aria-label={t('shared.close')}>
					<Icon name="close" size={16} aria-hidden="true" />
				</button>
			</div>
			<div className={styles.body}>{children}</div>
			{footer && <div className={styles.footer}>{footer}</div>}
		</dialog>
	);
}

Modal.propTypes = {
	title: PropTypes.string.isRequired,
	children: PropTypes.node.isRequired,
	onClose: PropTypes.func.isRequired,
	footer: PropTypes.node,
	size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
};
