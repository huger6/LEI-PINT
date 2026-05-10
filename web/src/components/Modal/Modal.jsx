import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Icon from '../Icons/Icons';
import styles from './Modal.module.css';

export default function Modal({ title, children, onClose, footer }) {
	const dialogRef = useRef(null);
	const onCloseRef = useRef(onClose);

	useEffect(() => {
		onCloseRef.current = onClose;
	});

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		dialog.showModal();
		const handleCancel = (e) => {
			e.preventDefault();
			onCloseRef.current();
		};
		dialog.addEventListener('cancel', handleCancel);
		return () => {
			dialog.removeEventListener('cancel', handleCancel);
			dialog.close();
		};
	}, []);

	return (
		<dialog
			ref={dialogRef}
			className={styles.dialog}
			aria-labelledby="modal-title"
			onClick={(e) => {
				if (e.target === dialogRef.current) onCloseRef.current();
			}}
		>
			<div className={styles.header}>
				<h5 id="modal-title" className={styles.title}>{title}</h5>
				<button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
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
};
