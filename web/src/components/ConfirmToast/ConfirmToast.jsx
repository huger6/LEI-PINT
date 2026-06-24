import { useEffect, useRef } from 'react';
import styles from './ConfirmToast.module.css';

/**
 * Confirmation dialog overlay (e.g. "Are you sure you want to logout?").
 * @param {boolean} [open=false] - Controls visibility.
 * @param {string} message - Confirmation message text.
 * @param {Function} onConfirm - Called when the confirm button is clicked.
 * @param {Function} onCancel - Called when cancelled (button, backdrop, or Escape key).
 */
export default function ConfirmToast({
    open = false,
    message,
    confirmLabel = 'Yes',
    cancelLabel = 'No',
    onConfirm,
    onCancel,
}) {
    const confirmRef = useRef(null);

    useEffect(() => {
        if (open) confirmRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onCancel?.();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className={styles.backdrop} onClick={onCancel}>
            <div
                className={styles.toast}
                role="alertdialog"
                aria-modal="true"
                aria-label={message}
                onClick={(e) => e.stopPropagation()}
            >
                <p className={styles.message}>{message}</p>
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={onCancel}
                    >
                        {cancelLabel}
                    </button>
                    <button
                        ref={confirmRef}
                        type="button"
                        className={styles.confirmBtn}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
