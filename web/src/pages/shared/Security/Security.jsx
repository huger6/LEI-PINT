import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { changePassword } from '../../../features/auth/api/authApi';
import { resolveErrorMessage } from '../../../validations/apiErrors';
import ContentCard, { CardHeader } from '../../../components/ContentCard/ContentCard';
import FormInput from '../../../components/FormInput/FormInput';
import Button from '../../../components/Button/Button';
import Icon from '../../../components/Icons/Icons';
import styles from './Security.module.css';

const MIN_LENGTH = 8;

export default function Security() {
	const { t } = useTranslation();
	const [form, setForm] = useState({ current: '', next: '', confirm: '' });
	const [errors, setErrors] = useState({});
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);

	function handleChange(e) {
		const { name, value } = e.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setErrors((prev) => ({ ...prev, [name]: '', form: '' }));
		setSuccess(false);
	}

	function validate() {
		const next = {};
		if (!form.current) next.current = t('security.errCurrent');
		if (!form.next || form.next.length < MIN_LENGTH) next.next = t('security.errNext', { min: MIN_LENGTH });
		if (form.confirm !== form.next) next.confirm = t('security.errConfirm');
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function handleSubmit(e) {
		e.preventDefault();
		if (!validate()) return;
		setSaving(true);
		try {
			await changePassword(form.current, form.next);
			setSuccess(true);
			setForm({ current: '', next: '', confirm: '' });
		} catch (err) {
			setErrors({ form: resolveErrorMessage(err) });
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className={styles.page}>
			<h1 className={styles.title}>{t('security.title')}</h1>

			<ContentCard className={styles.section}>
				<CardHeader icon="security" iconBg="var(--color-secondary-container)" iconColor="var(--color-secondary)" title={t('security.changePassword')} />
				<form onSubmit={handleSubmit} className={styles.form}>
					<FormInput
						label={t('security.currentPassword')}
						name="current"
						type="password"
						value={form.current}
						onChange={handleChange}
						error={errors.current}
						autoComplete="current-password"
						required
					/>
					<FormInput
						label={t('security.newPassword')}
						name="next"
						type="password"
						value={form.next}
						onChange={handleChange}
						error={errors.next}
						autoComplete="new-password"
						required
					/>
					<FormInput
						label={t('security.confirmPassword')}
						name="confirm"
						type="password"
						value={form.confirm}
						onChange={handleChange}
						error={errors.confirm}
						autoComplete="new-password"
						required
					/>

					{errors.form && <p className="small text-danger mb-0">{errors.form}</p>}
					{success && (
						<p className={styles.success}>
							<Icon name="check_circle" size={16} color="var(--color-success)" aria-hidden="true" /> {t('security.success')}
						</p>
					)}

					<div>
						<Button type="submit" loading={saving}>{t('security.save')}</Button>
					</div>
				</form>
			</ContentCard>
		</div>
	);
}
