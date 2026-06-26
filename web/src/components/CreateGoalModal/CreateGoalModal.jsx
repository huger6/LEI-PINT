import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal';
import Button from '../Button/Button';
import { createGoal } from '../../features/goals/api/goalsApi';
import { resolveErrorMessage } from '../../validations/apiErrors';
import styles from './CreateGoalModal.module.css';

// Modal to turn a badge into a personal learning objective (goal). Collects the
// fields the goals table supports: title, description, optional start/end dates
// (the deadline) and an optional reminder date.
export default function CreateGoalModal({ badgeId, defaultTitle = '', onClose, onCreated }) {
	// Translation helper
	const { t } = useTranslation();
	// Goal title (prefilled with the badge title)
	const [title, setTitle] = useState(defaultTitle);
	// Optional free-text description
	const [description, setDescription] = useState('');
	// Optional start date (YYYY-MM-DD)
	const [startDate, setStartDate] = useState('');
	// Optional deadline / end date (YYYY-MM-DD)
	const [endDate, setEndDate] = useState('');
	// Optional reminder date (YYYY-MM-DD)
	const [reminder, setReminder] = useState('');
	// In-flight save flag
	const [saving, setSaving] = useState(false);
	// Global submission error
	const [error, setError] = useState(null);
	// Per-field validation messages
	const [fieldErrors, setFieldErrors] = useState({});

	// Validate and create the goal
	async function handleSubmit(e) {
		e?.preventDefault?.();
		const errs = {};
		if (!title.trim()) errs.title = t('createGoal.titleRequired');
		// Deadline cannot precede the start date (also enforced server-side).
		if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
			errs.endDate = t('createGoal.endBeforeStart');
		}
		if (Object.keys(errs).length) { setFieldErrors(errs); return; }

		setFieldErrors({});
		setSaving(true);
		setError(null);
		try {
			const goal = await createGoal({
				badgeId,
				eventTitle: title.trim(),
				eventDescription: description.trim() || null,
				eventStartDate: startDate || null,
				eventEndDate: endDate || null,
				reminderAt: reminder || null,
			});
			onCreated?.(goal);
			onClose?.();
		} catch (err) {
			// 409 → an objective for this badge already exists; treat as success.
			if (err?.response?.status === 409) {
				onCreated?.(null, true);
				onClose?.();
				return;
			}
			setError(resolveErrorMessage(err));
			setSaving(false);
		}
	}

	const footer = (
		<>
			<Button variant="outlined" color="primary" onClick={onClose} disabled={saving}>
				{t('shared.cancel')}
			</Button>
			<Button onClick={handleSubmit} loading={saving}>
				{t('createGoal.create')}
			</Button>
		</>
	);

	return (
		<Modal title={t('createGoal.title')} onClose={onClose} footer={footer}>
			<form className={styles.form} onSubmit={handleSubmit}>
				{error && <div className="alert alert-danger" role="alert">{error}</div>}
				<p className={styles.hint}>{t('createGoal.hint')}</p>

				<label className={styles.field}>
					<span className={styles.label}>{t('createGoal.goalTitle')}</span>
					<input
						className={`${styles.input} ${fieldErrors.title ? styles.inputError : ''}`}
						value={title}
						onChange={(e) => setTitle(e.target.value)}
						maxLength={150}
					/>
					{fieldErrors.title && <span className={styles.error}>{fieldErrors.title}</span>}
				</label>

				<label className={styles.field}>
					<span className={styles.label}>{t('createGoal.description')}</span>
					<textarea
						className={styles.textarea}
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						rows={3}
						maxLength={5000}
					/>
				</label>

				<div className={styles.row}>
					<label className={styles.field}>
						<span className={styles.label}>{t('createGoal.startDate')}</span>
						<input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
					</label>
					<label className={styles.field}>
						<span className={styles.label}>{t('createGoal.deadline')}</span>
						<input
							type="date"
							className={`${styles.input} ${fieldErrors.endDate ? styles.inputError : ''}`}
							value={endDate}
							min={startDate || undefined}
							onChange={(e) => setEndDate(e.target.value)}
						/>
						{fieldErrors.endDate && <span className={styles.error}>{fieldErrors.endDate}</span>}
					</label>
				</div>

				<label className={styles.field}>
					<span className={styles.label}>{t('createGoal.reminder')}</span>
					<input type="date" className={styles.input} value={reminder} onChange={(e) => setReminder(e.target.value)} />
				</label>
			</form>
		</Modal>
	);
}
